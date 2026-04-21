import React, { useEffect, useState } from 'react'
import AddForm from './components/AddForm'
import MapView from './components/MapView'
import db from './db'

export default function App() {
  const [entries, setEntries] = useState([])

  useEffect(() => {
    async function load() {
      const all = await db.getEntries()
      setEntries(all)
    }
    load()
    // listen for changes (very small prototype)
    const iv = setInterval(load, 2000)
    return () => clearInterval(iv)
  }, [])

  const onAdd = async (entry) => {
    await db.addEntry(entry)
    const all = await db.getEntries()
    setEntries(all)
  }

  const onUpdate = async (id, patch) => {
    await db.updateEntry(id, patch)
    const all = await db.getEntries()
    setEntries(all)
  }

  return (
    <div className="app">
      <header>
        <h1>Solargraph Tracker (prototype)</h1>
      </header>
      <main>
        <aside className="sidebar">
          <AddForm onAdd={onAdd} />
          <section className="list">
            <h2>Mes sténopés</h2>
            {entries.length === 0 && <p>Aucun enregistrement</p>}
            <ul>
              {entries.slice().reverse().map((e) => (
                <li key={e.id} className={e.retrievalDate ? 'retrieved' : ''}>
                  <div className="item-head">
                    <strong>{new Date(e.createdAt).toLocaleString()}</strong>
                    <span>{e.boxType} • {e.holeDiameter_mm} mm</span>
                  </div>
                  <div className="item-actions">
                    <button onClick={() => window.mapFlyTo?.(e.location)}>Voir</button>
                    {!e.retrievalDate && (
                      <button onClick={async () => onUpdate(e.id, { retrievalDate: Date.now() })}>Marquer récupéré</button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </aside>
        <section className="map-wrap">
          <MapView entries={entries} onUpdate={onUpdate} />
        </section>
      </main>
    </div>
  )
}
