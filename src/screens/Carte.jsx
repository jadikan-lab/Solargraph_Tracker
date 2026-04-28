import React, { useRef, useState } from 'react'
import MapView from '../components/MapView.jsx'
import { Segmented } from '../ui.jsx'

function CompassRoseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <circle cx="11" cy="11" r="9" fill="#efe7d4" stroke="#b8ab8e" strokeWidth="1.3"/>
      <path d="M11 3.6 13.3 10.7 11 12.4 8.7 10.7Z" fill="#6d6048"/>
      <path d="M11 18.4 8.7 11.3 11 9.6 13.3 11.3Z" fill="#c34f3f"/>
      <circle cx="11" cy="11" r="1.2" fill="#6d6048"/>
      <text x="11" y="5.2" textAnchor="middle" fontSize="4.3" fontWeight="700" fill="#6d6048">N</text>
    </svg>
  )
}

export default function Carte({ entries, onSelect }) {
  const VIEW_KEY = 'solargraph_map_view'
  const [filter, setFilter] = useState('tous')
  const [sheet, setSheet] = useState('peek')   // peek | full
  const [view, setView] = useState(() => {
    try {
      const raw = JSON.parse(sessionStorage.getItem(VIEW_KEY) || 'null')
      if (Array.isArray(raw?.center) && Number.isFinite(raw?.zoom)) return raw
    } catch {}
    return { center: [48.8566, 2.3522], zoom: 11 }
  })
  const [locError, setLocError] = useState('')
  const mapApiRef = useRef(null)
  const dragYRef = useRef(null)
  const feedbackTimerRef = useRef(null)
  const enplace = entries.filter((e) => !e.retrievalDate)
  const recup   = entries.filter((e) => e.retrievalDate)
  const filtered = filter === 'enplace' ? enplace : filter === 'recupere' ? recup : entries

  const showFeedback = (message) => {
    setLocError(message)
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current)
    feedbackTimerRef.current = setTimeout(() => setLocError(''), 2600)
  }

  React.useEffect(() => {
    try { sessionStorage.setItem(VIEW_KEY, JSON.stringify(view)) } catch {}
  }, [view])

  const sheetH = sheet === 'full' ? '60dvh' : 92

  const onHandleTouchStart = (e) => {
    dragYRef.current = e.touches?.[0]?.clientY ?? null
  }

  const onHandleTouchEnd = (e) => {
    if (dragYRef.current == null) return
    const endY = e.changedTouches?.[0]?.clientY ?? dragYRef.current
    const delta = endY - dragYRef.current
    if (delta < -20) setSheet('full')
    if (delta > 20) setSheet('peek')
    dragYRef.current = null
  }

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
      <button className="recenter-fab" style={{ bottom: `calc(${typeof sheetH === 'number' ? sheetH + 'px' : sheetH} + 16px)`, left: 16, right: 'auto' }}
              aria-label="me recentrer" onClick={() => {
                if (!navigator.geolocation) {
                  showFeedback('Géolocalisation non disponible')
                  return
                }
                navigator.geolocation.getCurrentPosition(
                  (p) => {
                    setLocError('')
                    mapApiRef.current?.showUserLocation({
                      lat: p.coords.latitude,
                      lng: p.coords.longitude,
                      accuracy: p.coords.accuracy,
                    })
                  },
                  () => showFeedback('Position indisponible ou refusée'),
                  { enableHighAccuracy: true, timeout: 10000 }
                )
              }}>
        <CompassRoseIcon/>
      </button>


      {locError && (
        <div style={{ position: 'absolute', left: 12, right: 12, top: 76, zIndex: 401, textAlign: 'center', fontSize: 12, color: 'var(--alerte-deep)', pointerEvents: 'none' }}>
          {locError}
        </div>
      )}

      {/* Bottom sheet */}
      <div className="sheet" style={{ height: sheetH, pointerEvents: sheet === 'peek' ? 'none' : 'auto' }}>
        <div
          className="handle"
          onClick={() => setSheet(sheet === 'peek' ? 'full' : 'peek')}
          onTouchStart={onHandleTouchStart}
          onTouchEnd={onHandleTouchEnd}
          style={{ cursor: 'pointer', pointerEvents: 'auto' }}
        >
          <div className="handle-bar"/>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8, pointerEvents: sheet === 'peek' ? 'none' : 'auto' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 500, fontSize: 18 }}>
            {sheet === 'full' ? `${filtered.length} sténopés` : `${filtered.length} visible${filtered.length > 1 ? 's' : ''}`}
          </div>
          <div style={{ fontSize: 11, color: 'var(--encre-mute)', fontFamily: 'var(--font-mono)' }}>
            {sheet === 'full' ? 'glisser ↓ pour réduire' : 'tirer ↑ pour la liste'}
          </div>
        </div>
        {sheet === 'peek' ? null : (
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
        <div className="name">{(e.name && e.name.trim()) || 'Sténopé'}</div>
        <div className="meta">j+{days} · {e.boxType || '—'} · Ø{e.holeDiameter_mm}</div>
      </div>
      <span style={{ width: 10, height: 10, borderRadius: 999, background: status === 'enplace' ? 'var(--soleil)' : 'var(--recupere)' }}/>
    </div>
  )
}
