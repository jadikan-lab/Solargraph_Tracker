import React, { useEffect, useRef } from 'react'
import L from 'leaflet'

export default function MapView({ entries, onUpdate }) {
  const mapRef = useRef(null)
  const layerRef = useRef(null)

  useEffect(() => {
    if (mapRef.current) return
    mapRef.current = L.map('map', { center: [48.8566, 2.3522], zoom: 2 })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(mapRef.current)
    layerRef.current = L.layerGroup().addTo(mapRef.current)
    // expose helper to App
    window.mapFlyTo = ({ lat, lng }) => {
      if (lat && lng) mapRef.current.setView([lat, lng], 14)
    }
  }, [])

  useEffect(() => {
    if (!layerRef.current) return
    layerRef.current.clearLayers()
    entries.forEach((e) => {
      if (!e.location) return
      const marker = L.marker([e.location.lat, e.location.lng])
      const popup = L.popup({ maxWidth: 300 }).setContent(
        `<div class="popup">
          <div><strong>${new Date(e.createdAt).toLocaleString()}</strong></div>
          <div>${e.boxType} • ${e.holeDiameter_mm} mm</div>
          <div style="margin-top:6px;"><img src="${e.initialPhotoDataURL}" style="max-width:240px;max-height:160px;display:block;margin-top:6px;"/></div>
        </div>`
      )
      marker.bindPopup(popup)
      marker.addTo(layerRef.current)
    })
  }, [entries])

  return <div id="map" style={{ height: '100%', width: '100%' }} />
}
