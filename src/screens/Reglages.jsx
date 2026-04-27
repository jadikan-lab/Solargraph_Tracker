import React from 'react'
import { ScreenTitle, StatusHero, Card, Chip, Btn, IconArrowR, IconPlus, IconEdit } from '../ui.jsx'

function ListEditor({ title, items }) {
  return (
    <Card flat>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 8px' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>{title}</div>
        <button style={{ width: 30, height: 30, borderRadius: 999, border: '1px solid var(--papier-edge)', background: 'var(--papier-2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconPlus size={14}/></button>
      </div>
      <div style={{ padding: '0 14px 14px', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {items.map((it, i) => <Chip key={i} icon={<IconEdit size={11}/>}>{it}</Chip>)}
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
}) {
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
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15 }}>Mode preview isole</div>
            <div style={{ fontSize: 12.5, color: 'var(--encre-mute)', lineHeight: 1.45 }}>
              Cette version garde ses donnees locales a part pour tester le redesign sans toucher a l'app actuelle.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <Chip muted>storage: {runtime.storageName || 'solargraph-tracker-preview'}</Chip>
              <Chip muted>drive: {runtime.driveFileName || 'solargraph_entries_preview.json'}</Chip>
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
              <Btn kind="secondary" size="sm" onClick={onConnectDrive}>Changer de compte</Btn>
              <Btn kind="ghost" size="sm" onClick={onDisconnectDrive} disabled={!driveState.authenticated}>Déconnecter</Btn>
            </div>
            <div style={{ fontSize: 12, color: 'var(--encre-mute)', lineHeight: 1.45 }}>
              Le fichier caché Drive utilisé par cette preview est séparé de la version principale.
            </div>
          </div>
        </Card>
      )}
      <ListEditor title="Boîtes" items={['Café 250g', 'Conserve', 'Alu', 'Boîte film']}/>
      <ListEditor title="Diamètres" items={['0.2 mm', '0.26 mm', '0.3 mm', '0.4 mm', '0.5 mm']}/>
      <ListEditor title="Papiers" items={['Ilford MGIV', 'Foma 132']}/>
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
