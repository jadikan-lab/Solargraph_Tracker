import React, { useState } from 'react'
import imageCompression from 'browser-image-compression'

const BOX_TYPES = ['full', 'medium', 'small']
const HOLE_SIZES = [0.26, 0.4, 0.5]

export default function AddForm({ onAdd }) {
  const [photoData, setPhotoData] = useState(null)
  const [boxType, setBoxType] = useState(BOX_TYPES[0])
  const [holeDiameter, setHoleDiameter] = useState(HOLE_SIZES[0])
  const [loc, setLoc] = useState(null)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)

  const pickPhoto = async (file) => {
    if (!file) return
    try {
      const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1600 }
      const compressed = await imageCompression(file, options)
      const dataUrl = await imageCompression.getDataUrlFromFile(compressed)
      setPhotoData(dataUrl)
    } catch (err) {
      console.error(err)
      // fallback to direct read
      const fr = new FileReader()
      fr.onload = () => setPhotoData(fr.result)
      fr.readAsDataURL(file)
    }
  }

  const captureLoc = () => {
    if (!navigator.geolocation) {
      alert('Géolocalisation non prise en charge')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (p) => setLoc({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      (err) => alert('Erreur géoloc: ' + err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!photoData) return alert('Ajoute une photo initiale')
    setBusy(true)
    const entry = {
      initialPhotoDataURL: photoData,
      location: loc || null,
      boxType,
      holeDiameter_mm: holeDiameter,
      notes,
      retrievalDate: null,
      finalPhotoDataURL: null
    }
    try {
      await onAdd(entry)
      setPhotoData(null)
      setNotes('')
      setLoc(null)
      alert('Enregistré localement')
    } catch (err) {
      console.error(err)
      alert("Erreur lors de l'enregistrement")
    }
    setBusy(false)
  }

  return (
    <form className="add-form" onSubmit={onSubmit}>
      <h2>Ajouter un sténopé</h2>
      <label>
        Photo initiale
        <input type="file" accept="image/*" capture="environment" onChange={(e) => pickPhoto(e.target.files[0])} />
      </label>
      {photoData && <img src={photoData} alt="preview" className="preview" />}

      <label>
        Type de boîte
        <select value={boxType} onChange={(e) => setBoxType(e.target.value)}>
          {BOX_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </label>

      <label>
        Diamètre du trou (mm)
        <select value={holeDiameter} onChange={(e) => setHoleDiameter(Number(e.target.value))}>
          {HOLE_SIZES.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
      </label>

      <label>
        Notes
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      <div className="loc-row">
        <button type="button" onClick={captureLoc}>Capturer géoloc</button>
        <small>{loc ? `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)} (±${Math.round(loc.accuracy)}m)` : 'Aucune'}</small>
      </div>

      <button type="submit" disabled={busy}>{busy ? '...' : 'Enregistrer'}</button>
    </form>
  )
}
