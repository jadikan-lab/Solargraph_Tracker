import React, { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import db from './db'
import { TabBar, Toast } from './ui.jsx'
import AddForm from './components/AddForm'
import Liste from './screens/Liste'
import Carte from './screens/Carte'
import Detail from './screens/Detail'
import Reglages from './screens/Reglages'
import {
  connectPreviewDrive,
  disconnectPreviewDrive,
  getPreviewDriveState,
  initPreviewDrive,
  publishPreviewToMyDrive,
  setPreviewAutoPublishEnabled,
  subscribePreviewDrive,
  syncPreviewEntries,
  verifyPreviewDrivePublication,
} from './previewDrive'

const CSV_EXPORT_COUNTER_KEY = 'solargraph_csv_export_counter'
const CSV_EXPORT_LAST_AT_KEY = 'solargraph_csv_export_last_at'

function readNumberStorage(key, fallback = 0) {
  try {
    const value = Number(localStorage.getItem(key) || String(fallback))
    return Number.isFinite(value) ? value : fallback
  } catch {
    return fallback
  }
}

export default function App() {
  const runtime = window.__SG_RUNTIME__ || {}
  const isPreview = runtime.preview === true
  const [entries, setEntries] = useState([])
  const [tab, setTab] = useState('liste')
  const [selected, setSelected] = useState(null)
  const [toast, setToast] = useState(null)
  const [online, setOnline] = useState(navigator.onLine)
  const [driveState, setDriveState] = useState(getPreviewDriveState())
  const [csvArchiveCount, setCsvArchiveCount] = useState(() => readNumberStorage(CSV_EXPORT_COUNTER_KEY, 0))
  const [csvLastExportAt, setCsvLastExportAt] = useState(() => readNumberStorage(CSV_EXPORT_LAST_AT_KEY, 0))
  const visibleEntries = entries.filter((entry) => !entry.deletedAt)
  const tabRef = useRef(tab)
  const selectedRef = useRef(selected)

  useEffect(() => { tabRef.current = tab; setToast(null) }, [tab])
  useEffect(() => { selectedRef.current = selected }, [selected])

  useEffect(() => {
    const load = async () => setEntries(await db.getEntries())
    load()
    const iv = setInterval(load, 2000)
    const on = () => setOnline(true), off = () => setOnline(false)
    window.addEventListener('online', on); window.addEventListener('offline', off)
    return () => { clearInterval(iv); window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  useEffect(() => {
    if (!isPreview) return undefined

    initPreviewDrive()
    return subscribePreviewDrive(setDriveState)
  }, [isPreview])

  useEffect(() => {
    // Keep back button inside the SPA: close detail -> go to list -> stay in app.
    if (!window.history.state?.sgApp) {
      window.history.replaceState({ sgApp: true }, '')
    }
    window.history.pushState({ sgApp: true }, '')

    const onPopState = () => {
      if (selectedRef.current) {
        setSelected(null)
      } else if (tabRef.current !== 'liste') {
        setTab('liste')
      } else {
        setToast({ kind: 'info', msg: 'Utilise le menu navigateur pour quitter.' })
      }
      window.history.pushState({ sgApp: true }, '')
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const refresh = async () => setEntries(await db.getEntries())

  const syncPreviewIfNeeded = async (successMessage) => {
    const localEntries = await db.getEntries()
    let nextEntries = localEntries

    if (isPreview && driveState.authenticated) {
      try {
        nextEntries = await syncPreviewEntries(localEntries)
        await db.replaceEntries(nextEntries)
      } catch (error) {
        setEntries(localEntries)
        setToast({ kind: 'error', msg: `Sync Drive preview impossible: ${error.message}` })
        return localEntries
      }
    }

    setEntries(nextEntries)
    if (isPreview && driveState.authenticated && driveState.autoPublishEnabled) {
      try {
        await publishPreviewToMyDrive(nextEntries)
      } catch (error) {
        setToast({ kind: 'error', msg: `Auto-publish impossible: ${error.message}` })
      }
    }
    if (successMessage) {
      const suffix = isPreview && driveState.authenticated ? ' · Drive partagé synchro' : ' · synchro non active'
      setToast({ kind: 'success', msg: successMessage + suffix })
    }
    return nextEntries
  }

  const onAdd = async (entry) => {
    await db.addEntry(entry)
    await syncPreviewIfNeeded('Sténopé enregistré')
    setTab('liste')
  }

  const onUpdate = async (id, patch) => {
    await db.updateEntry(id, patch)
    await syncPreviewIfNeeded('Mis à jour')
  }

  const onDelete = async (id) => {
    await db.deleteEntry?.(id)
    await syncPreviewIfNeeded('Envoyé en corbeille')
    setSelected(null)
  }

  const csvSafe = (value) => {
    const text = String(value ?? '').replace(/\r?\n/g, ' ')
    return `"${text.replace(/"/g, '""')}"`
  }

  const formatDate = (value) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleString('fr-FR')
  }

  const toCsvRows = (rows) => {
    const header = [
      'id', 'nom', 'statut', 'date_pose', 'date_recuperation', 'jours_exposition',
      'boite', 'diametre_mm', 'papier', 'orientation', 'latitude', 'longitude', 'precision_gps_m',
      'notes_pose', 'note_recuperation'
    ]

    const body = rows.map((entry) => {
      const retrievalDate = entry.retrievalDate || null
      const durationEnd = retrievalDate || Date.now()
      const days = Math.max(0, Math.floor((durationEnd - (entry.createdAt || Date.now())) / 86400000))
      return [
        entry.id || '',
        entry.name || '',
        retrievalDate ? 'recupere' : 'en_place',
        formatDate(entry.createdAt),
        formatDate(retrievalDate),
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

    return [header, ...body].map((line) => line.map(csvSafe).join(',')).join('\n')
  }

  const downloadCsv = (fileName, csvContent) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = fileName
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  const handleExportCsv = async () => {
    const allEntries = (await db.getEntries()).filter((entry) => !entry.deletedAt)
    const csv = toCsvRows(allEntries)

    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const hh = String(now.getHours()).padStart(2, '0')
    const mi = String(now.getMinutes()).padStart(2, '0')
    const ss = String(now.getSeconds()).padStart(2, '0')

    const previous = Number(localStorage.getItem(CSV_EXPORT_COUNTER_KEY) || '0')
    const next = Number.isFinite(previous) ? previous + 1 : 1
    localStorage.setItem(CSV_EXPORT_COUNTER_KEY, String(next))
    const exportedAt = Date.now()
    localStorage.setItem(CSV_EXPORT_LAST_AT_KEY, String(exportedAt))
    const seq = String(next).padStart(4, '0')

    const archiveName = `solargraph_export_${yyyy}${mm}${dd}_${hh}${mi}${ss}_${seq}.csv`
    const latestName = 'solargraph_export_latest.csv'

    downloadCsv(archiveName, csv)
    downloadCsv(latestName, csv)

    setCsvArchiveCount(next)
    setCsvLastExportAt(exportedAt)

    setToast({ kind: 'success', msg: `CSV exporté (${allEntries.length} entrées) · archive #${seq}` })
  }

  const handlePreviewConnect = async () => {
    try {
      await connectPreviewDrive({ forceAccountChooser: true })
      const merged = await syncPreviewEntries(await db.getEntries())
      await db.replaceEntries(merged)
      setEntries(merged)
      setToast({ kind: 'success', msg: 'Compte Google connecté · preview synchronisée' })
    } catch (error) {
      setToast({ kind: 'error', msg: `Connexion Google impossible: ${error.message}` })
    }
  }

  const handlePreviewDisconnect = async () => {
    await disconnectPreviewDrive()
    setToast({ kind: 'success', msg: 'Compte Google déconnecté pour la preview' })
  }

  const handlePreviewSyncNow = async () => {
    try {
      const merged = await syncPreviewEntries(await db.getEntries())
      await db.replaceEntries(merged)
      setEntries(merged)
      setToast({ kind: 'success', msg: 'Preview synchronisée avec Drive' })
    } catch (error) {
      setToast({ kind: 'error', msg: `Sync Drive impossible: ${error.message}` })
    }
  }

  const handlePreviewPublish = async () => {
    try {
      const result = await publishPreviewToMyDrive(await db.getEntries())
      setToast({ kind: 'success', msg: `Publication Drive visible ok · ${result.entries} entrées · ${result.photos} photos` })
    } catch (error) {
      setToast({ kind: 'error', msg: `Publication Drive visible impossible: ${error.message}` })
    }
  }

  const handlePreviewToggleAutoPublish = (enabled) => {
    const next = setPreviewAutoPublishEnabled(enabled)
    setToast({ kind: 'success', msg: next ? 'Auto-publish activé' : 'Auto-publish désactivé' })
  }

  const handlePreviewIntegrityCheck = async () => {
    try {
      const result = await verifyPreviewDrivePublication(await db.getEntries())
      setToast({ kind: result.ok ? 'success' : 'error', msg: result.summary })
    } catch (error) {
      setToast({ kind: 'error', msg: `Contrôle d'intégrité impossible: ${error.message}` })
    }
  }

  if (selected) {
    return (
      <div className="app-shell">
        <Detail entry={entries.find((e) => e.id === selected.id) || selected}
                onBack={() => setSelected(null)} onUpdate={onUpdate} onDelete={onDelete}/>
        {toast && <Toast kind={toast.kind} onClose={() => setToast(null)}>{toast.msg}</Toast>}
      </div>
    )
  }

  return (
    <>
      {/* Mobile shell */}
      <div className="app-shell mobile-only">
        {isPreview && tab === 'reglages' && <div className="banner-preview">Preview · mêmes données que la version classique</div>}
        {!online && <div className="banner-offline">Hors ligne — les modifs sont conservées en local</div>}
        {tab === 'ajouter'  && <div className="screen"><AddForm onAdd={onAdd} onDone={() => setTab('liste')}/></div>}
        {tab === 'liste'    && <Liste entries={visibleEntries} onSelect={setSelected}/>} 
        {tab === 'carte'    && <Carte entries={visibleEntries} onSelect={setSelected}/>} 
        {tab === 'reglages' && <Reglages isPreview={isPreview} runtime={runtime} driveState={driveState} onConnectDrive={handlePreviewConnect} onDisconnectDrive={handlePreviewDisconnect} onSyncNow={handlePreviewSyncNow} onPublishDrive={handlePreviewPublish} onToggleAutoPublish={handlePreviewToggleAutoPublish} onCheckIntegrity={handlePreviewIntegrityCheck} onExportCsv={handleExportCsv} exportStats={{ entriesCount: visibleEntries.length, archiveCount: csvArchiveCount, lastExportAt: csvLastExportAt }}/>} 
        <TabBar active={tab} onTab={setTab}/>
        {toast && <Toast kind={toast.kind} onClose={() => setToast(null)}>{toast.msg}</Toast>}
      </div>

      {/* Desktop shell — consultation seule */}
      <div className="desktop desktop-only">
        <aside className="nav">
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 500, fontSize: 22 }}>Solargraph</div>
            <div className="cap" style={{ marginTop: 4 }}>{isPreview ? 'preview redesign · donnees partagees' : 'tracker · consultation'}</div>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[{ id: 'liste', l: 'Liste' }, { id: 'carte', l: 'Carte' }, { id: 'reglages', l: 'Réglages' }].map((it) => (
              <button key={it.id} onClick={() => setTab(it.id)} style={{
                textAlign: 'left', padding: '10px 12px', borderRadius: 10,
                border: '1px solid ' + (tab === it.id ? 'var(--papier-edge)' : 'transparent'),
                background: tab === it.id ? 'var(--papier-2)' : 'transparent',
                color: 'var(--encre)', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}>{it.l}</button>
            ))}
          </nav>
          <div style={{ flex: 1 }}/>
          <div className="card">
            <div style={{ fontSize: 12, fontWeight: 600 }}>{isPreview ? 'Drive preview' : 'Drive synchronisé'}</div>
            <div style={{ fontSize: 11.5, color: 'var(--encre-mute)' }}>
              {isPreview
                ? (driveState.authenticated
                    ? `${driveState.email || 'compte connecté'} · ${driveState.lastSyncAt ? new Date(driveState.lastSyncAt).toLocaleTimeString('fr-FR') : 'jamais synchronisé'}`
                    : 'compte non connecté')
                : `il y a 2 min · ${online ? 'Wi-Fi' : 'hors ligne'}`}
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--encre-mute)', fontFamily: 'var(--font-mono)' }}>ajout : mobile uniquement</div>
          </div>
        </aside>
        <section className="center">
          <Carte entries={entries} onSelect={setSelected}/>
        </section>
        <aside className="right">
          <Liste entries={visibleEntries} onSelect={setSelected}/>
        </aside>
        {isPreview && tab === 'reglages' && <div className="banner-preview desktop-preview">Preview · mêmes données que la version classique</div>}
        {toast && <Toast kind={toast.kind} onClose={() => setToast(null)}>{toast.msg}</Toast>}
      </div>
    </>
  )
}
