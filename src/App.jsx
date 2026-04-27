import React, { useEffect, useState } from 'react'
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
  subscribePreviewDrive,
  syncPreviewEntries,
} from './previewDrive'

export default function App() {
  const runtime = window.__SG_RUNTIME__ || {}
  const isPreview = runtime.preview === true
  const [entries, setEntries] = useState([])
  const [tab, setTab] = useState('liste')
  const [selected, setSelected] = useState(null)
  const [toast, setToast] = useState(null)
  const [online, setOnline] = useState(navigator.onLine)
  const [driveState, setDriveState] = useState(getPreviewDriveState())
  const visibleEntries = entries.filter((entry) => !entry.deletedAt)

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
        {isPreview && <div className="banner-preview">Preview redesign partagee · memes donnees que la version classique</div>}
        {!online && <div className="banner-offline">Hors ligne — les modifs sont conservées en local</div>}
        {tab === 'ajouter'  && <div className="screen"><AddForm onAdd={onAdd} onDone={() => setTab('liste')}/></div>}
        {tab === 'liste'    && <Liste entries={visibleEntries} onSelect={setSelected}/>} 
        {tab === 'carte'    && <Carte entries={visibleEntries} onSelect={setSelected}/>} 
        {tab === 'reglages' && <Reglages isPreview={isPreview} runtime={runtime} driveState={driveState} onConnectDrive={handlePreviewConnect} onDisconnectDrive={handlePreviewDisconnect} onSyncNow={handlePreviewSyncNow}/>} 
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
        {isPreview && <div className="banner-preview desktop-preview">Preview redesign partagee · memes donnees que la version classique</div>}
        {toast && <Toast kind={toast.kind} onClose={() => setToast(null)}>{toast.msg}</Toast>}
      </div>
    </>
  )
}
