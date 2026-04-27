const GOOGLE_CLIENT_ID = '724133061731-g3lmkdkm84ejd2utads9a0i2sj63m1j9.apps.googleusercontent.com'
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'

const runtime = window.__SG_RUNTIME__ || {}
const modeKey = runtime.mode || 'default'
const driveFileName = runtime.driveFileName || 'solargraph_entries_preview.json'
const lastSyncKey = `solargraph_last_drive_sync_${modeKey}`

const listeners = new Set()

let googleScriptPromise = null
let tokenClient = null
let accessToken = null
let driveFileId = null
let pendingAuth = null

const state = {
  ready: false,
  authenticated: false,
  syncing: false,
  email: '',
  name: '',
  error: '',
  lastSyncAt: readNumber(lastSyncKey),
  driveFileName,
}

function readNumber(key) {
  try {
    const value = localStorage.getItem(key)
    return value ? Number(value) : null
  } catch {
    return null
  }
}

function writeNumber(key, value) {
  try {
    localStorage.setItem(key, String(value))
  } catch {
    // Ignore localStorage failures in preview mode.
  }
}

function emit() {
  const snapshot = { ...state }
  listeners.forEach((listener) => listener(snapshot))
}

function setState(patch) {
  Object.assign(state, patch)
  emit()
}

function getErrorMessage(error) {
  if (!error) return 'Erreur inconnue'
  if (typeof error === 'string') return error
  return error.message || error.error || error.type || 'Erreur inconnue'
}

function loadGoogleScript() {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  if (googleScriptPromise) return googleScriptPromise

  googleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-gsi="true"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Impossible de charger Google Identity Services.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.dataset.googleGsi = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Impossible de charger Google Identity Services.'))
    document.head.appendChild(script)
  })

  return googleScriptPromise
}

function ensureTokenClient() {
  if (tokenClient) return tokenClient
  if (!window.google?.accounts?.oauth2) throw new Error('SDK Google non chargé')

  tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: DRIVE_SCOPE,
    error_callback: (error) => {
      const message = getErrorMessage(error)
      setState({ error: message })
      if (pendingAuth) {
        pendingAuth.reject(new Error(message))
        pendingAuth = null
      }
    },
    callback: async (response) => {
      if (response.error) {
        const message = getErrorMessage(response)
        setState({ error: message })
        if (pendingAuth) {
          pendingAuth.reject(new Error(message))
          pendingAuth = null
        }
        return
      }

      accessToken = response.access_token
      try {
        const profile = await fetchGoogleProfile()
        setState({
          authenticated: true,
          email: profile.email || '',
          name: profile.name || '',
          error: '',
        })
        if (pendingAuth) pendingAuth.resolve({ ...profile })
      } catch (error) {
        const message = getErrorMessage(error)
        setState({ authenticated: true, error: message })
        if (pendingAuth) pendingAuth.resolve({})
      } finally {
        pendingAuth = null
      }
    },
  })

  return tokenClient
}

async function fetchGoogleProfile() {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) throw new Error('Impossible de récupérer le profil Google.')
  return response.json()
}

async function driveFind() {
  const query = encodeURIComponent(`name='${driveFileName}'`)
  const response = await fetch(`https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${query}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) throw new Error('Lecture du fichier Drive impossible.')
  const payload = await response.json()
  return payload.files?.[0]?.id || null
}

async function driveRead(fileId) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) throw new Error('Lecture des données Drive impossible.')
  return response.json()
}

async function driveWrite(entries) {
  const content = JSON.stringify(entries)

  if (driveFileId) {
    const response = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${driveFileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: content,
    })
    if (!response.ok) throw new Error('Mise à jour du fichier Drive impossible.')
  } else {
    const boundary = `solar_preview_${Date.now()}`
    const metadata = JSON.stringify({ name: driveFileName, parents: ['appDataFolder'] })
    const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${content}\r\n--${boundary}--`
    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    })
    if (!response.ok) throw new Error('Création du fichier Drive impossible.')
    const payload = await response.json()
    driveFileId = payload.id || null
  }

  const now = Date.now()
  writeNumber(lastSyncKey, now)
  setState({ lastSyncAt: now, error: '' })
}

function entryModifiedAt(entry) {
  return Number(entry?.updatedAt || entry?.retrievalDate || entry?.createdAt || 0)
}

function mergeEntries(localEntries, driveEntries) {
  const byId = new Map()

  for (const entry of driveEntries || []) {
    if (entry?.id) byId.set(entry.id, entry)
  }

  for (const entry of localEntries || []) {
    if (!entry?.id) continue
    const previous = byId.get(entry.id)
    if (!previous || entryModifiedAt(entry) >= entryModifiedAt(previous)) {
      byId.set(entry.id, entry)
    }
  }

  return Array.from(byId.values()).sort((left, right) => (right.createdAt || 0) - (left.createdAt || 0))
}

export function getPreviewDriveState() {
  return { ...state }
}

export function subscribePreviewDrive(listener) {
  listeners.add(listener)
  listener(getPreviewDriveState())
  return () => listeners.delete(listener)
}

export async function initPreviewDrive() {
  if (!runtime.preview) return getPreviewDriveState()
  try {
    await loadGoogleScript()
    ensureTokenClient()
    setState({ ready: true, error: '' })
  } catch (error) {
    setState({ ready: false, error: getErrorMessage(error) })
  }
  return getPreviewDriveState()
}

export async function connectPreviewDrive({ forceAccountChooser = true } = {}) {
  await initPreviewDrive()
  ensureTokenClient()

  return new Promise((resolve, reject) => {
    pendingAuth = { resolve, reject }
    tokenClient.requestAccessToken({ prompt: forceAccountChooser ? 'select_account consent' : 'consent' })
  })
}

export async function disconnectPreviewDrive() {
  if (accessToken && window.google?.accounts?.oauth2) {
    await new Promise((resolve) => window.google.accounts.oauth2.revoke(accessToken, resolve))
  }

  accessToken = null
  driveFileId = null
  setState({
    authenticated: false,
    email: '',
    name: '',
    error: '',
  })
}

export async function syncPreviewEntries(localEntries) {
  if (!accessToken) return localEntries

  setState({ syncing: true, error: '' })
  try {
    driveFileId = await driveFind()
    if (!driveFileId) {
      await driveWrite(localEntries)
      return localEntries
    }

    const driveEntries = await driveRead(driveFileId)
    const merged = mergeEntries(localEntries, Array.isArray(driveEntries) ? driveEntries : [])
    await driveWrite(merged)
    return merged
  } catch (error) {
    setState({ error: getErrorMessage(error) })
    throw error
  } finally {
    setState({ syncing: false })
  }
}