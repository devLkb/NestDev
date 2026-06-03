export const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0'])
export const FETCHABLE_LOCAL_HOST = '127.0.0.1'
export const SYNC_ITEM_QUOTA_BYTES = 8192

export function createId(prefix = 'id') {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function byteSize(value) {
  return new TextEncoder().encode(JSON.stringify(value)).length
}

export function exceedsSyncItemQuota(value) {
  return byteSize(value) > SYNC_ITEM_QUOTA_BYTES
}

export function validatePort(value) {
  const port = Number(value)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return { valid: false, error: '포트는 1–65535 사이의 숫자여야 합니다.' }
  }
  return { valid: true, port }
}

export function normalizeProtocol(value) {
  return value === 'https' ? 'https' : 'http'
}

export function normalizePortEntry(entry) {
  return {
    id: entry.id || createId('port'),
    port: Number(entry.port),
    label: entry.label?.trim() || '',
    protocol: normalizeProtocol(entry.protocol),
    createdAt: entry.createdAt || Date.now(),
  }
}

export function sortBookmarkChildren(children = []) {
  return [...children].sort((a, b) => {
    const aFolder = !a.url
    const bFolder = !b.url
    if (aFolder !== bFolder) return aFolder ? -1 : 1
    return (a.index ?? 0) - (b.index ?? 0)
  })
}

function bookmarkTextSource(title, url) {
  const label = title?.trim()
  if (label) return label
  try {
    return new URL(url).hostname
  } catch {
    return url?.trim() || '?'
  }
}

export function bookmarkInitial(title, url) {
  const [first = '?'] = Array.from(bookmarkTextSource(title, url))
  return first.toLocaleUpperCase('ko-KR')
}

export function bookmarkAccentHue(title, url) {
  const source = bookmarkTextSource(title, url)
  const hash = Array.from(source).reduce((value, char) => value + char.codePointAt(0), 0)
  return hash % 360
}

export function isLikelyUrl(input) {
  const value = input.trim()
  if (!value || /\s/.test(value)) return false
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(value)) return true
  if (/^(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(value)) return true
  return /^[\w-]+(\.[\w-]+)+(?::\d+)?(?:\/.*)?$/i.test(value)
}

export function normalizeNavigableUrl(input) {
  const value = input.trim()
  if (/^[a-z][a-z\d+.-]*:\/\//i.test(value)) return value
  return `https://${value}`
}

export function parseLocalTab(tab) {
  if (!tab?.url) return null
  try {
    const url = new URL(tab.url)
    if (!LOCAL_HOSTS.has(url.hostname)) return null
    return {
      tabId: tab.id,
      title: tab.title || url.href,
      url: tab.url,
      host: url.hostname,
      port: Number(url.port || (url.protocol === 'https:' ? 443 : 80)),
      protocol: url.protocol === 'https:' ? 'https' : 'http',
    }
  } catch {
    return null
  }
}

export function mergeDetectedWithRegistered(registered = [], detected = []) {
  const registeredKeys = new Set(registered.map((item) => `${item.protocol}:${item.port}`))
  return detected.filter((item) => !registeredKeys.has(`${item.protocol}:${item.port}`))
}

export function formatKoreanDate(date) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(date)
}

export function formatClock(date, clockFormat) {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: clockFormat === '12h',
  }).format(date)
}
