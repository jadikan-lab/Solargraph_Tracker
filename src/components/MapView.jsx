import React, { useEffect, useRef } from 'react'
import L from 'leaflet'

// Custom marker (sun-yellow / vert-récupéré)
function makeIcon(status) {
  const fill = status === 'recupere' ? '#4a7c59' : '#f5b417'
  const stroke = status === 'recupere' ? '#2f5b3e' : '#d99a08'
  const html = `<svg width="30" height="38" viewBox="0 0 24 30" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 29s10-10.4 10-17a10 10 0 1 0-20 0c0 6.6 10 17 10 17Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
    <circle cx="12" cy="11" r="3.4" fill="#f6f1e7" stroke="${stroke}" stroke-width="1"/>
  </svg>`
  return L.divIcon({ html, className: 'sg-marker', iconSize: [30, 38], iconAnchor: [15, 38], popupAnchor: [0, -34] })
}

function mainPhoto(e) {
  return e.initialPhotoDataURL || e.photos?.[0] || null
}

export default function MapView({ entries, onSelect, embed = false, initialView, onViewChange, mapApiRef, zoomControl = false }) {
  const mapRef = useRef(null)
  const layerRef = useRef(null)
  const elRef = useRef(null)
  const lastEntriesRef = useRef([])

  useEffect(() => {
    if (mapRef.current) return
    const startCenter = Array.isArray(initialView?.center) ? initialView.center : [48.8566, 2.3522]
    const startZoom = Number.isFinite(initialView?.zoom) ? initialView.zoom : 13
    mapRef.current = L.map(elRef.current, {
      center: startCenter,
      zoom: startZoom,
      zoomControl,
      touchZoom: true,
      inertia: true,
      inertiaDeceleration: 3000,
      inertiaMaxSpeed: 2200,
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      tap: false,
      keyboard: false,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      className: 'sg-tiles',
      keepBuffer: 6,
      updateWhenIdle: false,
      updateWhenZooming: false,
    }).addTo(mapRef.current)
    layerRef.current = L.layerGroup().addTo(mapRef.current)

    const emitView = () => {
      if (!onViewChange) return
      const c = mapRef.current.getCenter()
      onViewChange({ center: [c.lat, c.lng], zoom: mapRef.current.getZoom() })
    }
    mapRef.current.on('moveend zoomend', emitView)

    const fitToEntries = () => {
      const valid = lastEntriesRef.current.filter((e) => e.location?.lat && e.location?.lng)
      if (!valid.length) return
      const bounds = L.latLngBounds(valid.map((e) => [e.location.lat, e.location.lng]))
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
    }

    if (mapApiRef) {
      mapApiRef.current = {
        flyTo: ({ lat, lng, zoom = 16 }) => { if (lat && lng) mapRef.current.setView([lat, lng], zoom) },
        zoomIn: () => mapRef.current.zoomIn(),
        zoomOut: () => mapRef.current.zoomOut(),
        fitToEntries,
      }
    }

    return () => {
      mapRef.current?.off('moveend zoomend', emitView)
      if (mapApiRef) mapApiRef.current = null
    }
  }, [embed, initialView, mapApiRef, onViewChange])

  useEffect(() => {
    if (!layerRef.current) return
    layerRef.current.clearLayers()
    lastEntriesRef.current = entries
    const valid = entries.filter((e) => e.location?.lat && e.location?.lng)
    valid.forEach((e) => {
      const status = e.retrievalDate ? 'recupere' : 'enplace'
      const photo = mainPhoto(e)
      const marker = L.marker([e.location.lat, e.location.lng], { icon: makeIcon(status) })
      const popup = L.popup({ maxWidth: 260 }).setContent(
        `<div class="popup">
          <div class="name">${e.name || 'Sans nom'}</div>
          <div style="font-size:12px;color:#6b6253;margin-top:4px;">${e.boxType || '—'} · Ø${e.holeDiameter_mm} mm</div>
          ${photo ? `<img src="${photo}" style="max-width:240px;max-height:140px;display:block;margin-top:8px;"/>` : ''}
        </div>`
      )
      marker.bindPopup(popup)
      if (onSelect) marker.on('click', () => onSelect(e))
      marker.addTo(layerRef.current)
    })
    if (valid.length && !mapRef.current._sgFitDone) {
      const bounds = L.latLngBounds(valid.map((e) => [e.location.lat, e.location.lng]))
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 })
      mapRef.current._sgFitDone = true
    }
  }, [entries, onSelect])

  return <div ref={elRef} style={{ height: '100%', width: '100%', touchAction: 'none' }}/>
}
