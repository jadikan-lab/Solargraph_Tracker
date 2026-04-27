const GOOGLE_CLIENT_ID = '724133061731-g3lmkdkm84ejd2utads9a0i2sj63m1j9.apps.googleusercontent.com'
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile'

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
  publishing: false,
  email: '',
  name: '',
  error: '',
  lastSyncAt: readNumber(lastSyncKey),
  lastPublishAt: null,
  publishFolderId: '',
  publishFolderLink: '',
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

function sanitize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_\-.]/g, '')
}

function entryFilename(entry, index, isFinal = false) {
  const date = new Date(entry.createdAt || Date.now())
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const suffix = isFinal ? 'final' : String(index)
  return `${yyyy}-${mm}-${dd}_${sanitize(entry.boxType)}_${sanitize(entry.paperType)}_${sanitize(entry.holeDiameter_mm)}_${suffix}.jpg`
}

function entryFolderName(entry, index) {
  const date = new Date(entry.createdAt || Date.now())
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const seq = String(index + 1).padStart(3, '0')
  return `${yyyy}-${mm}-${dd}_${seq}_${sanitize(entry.boxType)}_${sanitize(entry.paperType)}`
}

function toDataUrlBlob(dataUrl) {
  const [prefix, base64] = String(dataUrl || '').split(',')
  const mime = /data:(.*?);base64/.exec(prefix || '')?.[1] || 'application/octet-stream'
  const binary = atob(base64 || '')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

function csvEscape(value) {
  const text = String(value ?? '').replace(/\r?\n/g, ' ')
  return `"${text.replace(/"/g, '""')}"`
}

function toCsv(entries) {
  const header = [
    'id', 'nom', 'statut', 'date_pose', 'date_recuperation', 'jours_exposition',
    'boite', 'diametre_mm', 'papier', 'orientation', 'latitude', 'longitude', 'precision_gps_m',
    'notes_pose', 'note_recuperation'
  ]
  const rows = entries.map((entry) => {
    const retrievalDate = entry.retrievalDate || null
    const end = retrievalDate || Date.now()
    const days = Math.max(0, Math.floor((end - (entry.createdAt || Date.now())) / 86400000))
    return [
      entry.id || '',
      entry.name || '',
      retrievalDate ? 'recupere' : 'en_place',
      entry.createdAt ? new Date(entry.createdAt).toLocaleString('fr-FR') : '',
      retrievalDate ? new Date(retrievalDate).toLocaleString('fr-FR') : '',
      String(days),
      entry.boxType || '',
      entry.holeDiameter_mm ?? '',
      entry.paperType || '',
      entry.orientation || '',
      entry.location?.lat ?? '',
      entry.location?.lng ?? '',
      entry.location?.accuracy ?? '',
      entry.notes || '',
      entry.retrievalNote || '',
    ]
  })
  return [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n')
}

async function driveRequestJson(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.headers || {}),
    },
  })
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Drive API ${response.status}: ${text || 'Erreur inconnue'}`)
  }
  if (response.status === 204) return {}
  return response.json()
}

async function driveFindFolder(name, parentId = 'root') {
  const query = encodeURIComponent(`name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`)
  const payload = await driveRequestJson(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`) 
  return payload.files?.[0]?.id || null
}

async function driveCreateFolder(name, parentId = 'root') {
  const payload = await driveRequestJson('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', parents: [parentId] }),
  })
  return payload.id || null
}

async function driveFindFileInFolder(folderId, fileName, mimeType) {
  let raw = `name='${fileName}' and '${folderId}' in parents and trashed=false`
  if (mimeType) raw += ` and mimeType='${mimeType}'`
  const query = encodeURIComponent(raw)
  const payload = await driveRequestJson(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,webViewLink)`) 
  return payload.files?.[0] || null
}

async function uploadJsonToFolder(folderId, fileName, payload) {
  const existing = await driveFindFileInFolder(folderId, fileName)
  const content = JSON.stringify(payload)
  if (existing?.id) {
    await driveRequestJson(`https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=media`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: content,
    })
    return existing.id
  }

  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify({ name: fileName, parents: [folderId] })], { type: 'application/json' }))
  form.append('file', new Blob([content], { type: 'application/json' }), fileName)
  const created = await driveRequestJson('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    body: form,
  })
  return created.id || null
}

async function uploadCsvToFolder(folderId, fileName, csvContent) {
  const existing = await driveFindFileInFolder(folderId, fileName)
  if (existing?.id) {
    await driveRequestJson(`https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=media`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'text/csv;charset=utf-8' },
      body: csvContent,
    })
    return existing.id
  }

  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify({ name: fileName, parents: [folderId] })], { type: 'application/json' }))
  form.append('file', new Blob([csvContent], { type: 'text/csv;charset=utf-8' }), fileName)
  const created = await driveRequestJson('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    body: form,
  })
  return created.id || null
}

async function uploadCsvAsSheet(folderId, sheetName, csvContent) {
  const existing = await driveFindFileInFolder(folderId, sheetName, 'application/vnd.google-apps.spreadsheet')
  if (existing?.id) {
    // Recreate to replace content reliably without extra Sheets API complexity.
    await driveRequestJson(`https://www.googleapis.com/drive/v3/files/${existing.id}`, { method: 'DELETE' })
  }

  const metadata = {
    name: sheetName,
    parents: [folderId],
    mimeType: 'application/vnd.google-apps.spreadsheet',
  }
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  form.append('file', new Blob([csvContent], { type: 'text/csv;charset=utf-8' }), `${sheetName}.csv`)
  const created = await driveRequestJson('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST',
    body: form,
  })
  return created
}

async function uploadImageToFolder(folderId, fileName, dataUrl) {
  const existing = await driveFindFileInFolder(folderId, fileName)
  if (existing?.id) return existing

  const blob = toDataUrlBlob(dataUrl)
  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify({ name: fileName, parents: [folderId] })], { type: 'application/json' }))
  form.append('file', blob, fileName)
  return driveRequestJson('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
    method: 'POST',
    body: form,
  })
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

export async function publishPreviewToMyDrive(entries) {
  if (!accessToken) throw new Error('Compte Google non connecté.')

  setState({ publishing: true, error: '' })
  try {
    const visibleEntries = (entries || []).filter((entry) => !entry?.deletedAt)
    let mainFolderId = await driveFindFolder('Solargraph_Tracker')
    if (!mainFolderId) mainFolderId = await driveCreateFolder('Solargraph_Tracker')
    if (!mainFolderId) throw new Error('Impossible de créer le dossier Solargraph_Tracker.')

    const sorted = [...visibleEntries].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
    const indexById = new Map(sorted.map((entry, index) => [entry.id, index]))

    let uploadedPhotos = 0
    for (const entry of sorted) {
      const folderName = entryFolderName(entry, indexById.get(entry.id) || 0)
      let entryFolderId = await driveFindFolder(folderName, mainFolderId)
      if (!entryFolderId) entryFolderId = await driveCreateFolder(folderName, mainFolderId)
      if (!entryFolderId) continue

      const photos = Array.isArray(entry.photos) ? entry.photos : []
      for (let i = 0; i < photos.length; i++) {
        if (!photos[i]) continue
        await uploadImageToFolder(entryFolderId, entryFilename(entry, i, false), photos[i])
        uploadedPhotos += 1
      }

      if (entry.finalPhotoDataURL) {
        await uploadImageToFolder(entryFolderId, entryFilename(entry, -1, true), entry.finalPhotoDataURL)
        uploadedPhotos += 1
      }
    }

    await uploadJsonToFolder(mainFolderId, 'solargraph_entries_latest.json', visibleEntries)
    const csvContent = toCsv(visibleEntries)
    await uploadCsvToFolder(mainFolderId, 'solargraph_entries_latest.csv', csvContent)
    const sheet = await uploadCsvAsSheet(mainFolderId, 'solargraph_entries_latest_sheet', csvContent)

    const now = Date.now()
    setState({
      publishing: false,
      lastPublishAt: now,
      publishFolderId: mainFolderId,
      publishFolderLink: `https://drive.google.com/drive/folders/${mainFolderId}`,
      error: '',
    })

    return {
      folderId: mainFolderId,
      folderLink: `https://drive.google.com/drive/folders/${mainFolderId}`,
      sheetLink: sheet?.webViewLink || '',
      photos: uploadedPhotos,
      entries: visibleEntries.length,
    }
  } catch (error) {
    setState({ publishing: false, error: getErrorMessage(error) })
    throw error
  }
}