import React, { useState } from 'react'
import { ScreenTitle, Segmented, Chip, IconChev } from '../ui.jsx'

function thumbsByStatus(entries, filter) {
  if (filter === 'enplace')  return entries.filter((e) => !e.retrievalDate)
  if (filter === 'recupere') return entries.filter((e) =>  e.retrievalDate)
  return entries
}
function days(e) {
  const t = e.retrievalDate || Date.now()
  return Math.max(0, Math.floor((t - (e.createdAt || Date.now())) / 86400000))
}

function mainPhoto(e) {
  return e.initialPhotoDataURL || e.photos?.[0] || null
}

export default function Liste({ entries, onSelect }) {
  const [filter, setFilter] = useState('tous')
  const enplace = entries.filter((e) => !e.retrievalDate).length
  const recup   = entries.length - enplace
  const items = thumbsByStatus(entries, filter)

  return (
    <div className="screen">
      <ScreenTitle sub={`${entries.length} sténopé${entries.length > 1 ? 's' : ''}`}>Liste</ScreenTitle>

      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', marginBottom: 12 }}>
        <Segmented value={filter} onChange={setFilter} items={[
          { value: 'tous',     label: 'Tous',      count: entries.length },
          { value: 'enplace',  label: 'En place',  count: enplace, dot: 'var(--soleil)' },
          { value: 'recupere', label: 'Récupérés', count: recup,   dot: 'var(--recupere)' },
        ]}/>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <Chip muted icon={<IconChev size={12}/>}>tri : date</Chip>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--encre-mute)' }}>grille 2 col.</span>
      </div>

      {items.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--encre-mute)', padding: 32 }}>
          Aucun sténopé dans ce filtre.
        </div>
      ) : (
        <div className="grid-thumbs">
          {items.slice().reverse().map((e) => {
            const status = e.retrievalDate ? 'recupere' : 'enplace'
            return (
              <div key={e.id} className={'thumb ' + (status === 'recupere' ? 'retrieved' : '')} onClick={() => onSelect?.(e)} style={{ cursor: 'pointer' }}>
                <div style={{ position: 'relative' }}>
                  {mainPhoto(e)
                    ? <img src={mainPhoto(e)} alt="" className="thumb-img"/>
                    : <div className="thumb-img ph"/>}
                  <span className={'thumb-status ' + status}/>
                </div>
                <div className="thumb-body">
                  <div style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 500, fontSize: 16, lineHeight: 1.1 }}>
                    {(e.name && e.name.trim()) || 'Sténopé'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--encre-mute)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                    j+{days(e)} · {e.boxType || '—'} · Ø{e.holeDiameter_mm} · {e.paperType || 'papier —'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
