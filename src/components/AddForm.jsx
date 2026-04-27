import React, { useEffect, useState } from 'react'
import imageCompression from 'browser-image-compression'
import { Btn, Chip, Field, ScreenTitle, StatusPill, IconCheck, IconPin, IconCamera, IconChev } from '../ui.jsx'

const DEFAULT_BOX_TYPES = ['5x7 can', 'large (5x3.5)', 'small (2.5x3.5)', 'mini', 'custom']
const DEFAULT_HOLES = ['0.26', '0.4', '0.5']
const DEFAULT_PAPERS = ['Fomaspeed 311', 'RA4 Fujichristal', 'Ilford RC', 'Ilford FB', 'random']
const ORIENTATIONS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO']

function readList(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null')
    return Array.isArray(parsed) && parsed.length ? parsed : fallback
  } catch {
    return fallback
  }
}

function toNumber(value, fallback = 0.26) {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

export default function AddForm({ onAdd, onDone }) {
  const [boxTypes, setBoxTypes] = useState(() => readList('solar_box_types', DEFAULT_BOX_TYPES))
  const [holeSizes, setHoleSizes] = useState(() => readList('solar_holes', DEFAULT_HOLES))
  const [paperTypes, setPaperTypes] = useState(() => readList('solar_papers', DEFAULT_PAPERS))
  const [photoData, setPhotoData] = useState(null)
  const [secondaryPhoto, setSecondaryPhoto] = useState(null)
  const [boxType, setBoxType] = useState(() => readList('solar_box_types', DEFAULT_BOX_TYPES)[0])
  const [holeDiameter, setHoleDiameter] = useState(() => toNumber(readList('solar_holes', DEFAULT_HOLES)[0], 0.26))
  const [paperType, setPaperType] = useState(() => readList('solar_papers', DEFAULT_PAPERS)[0])
  const [orientation, setOrientation] = useState('SO')
  const [name, setName] = useState('')
  const [loc, setLoc] = useState(null)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const refreshLists = () => {
      const nextBox = readList('solar_box_types', DEFAULT_BOX_TYPES)
      const nextHole = readList('solar_holes', DEFAULT_HOLES)
      const nextPaper = readList('solar_papers', DEFAULT_PAPERS)
      setBoxTypes(nextBox)
      setHoleSizes(nextHole)
      setPaperTypes(nextPaper)
      if (!nextBox.includes(boxType)) setBoxType(nextBox[0])
      if (!nextHole.some((h) => toNumber(h) === holeDiameter)) setHoleDiameter(toNumber(nextHole[0], 0.26))
      if (!nextPaper.includes(paperType)) setPaperType(nextPaper[0])
    }

    refreshLists()
    window.addEventListener('storage', refreshLists)
    return () => window.removeEventListener('storage', refreshLists)
  }, [boxType, holeDiameter, paperType])

  const pickPhoto = async (file, setter) => {
    if (!file) return
    try {
      const compressed = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1600 })
      const dataUrl = await imageCompression.getDataUrlFromFile(compressed)
      setter(dataUrl)
    } catch {
      const fr = new FileReader()
      fr.onload = () => setter(fr.result)
      fr.readAsDataURL(file)
    }
  }

  const captureLoc = () => {
    if (!navigator.geolocation) return alert('Géolocalisation non prise en charge')
    navigator.geolocation.getCurrentPosition(
      (p) => setLoc({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      (err) => alert('Erreur géoloc : ' + err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  React.useEffect(() => { captureLoc() /* GPS auto */ }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!photoData) return alert('Ajoute la photo principale')
    setBusy(true)
    const photos = [photoData, secondaryPhoto].filter(Boolean)
    const entry = {
      name: name || 'Sans nom',
      initialPhotoDataURL: photos[0] || null,
      secondaryPhotoDataURL: photos[1] || null,
      photos,
      location: loc || null,
      boxType, holeDiameter_mm: holeDiameter,
      paperType,
      orientation, notes,
      updatedAt: Date.now(),
      retrievalDate: null, finalPhotoDataURL: null,
    }
    try { await onAdd(entry); onDone?.() }
    catch (err) { console.error(err); alert("Erreur lors de l'enregistrement") }
    setBusy(false)
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ScreenTitle sub="nouvelle pose" right={<Chip muted icon={<IconCheck size={12}/>}>brouillon</Chip>}>Ajouter</ScreenTitle>

      {/* Photos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 10 }}>
        <label style={{ position: 'relative', display: 'block' }}>
          <input type="file" accept="image/*" capture="environment" onChange={(e) => pickPhoto(e.target.files[0], setPhotoData)}
                 style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}/>
          {photoData ? (
            <img src={photoData} alt="" style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover', borderRadius: 10, border: '1px solid var(--papier-edge)' }}/>
          ) : (
            <div className="photo-ph" style={{ aspectRatio: '4/5' }}>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <IconCamera size={20}/> photo principale
              </span>
            </div>
          )}
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ position: 'relative', display: 'block' }}>
            <input type="file" accept="image/*" onChange={(e) => pickPhoto(e.target.files[0], setSecondaryPhoto)}
                   style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}/>
            {secondaryPhoto ? (
              <img src={secondaryPhoto} alt="" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 10, border: '1px solid var(--papier-edge)' }}/>
            ) : (
              <div className="photo-ph" style={{ aspectRatio: '1/1' }}>+ ajouter</div>
            )}
          </label>
          <div style={{ aspectRatio: '1/1', borderRadius: 10, border: '1px dashed var(--papier-edge)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--encre-mute)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>+ ajouter</div>
        </div>
      </div>

      {/* Status + GPS */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <StatusPill status="enplace" size="lg"/>
        <Chip icon={<IconPin size={12}/>}>{loc ? `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}` : 'GPS…'}</Chip>
        {loc && <Chip muted>± {Math.round(loc.accuracy)} m · auto</Chip>}
        {!loc && <Chip muted onClick={captureLoc} style={{ cursor: 'pointer' }}>réessayer</Chip>}
      </div>

      <Field label="Nom du sténopé">
        <input className="input" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 18 }}
               value={name} onChange={(e) => setName(e.target.value)} placeholder="Toit Ouest — équinoxe"/>
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Boîte">
          <select className="select" value={boxType} onChange={(e) => setBoxType(e.target.value)}>
            {boxTypes.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>
        <Field label="Trou (Ø mm)">
          <select className="select" value={holeDiameter} onChange={(e) => setHoleDiameter(Number(e.target.value))}>
            {holeSizes.map((h) => <option key={h} value={toNumber(h, 0.26)}>{h}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Papier">
        <select className="select" value={paperType} onChange={(e) => setPaperType(e.target.value)}>
          {paperTypes.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </Field>

      <Field label="Orientation">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ORIENTATIONS.map((o) => (
            <Chip key={o} active={orientation === o} onClick={() => setOrientation(o)} style={{ cursor: 'pointer' }}>{o}</Chip>
          ))}
        </div>
      </Field>

      <Field label="Notes terrain">
        <textarea className="textarea" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Plein sud, fil nylon 0.5mm…"/>
      </Field>

      <Btn type="submit" kind="primary" size="lg" block disabled={busy} icon={<IconCheck size={18}/>}>
        {busy ? 'Enregistrement…' : 'Enregistrer le sténopé'}
      </Btn>
    </form>
  )
}
