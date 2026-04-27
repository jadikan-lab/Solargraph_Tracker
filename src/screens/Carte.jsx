import React, { useRef, useState } from 'react'
import MapView from '../components/MapView.jsx'
import { Segmented, IconLocate } from '../ui.jsx'

export default function Carte({ entries, onSelect }) {
  const VIEW_KEY = 'solargraph_map_view'
  const [filter, setFilter] = useState('tous')
  const [sheet, setSheet] = useState('peek')   // peek | full
  const [view, setView] = useState(() => {
    try {
      const raw = JSON.parse(sessionStorage.getItem(VIEW_KEY) || 'null')
      if (Array.isArray(raw?.center) && Number.isFinite(raw?.zoom)) return raw
    } catch {}
    return { center: [48.8566, 2.3522], zoom: 13 }
  })
  const [locError, setLocError] = useState('')
  const mapApiRef = useRef(null)
  const enplace = entries.filter((e) => !e.retrievalDate)
  const recup   = entries.filter((e) => e.retrievalDate)
  const filtered = filter === 'enplace' ? enplace : filter === 'recupere' ? recup : entries

  React.useEffect(() => {
    try { sessionStorage.setItem(VIEW_KEY, JSON.stringify(view)) } catch {}
  }, [view])

  const sheetH = sheet === 'full' ? '60dvh' : 168

  return (
    <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <MapView entries={filtered} onSelect={onSelect} initialView={view} onViewChange={setView} mapApiRef={mapApiRef}/>
      </div>

      {/* Top filter */}
      <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', justifyContent: 'center', zIndex: 401, pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(246,241,231,0.92)', backdropFilter: 'blur(8px)', borderRadius: 999, border: '1px solid var(--papier-edge)', padding: 3, boxShadow: 'var(--shadow-sm)', pointerEvents: 'auto' }}>
          <Segmented value={filter} onChange={setFilter} items={[
            { value: 'tous',     label: 'Tous',      count: entries.length },
            { value: 'enplace',  label: 'En place',  count: enplace.length, dot: 'var(--soleil)' },
            { value: 'recupere', label: 'Récupérés', count: recup.length,   dot: 'var(--recupere)' },
          ]}/>
        </div>
      </div>

      {/* Recenter */}
      <button className="recenter-fab" style={{ bottom: `calc(${typeof sheetH === 'number' ? sheetH + 'px' : sheetH} + 16px)` }}
              aria-label="me recentrer" onClick={() => {
                if (!navigator.geolocation) {
                  setLocError('Géolocalisation non disponible')
                  return
                }
                navigator.geolocation.getCurrentPosition(
                  (p) => {
                    setLocError('')
                    mapApiRef.current?.flyTo({ lat: p.coords.latitude, lng: p.coords.longitude, zoom: 16 })
                  },
                  () => setLocError('Position indisponible'),
                  { enableHighAccuracy: true, timeout: 10000 }
                )
              }}>
        <IconLocate size={20}/>
      </button>

      <div style={{ position: 'absolute', right: 12, top: 76, zIndex: 401, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
        <button className="btn btn-paper" style={{ minHeight: 38, width: 38, padding: 0, pointerEvents: 'auto' }} onClick={() => mapApiRef.current?.zoomIn()} aria-label="Zoom avant">+</button>
        <button className="btn btn-paper" style={{ minHeight: 38, width: 38, padding: 0, pointerEvents: 'auto' }} onClick={() => mapApiRef.current?.zoomOut()} aria-label="Zoom arrière">−</button>
        <button className="btn btn-paper" style={{ minHeight: 38, width: 'auto', padding: '0 10px', fontSize: 12, pointerEvents: 'auto' }} onClick={() => mapApiRef.current?.fitToEntries()}>
          Points
        </button>
      </div>
      {locError && (
        <div style={{ position: 'absolute', left: 12, right: 12, top: 76, zIndex: 401, textAlign: 'center', fontSize: 12, color: 'var(--alerte-deep)', pointerEvents: 'none' }}>
          {locError}
        </div>
      )}

      {/* Bottom sheet */}
      <div className="sheet" style={{ height: sheetH }}>
        <div className="handle" onClick={() => setSheet(sheet === 'peek' ? 'full' : 'peek')} style={{ cursor: 'pointer' }}>
          <div className="handle-bar"/>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 500, fontSize: 18 }}>
            {sheet === 'full' ? `${filtered.length} sténopés` : `${filtered.length} visible${filtered.length > 1 ? 's' : ''}`}
          </div>
          <div style={{ fontSize: 11, color: 'var(--encre-mute)', fontFamily: 'var(--font-mono)' }}>
            {sheet === 'full' ? 'glisser ↓ pour réduire' : 'tirer ↑ pour la liste'}
          </div>
        </div>
        {sheet === 'peek' ? (
          filtered.length > 0 && <RowItem e={filtered[filtered.length - 1]} onSelect={onSelect}/>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto', maxHeight: 'calc(60dvh - 130px)' }}>
            {filtered.slice().reverse().map((e) => <RowItem key={e.id} e={e} onSelect={onSelect}/>)}
          </div>
        )}
      </div>
    </div>
  )
}

function RowItem({ e, onSelect }) {
  const status = e.retrievalDate ? 'recupere' : 'enplace'
  const days = Math.floor(((e.retrievalDate || Date.now()) - (e.createdAt || Date.now())) / 86400000)
  const photo = e.initialPhotoDataURL || e.photos?.[0] || null
  return (
    <div className={'list-row ' + (status === 'recupere' ? 'retrieved' : '')} onClick={() => onSelect?.(e)} style={{ cursor: 'pointer' }}>
      {photo
        ? <img src={photo} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flex: 'none' }}/>
        : <div className="photo-ph" style={{ width: 44, height: 44, flex: 'none' }}/>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="name">{e.name || 'Sans nom'}</div>
        <div className="meta">j+{days} · {e.boxType || '—'} · Ø{e.holeDiameter_mm}</div>
      </div>
      <span style={{ width: 10, height: 10, borderRadius: 999, background: status === 'enplace' ? 'var(--soleil)' : 'var(--recupere)' }}/>
    </div>
  )
}
