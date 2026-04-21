import localforage from 'localforage'
import { v4 as uuidv4 } from 'uuid'

const store = localforage.createInstance({
  name: 'solargraph-tracker'
})

const ENTRIES_KEY = 'entries_v1'

async function getEntries() {
  const all = (await store.getItem(ENTRIES_KEY)) || []
  return all
}

async function addEntry(entry) {
  const all = await getEntries()
  const id = uuidv4()
  const doc = { id, createdAt: Date.now(), ...entry }
  all.push(doc)
  await store.setItem(ENTRIES_KEY, all)
  return doc
}

async function updateEntry(id, patch) {
  const all = await getEntries()
  const idx = all.findIndex((x) => x.id === id)
  if (idx === -1) throw new Error('not found')
  all[idx] = { ...all[idx], ...patch }
  await store.setItem(ENTRIES_KEY, all)
  return all[idx]
}

export default { getEntries, addEntry, updateEntry }
