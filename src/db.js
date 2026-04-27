import localforage from 'localforage'
import { v4 as uuidv4 } from 'uuid'

const runtime = window.__SG_RUNTIME__ || {}
const store = localforage.createInstance({ name: runtime.storageName || 'solargraph-tracker' })
const ENTRIES_KEY = runtime.entriesKey || 'entries_v1'

async function getEntries() { return (await store.getItem(ENTRIES_KEY)) || [] }
async function addEntry(entry) {
  const all = await getEntries()
  const doc = { id: uuidv4(), createdAt: Date.now(), ...entry }
  all.push(doc); await store.setItem(ENTRIES_KEY, all); return doc
}
async function updateEntry(id, patch) {
  const all = await getEntries()
  const idx = all.findIndex((x) => x.id === id)
  if (idx === -1) throw new Error('not found')
  all[idx] = { ...all[idx], ...patch }
  await store.setItem(ENTRIES_KEY, all); return all[idx]
}
async function deleteEntry(id) {
  const all = await getEntries()
  await store.setItem(ENTRIES_KEY, all.filter((x) => x.id !== id))
}
async function replaceEntries(entries) {
  await store.setItem(ENTRIES_KEY, entries)
  return entries
}
export default { getEntries, addEntry, updateEntry, deleteEntry, replaceEntries }
