import { createId, exceedsSyncItemQuota } from './pure.js'
import { getChromeApi, hasChromeNamespace } from './chromeApi.js'

export const STORAGE_KEYS = {
  settings: 'nestdev:settings',
  ports: 'nestdev:ports',
  notes: 'nestdev:notes',
  fallbackMap: 'nestdev:localFallbacks',
}

export const DEFAULT_SETTINGS = {
  backgroundId: 'gradient',
  theme: 'dark',
  clockFormat: '24h',
  visibleWidgets: { clock: true, ports: true, note: true },
  bookmarkRootId: '1',
  schemaVersion: 1,
}

const memoryStore = new Map()

function area(areaName) {
  const chromeApi = getChromeApi()
  return chromeApi?.storage?.[areaName]
}

async function getFromArea(areaName, key) {
  const storageArea = area(areaName)
  if (storageArea?.get) {
    const result = await storageArea.get(key)
    return result?.[key]
  }
  return memoryStore.get(`${areaName}:${key}`)
}

async function setInArea(areaName, key, value) {
  const storageArea = area(areaName)
  if (storageArea?.set) {
    await storageArea.set({ [key]: value })
    return
  }
  memoryStore.set(`${areaName}:${key}`, value)
}

async function removeFromArea(areaName, key) {
  const storageArea = area(areaName)
  if (storageArea?.remove) {
    await storageArea.remove(key)
    return
  }
  memoryStore.delete(`${areaName}:${key}`)
}

export async function getFallbackMap() {
  return (await getFromArea('local', STORAGE_KEYS.fallbackMap)) || {}
}

async function setFallback(key, isLocalOnly) {
  const fallbackMap = await getFallbackMap()
  const next = { ...fallbackMap, [key]: isLocalOnly }
  await setInArea('local', STORAGE_KEYS.fallbackMap, next)
  return next
}

export async function readKey(key, defaultValue) {
  const fallbackMap = await getFallbackMap()
  const localOnly = Boolean(fallbackMap[key])
  const source = localOnly ? 'local' : 'sync'
  let value = await getFromArea(source, key)
  if (value === undefined && localOnly) value = await getFromArea('sync', key)
  return { value: value ?? defaultValue, localOnly }
}

export async function writeKey(key, value) {
  if (!hasChromeNamespace('storage')) {
    await setInArea('sync', key, value)
    return { localOnly: false }
  }

  if (exceedsSyncItemQuota(value)) {
    await setInArea('local', key, value)
    await setFallback(key, true)
    return { localOnly: true }
  }

  try {
    await setInArea('sync', key, value)
    await removeFromArea('local', key)
    await setFallback(key, false)
    return { localOnly: false }
  } catch {
    await setInArea('local', key, value)
    await setFallback(key, true)
    return { localOnly: true }
  }
}

export function normalizeSettings(settings) {
  return {
    ...DEFAULT_SETTINGS,
    ...(settings || {}),
    visibleWidgets: {
      ...DEFAULT_SETTINGS.visibleWidgets,
      ...(settings?.visibleWidgets || {}),
    },
    schemaVersion: 1,
  }
}

export async function getSettings() {
  const { value, localOnly } = await readKey(STORAGE_KEYS.settings, DEFAULT_SETTINGS)
  return { settings: normalizeSettings(value), localOnly }
}

export async function saveSettings(settings) {
  return writeKey(STORAGE_KEYS.settings, normalizeSettings(settings))
}

export async function getPorts() {
  const { value, localOnly } = await readKey(STORAGE_KEYS.ports, [])
  return { ports: Array.isArray(value) ? value : [], localOnly }
}

export async function savePorts(ports) {
  return writeKey(STORAGE_KEYS.ports, ports)
}

export async function getNotes() {
  const { value, localOnly } = await readKey(STORAGE_KEYS.notes, [])
  return { notes: Array.isArray(value) ? value : [], localOnly }
}

export async function saveNotes(notes) {
  return writeKey(STORAGE_KEYS.notes, notes)
}

export function createNote(content = '') {
  const now = Date.now()
  return { id: createId('note'), content, createdAt: now, updatedAt: now }
}
