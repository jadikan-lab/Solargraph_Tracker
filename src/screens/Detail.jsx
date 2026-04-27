import React, { useState } from 'react'
import imageCompression from 'browser-image-compression'
import { Btn, Card, Chip, Stat, ScreenTitle, ActionBar, StatusPill, Field, IconArrowL, IconArrowR, IconCheck, IconEdit, IconTrash, IconMore, IconPin, IconRefresh, IconPlus, IconChev } from '../ui.jsx'
import MapView from '../components/MapView.jsx'

function days(e, end = Date.now()) {
  return Math.max(0, Math.floor((end - (e.createdAt || Date.now())) / 86400000))
}

export default function Detail({ entry, onBack, onUpdate, onDelete }) {
  const [step, setStep] = useState(0) // 0 detail, 1-3 récupérer
  const [photo, setPhoto] = useState(null)
  const [note, setNote]   = useState('')

  if (!entry) return null

  if (step === 0) return <DetailView entry={entry} onBack={onBack} onUpdate={onUpdate} onDelete={onDelete} onRecuperer={() => setStep(1)}/>
  if (step === 1) return <Step1 entry={entry} onBack={() => setStep(0)} onNext={() => setStep(2)}/>
  if (step === 2) return <Step2 entry={entry} photo={photo} setPhoto={setPhoto} note={note} setNote={setNote} onBack={() => setStep(1)} onConfirm={async () => {
    await onUpdate(entry.id, { retrievalDate: Date.now(), finalPhotoDataURL: photo, retrievalNote: note })
    setStep(3)
  }}/>
  return <Step3 entry={entry} note={note} onClose={onBack}/>
}

function DetailView({ entry, onBack, onUpdate, onDelete, onRecuperer }) {
  const status = entry.retrievalDate ? 'recupere' : 'enplace'
  const dur = days(entry, entry.retrievalDate || Date.now())
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '8px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Btn kind="paper" size="sm" icon={<IconArrowL size={16}/>} onClick={onBack}>retour</Btn>
          <Btn kind="ghost" size="sm" icon={<IconMore size={18}/>}> </Btn>
        </div>
        <div style={{ position: 'relative' }}>
          {entry.initialPhotoDataURL
            ? <img src={entry.initialPhotoDataURL} alt="" style={{ width: '100%', aspectRatio: '16/10', objectFit: 'cover', borderRadius: 14, border: '1px solid var(--papier-edge)' }}/>
            : <div className="photo-ph" style={{ aspectRatio: '16/10' }}>photo principale</div>}
          <div style={{ position: 'absolute', left: 12, bottom: 12 }}>
            <StatusPill status={status} size="lg"/>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '14px 20px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 500, fontSize: 26, lineHeight: 1.1 }}>{entry.name || 'Sans nom'}</div>
          <div style={{ fontSize: 12.5, color: 'var(--encre-mute)', marginTop: 4 }}>
            posé le {new Date(entry.createdAt || Date.now()).toLocaleDateString('fr-FR')} · j+{dur}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Stat value={dur} unit="j" label="exposition"/>
          <Stat value={entry.boxType?.split(' ')[0] || '—'} unit="" label="boîte"/>
          <Stat value={entry.orientation || '—'} unit="" label="orient."/>
        </div>
        {entry.location && (
          <Card flat>
            <div style={{ padding: '12px 14px 8px', display: 'flex', justifyContent: 'space-between' }}>
              <span className="cap">Localisation</span>
              <Chip muted icon={<IconPin size={11}/>}>{entry.location.lat.toFixed(4)}, {entry.location.lng.toFixed(4)}</Chip>
            </div>
            <div style={{ height: 130, borderTop: '1px solid var(--papier-edge)' }}>
              <MapView entries={[entry]} embed/>
            </div>
          </Card>
        )}
        {entry.notes && (
          <div>
            <div className="cap" style={{ marginBottom: 6 }}>Notes</div>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 15, color: 'var(--encre-2)', lineHeight: 1.5 }}>{entry.notes}</div>
          </div>
        )}
        <div style={{ height: 10 }}/>
      </div>
      <ActionBar>
        <Btn kind="secondary" icon={<IconEdit size={16}/>}>Modifier</Btn>
        {!entry.retrievalDate && (
          <Btn kind="success" style={{ flex: 1 }} icon={<IconCheck size={18}/>} onClick={onRecuperer}>Récupérer</Btn>
        )}
        <Btn kind="ghost" style={{ width: 44, padding: 0, color: 'var(--alerte-deep)' }} aria-label="supprimer"
             onClick={() => { if (confirm('Supprimer ce sténopé localement ? (la corbeille Drive 14 j conserve une copie)')) onDelete?.(entry.id) }}>
          <IconTrash size={18}/>
        </Btn>
      </ActionBar>
    </div>
  )
}

function StepHeader({ step, total = 3, title }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 500, fontSize: 28, lineHeight: 1 }}>Récupérer</div>
        <div style={{ fontSize: 12, color: 'var(--encre-mute)', fontFamily: 'var(--font-mono)' }}>étape {step} / {total}</div>
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 999,
            background: i < step ? 'var(--recupere)' : 'var(--papier-2)',
            border: '1px solid ' + (i < step ? 'var(--recupere-deep)' : 'var(--papier-edge)') }}/>
        ))}
      </div>
      {title && <div style={{ marginTop: 14, fontSize: 16, fontWeight: 600 }}>{title}</div>}
    </div>
  )
}

function Step1({ entry, onBack, onNext }) {
  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <StepHeader step={1} title="1. Confirmer le sténopé"/>
      <Card>
        <div style={{ display: 'flex', gap: 12 }}>
          {entry.initialPhotoDataURL
            ? <img src={entry.initialPhotoDataURL} alt="" style={{ width: 84, height: 84, borderRadius: 8, objectFit: 'cover', flex: 'none' }}/>
            : <div className="photo-ph" style={{ width: 84, height: 84, flex: 'none' }}/>}
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 500, fontSize: 18 }}>{entry.name || 'Sans nom'}</div>
            <div style={{ fontSize: 12.5, color: 'var(--encre-mute)', marginTop: 4 }}>
              posé j+{days(entry)} · {new Date(entry.createdAt || Date.now()).toLocaleDateString('fr-FR')}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {entry.boxType && <Chip>{entry.boxType}</Chip>}
              <Chip>Ø {entry.holeDiameter_mm} mm</Chip>
              {entry.location && <Chip icon={<IconPin size={11}/>}>{entry.location.lat.toFixed(2)}, {entry.location.lng.toFixed(2)}</Chip>}
            </div>
          </div>
        </div>
      </Card>
      {entry.notes && (
        <Card style={{ background: 'var(--papier-2)', borderStyle: 'dashed' }}>
          <div className="cap" style={{ marginBottom: 6 }}>Rappel pose</div>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 14, lineHeight: 1.5, color: 'var(--encre-2)' }}>« {entry.notes} »</div>
        </Card>
      )}
      <div style={{ flex: 1 }}/>
      <ActionBar sticky={false}>
        <Btn kind="paper" icon={<IconArrowL size={16}/>} onClick={onBack}>annuler</Btn>
        <Btn kind="success" style={{ flex: 1 }} iconRight={<IconArrowR size={16}/>} onClick={onNext}>C'est bien lui</Btn>
      </ActionBar>
    </div>
  )
}

function Step2({ entry, photo, setPhoto, note, setNote, onBack, onConfirm }) {
  const pick = async (file) => {
    if (!file) return
    try {
      const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1600 })
      setPhoto(await imageCompression.getDataUrlFromFile(compressed))
    } catch {
      const fr = new FileReader(); fr.onload = () => setPhoto(fr.result); fr.readAsDataURL(file)
    }
  }
  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <StepHeader step={2} title="2. Photo de récupération"/>
      <label style={{ position: 'relative', display: 'block' }}>
        <input type="file" accept="image/*" capture="environment" onChange={(e) => pick(e.target.files[0])}
               style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}/>
        {photo
          ? <img src={photo} alt="" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 10, border: '1px solid var(--papier-edge)' }}/>
          : <div className="photo-ph" style={{ aspectRatio: '4/3' }}>cliché négatif après dépose</div>}
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn kind="paper" icon={<IconRefresh size={16}/>} onClick={() => setPhoto(null)}>reprendre</Btn>
      </div>
      <Field label="Date de récupération">
        <div className="input" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{new Date().toLocaleString('fr-FR')}</span>
          <IconChev size={14}/>
        </div>
      </Field>
      <Field label="Note de récupération (optionnel)">
        <textarea className="textarea" rows={2} value={note} onChange={(e) => setNote(e.target.value)}
                  placeholder="légère condensation, image visible…"/>
      </Field>
      <div style={{ flex: 1 }}/>
      <ActionBar>
        <Btn kind="paper" icon={<IconArrowL size={16}/>} onClick={onBack}>retour</Btn>
        <Btn kind="success" style={{ flex: 1 }} disabled={!photo} iconRight={<IconArrowR size={16}/>} onClick={onConfirm}>Confirmer récupération</Btn>
      </ActionBar>
    </div>
  )
}

function Step3({ entry, onClose }) {
  const dur = days(entry, Date.now())
  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <StepHeader step={3} title="3. Récupéré"/>
      <div style={{ borderRadius: 16, padding: 18, background: '#d8e7d6', border: '1px solid #88a78c', color: '#274a31', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, borderRadius: 999, margin: '0 auto 10px', background: 'var(--recupere)', color: '#f6f1e7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconCheck size={28} stroke={2.4}/>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 500, fontSize: 22 }}>{entry.name} — récupéré</div>
        <div style={{ fontSize: 13, marginTop: 6, opacity: 0.85 }}>{dur} jours d'exposition · synchronisé Drive ✓</div>
      </div>
      <div style={{ flex: 1 }}/>
      <ActionBar sticky={false}>
        <Btn kind="primary" block onClick={onClose}>Terminer</Btn>
      </ActionBar>
    </div>
  )
}
