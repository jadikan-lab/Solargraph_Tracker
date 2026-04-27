import React from 'react'
import { ScreenTitle, StatusHero, Card, Chip, Btn, IconArrowR, IconPlus, IconEdit } from '../ui.jsx'

const DEFAULT_BOX_TYPES = ['5x7 can', 'large (5x3.5)', 'small (2.5x3.5)', 'mini', 'custom']
const DEFAULT_HOLES = ['0.26', '0.4', '0.5']
const DEFAULT_PAPERS = ['Fomaspeed 311', 'RA4 Fujichristal', 'Ilford RC', 'Ilford FB', 'random']

function readList(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null')
    return Array.isArray(parsed) && parsed.length ? parsed : fallback
  } catch {
    return fallback
  }
}

function writeList(key, values) {
  try {
    localStorage.setItem(key, JSON.stringify(values))
  } catch {
    // Ignore localStorage write errors.
  }
}

function ListEditor({ title, items, placeholder, onChange }) {
  const [draft, setDraft] = React.useState('')

  const addItem = () => {
    const next = draft.trim()
    if (!next || items.includes(next)) return
    onChange([...items, next])
    setDraft('')
  }

  const removeAt = (index) => onChange(items.filter((_, i) => i !== index))

  return (
    <Card flat>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 8px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>{title}</div>
        <button onClick={addItem} style={{ width: 30, height: 30, borderRadius: 999, border: '1px solid var(--papier-edge)', background: 'var(--papier-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconPlus size={14}/></button>
      </div>
      <div style={{ padding: '0 14px 10px', display: 'flex', gap: 8 }}>
        <input className="input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder}
               onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem() } }}/>
        <Btn kind="paper" size="sm" onClick={addItem}>Ajouter</Btn>
      </div>
      <div style={{ padding: '0 14px 14px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {items.map((it, i) => <Chip key={i} icon={<IconEdit size={11}/>} onRemove={() => removeAt(i)}>{it}</Chip>)}
      </div>
    </Card>
  )
}

function syncSubline(driveState) {
  if (!driveState?.authenticated) return 'Compte non connecté · aucune synchro active'
  if (driveState.syncing) return 'Synchronisation preview en cours…'
  if (driveState.lastSyncAt) return `Dernière sync ${new Date(driveState.lastSyncAt).toLocaleString('fr-FR')}`
  return 'Connecté · pas encore synchronisé'
}

export default function Reglages({
  isPreview = false,
  runtime = {},
  driveState = {},
  onConnectDrive,
  onDisconnectDrive,
  onSyncNow,
  onPublishDrive,
  onToggleAutoPublish,
  onCheckIntegrity,
  onExportCsv,
  exportStats = {},
}) {
  const [boxItems, setBoxItems] = React.useState(() => readList('solar_box_types', DEFAULT_BOX_TYPES))
  const [holeItems, setHoleItems] = React.useState(() => readList('solar_holes', DEFAULT_HOLES))
  const [paperItems, setPaperItems] = React.useState(() => readList('solar_papers', DEFAULT_PAPERS))

  React.useEffect(() => {
    const onStorage = () => {
      setBoxItems(readList('solar_box_types', DEFAULT_BOX_TYPES))
      setHoleItems(readList('solar_holes', DEFAULT_HOLES))
      setPaperItems(readList('solar_papers', DEFAULT_PAPERS))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const updateBoxes = (next) => { setBoxItems(next); writeList('solar_box_types', next) }
  const updateHoles = (next) => { setHoleItems(next); writeList('solar_holes', next) }
  const updatePapers = (next) => { setPaperItems(next); writeList('solar_papers', next) }
  const entriesCount = Number(exportStats.entriesCount || 0)
  const archiveCount = Number(exportStats.archiveCount || 0)
  const lastExportAt = Number(exportStats.lastExportAt || 0)
  const lastExportLabel = lastExportAt ? new Date(lastExportAt).toLocaleString('fr-FR') : 'jamais'

  const heroState = !navigator.onLine
    ? 'offline'
    : driveState.syncing
      ? 'syncing'
      : driveState.authenticated
        ? 'ok'
        : 'expired'

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <ScreenTitle sub="listes & sync">Réglages</ScreenTitle>
      {isPreview && (
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>Mode preview partage</div>
            <div style={{ fontSize: 12.5, color: 'var(--encre-mute)', lineHeight: 1.45 }}>
              Cette version lit et ecrit sur la meme base de donnees que la version classique.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Chip muted>storage: {runtime.storageName || 'solargraph_trk'}</Chip>
              <Chip muted>drive: {runtime.driveFileName || 'solargraph_entries.json'}</Chip>
            </div>
          </div>
        </Card>
      )}
      <StatusHero state={heroState} sub={syncSubline(driveState)} onAction={driveState.authenticated ? onSyncNow : onConnectDrive} actionLabel={driveState.authenticated ? 'Sync now' : 'Choisir le compte'} />
      {isPreview && (
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>Compte Google preview</div>
                <div style={{ fontSize: 12.5, color: 'var(--encre-mute)', marginTop: 4 }}>
                  {driveState.authenticated
                    ? (driveState.email || driveState.name || 'Connecté')
                    : 'Sélection explicite du compte pour la preview'}
                </div>
              </div>
              <Chip status={driveState.authenticated ? 'recupere' : 'alerte'}>{driveState.authenticated ? 'connecté' : 'déconnecté'}</Chip>
            </div>
            {driveState.error && (
              <div className="banner-error" style={{ margin: 0 }}>
                <span>{driveState.error}</span>
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Btn kind="primary" size="sm" onClick={onConnectDrive}>Choisir le compte</Btn>
              <Btn kind="paper" size="sm" onClick={onSyncNow} disabled={!driveState.authenticated || driveState.syncing}>Synchroniser</Btn>
              <Btn kind="success" size="sm" onClick={onPublishDrive} disabled={!driveState.authenticated || driveState.publishing}>
                {driveState.publishing ? 'Publication…' : 'Publier sur Mon Drive'}
              </Btn>
              <Btn kind="secondary" size="sm" onClick={onCheckIntegrity} disabled={!driveState.authenticated || driveState.publishing}>
                Vérifier intégrité
              </Btn>
              <Btn kind="secondary" size="sm" onClick={onConnectDrive}>Changer de compte</Btn>
              <Btn kind="ghost" size="sm" onClick={onDisconnectDrive} disabled={!driveState.authenticated}>Déconnecter</Btn>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '6px 0' }}>
              <div style={{ fontSize: 12.5, color: 'var(--encre)' }}>Auto-publier après chaque sync</div>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!!driveState.autoPublishEnabled}
                  onChange={(e) => onToggleAutoPublish?.(e.target.checked)}
                />
              </label>
            </div>
            {driveState.publishFolderLink && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <a href={driveState.publishFolderLink} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, color: 'var(--encre)', textDecoration: 'underline' }}>
                  Ouvrir dossier Solargraph_Tracker
                </a>
                {driveState.publishSheetLink && (
                  <a href={driveState.publishSheetLink} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, color: 'var(--encre)', textDecoration: 'underline' }}>
                    Ouvrir Google Sheet
                  </a>
                )}
                {driveState.lastPublishAt && (
                  <span style={{ fontSize: 12.5, color: 'var(--encre-mute)' }}>
                    publié le {new Date(driveState.lastPublishAt).toLocaleString('fr-FR')}
                  </span>
                )}
              </div>
            )}
            {(driveState.lastPublishMessage || driveState.integritySummary) && (
              <div style={{ fontSize: 12.5, lineHeight: 1.45, color: driveState.lastPublishStatus === 'error' ? 'var(--alerte-deep)' : 'var(--encre-mute)' }}>
                {driveState.lastPublishMessage || driveState.integritySummary}
                {driveState.lastIntegrityCheckAt && (
                  <span style={{ marginLeft: 6 }}>
                    · contrôle {new Date(driveState.lastIntegrityCheckAt).toLocaleString('fr-FR')}
                  </span>
                )}
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--encre-mute)', lineHeight: 1.45 }}>
              Le fichier cache Drive reste la source de sync. Le bouton de publication crée aussi un dossier visible dans Mon Drive avec photos + JSON + CSV + Sheet.
            </div>
          </div>
        </Card>
      )}
      <ListEditor title="Boîtes" items={boxItems} placeholder="Ajouter un type de boîte" onChange={updateBoxes}/>
      <ListEditor title="Diamètres" items={holeItems} placeholder="Ajouter un diamètre" onChange={updateHoles}/>
      <ListEditor title="Papiers" items={paperItems} placeholder="Ajouter un type de papier" onChange={updatePapers}/>
      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>Export CSV</div>
            <div style={{ fontSize: 12.5, color: 'var(--encre-mute)', marginTop: 4, lineHeight: 1.45 }}>
              Crée deux fichiers: un fichier archive horodaté (historique) et un fichier latest facilement lisible.
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Chip muted>{entriesCount} entrées exportables</Chip>
            <Chip muted>{archiveCount} archive{archiveCount > 1 ? 's' : ''}</Chip>
            <Chip muted>dernier export: {lastExportLabel}</Chip>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Btn kind="primary" size="sm" onClick={onExportCsv}>Exporter CSV</Btn>
            <Chip muted>archive + latest</Chip>
          </div>
        </div>
      </Card>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>Corbeille (14 j)</div>
            <div style={{ fontSize: 12.5, color: 'var(--encre-mute)' }}>0 élément restaurable</div>
          </div>
          <Btn kind="paper" size="sm" iconRight={<IconArrowR size={14}/>}>ouvrir</Btn>
        </div>
      </Card>
    </div>
  )
}
