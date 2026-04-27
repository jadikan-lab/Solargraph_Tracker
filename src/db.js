import localforage from 'localforage'
import { v4 as uuidv4 } from 'uuid'

const runtime = window.__SG_RUNTIME__ || {}
const store = localforage.createInstance({ name: runtime.storageName || 'solargraph-tracker' })
const ENTRIES_KEY = runtime.entriesKey || 'entries_v1'
const BACKUP_KEY = `${ENTRIES_KEY}__backup`

async function getEntries() { return (await store.getItem(ENTRIES_KEY)) || [] }
async function addEntry(entry) {
  const all = await getEntries()
  const now = Date.now()
  const doc = { id: uuidv4(), createdAt: now, updatedAt: now, ...entry }
  all.push(doc); await store.setItem(ENTRIES_KEY, all); return doc
}
async function updateEntry(id, patch) {
  const all = await getEntries()
  const idx = all.findIndex((x) => x.id === id)
  if (idx === -1) throw new Error('not found')
  all[idx] = { ...all[idx], ...patch, updatedAt: Date.now() }
  await store.setItem(ENTRIES_KEY, all); return all[idx]
}
async function deleteEntry(id) {
  const all = await getEntries()
  const idx = all.findIndex((x) => x.id === id)
  if (idx === -1) return
  all[idx] = { ...all[idx], deletedAt: Date.now(), updatedAt: Date.now() }
  await store.setItem(ENTRIES_KEY, all)
}
async function replaceEntries(entries) {
  const previous = await getEntries()
  await store.setItem(BACKUP_KEY, previous)
  await store.setItem(ENTRIES_KEY, entries)
  return entries
}
export default { getEntries, addEntry, updateEntry, deleteEntry, replaceEntries }
