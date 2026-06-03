import { getChromeApi, hasChromeNamespace } from './chromeApi.js'
import { FETCHABLE_LOCAL_HOST, mergeDetectedWithRegistered, parseLocalTab } from './pure.js'

export async function checkPortStatus({ port, protocol = 'http' }, timeoutMs = 2000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    await fetch(`${protocol}://${FETCHABLE_LOCAL_HOST}:${port}`, {
      mode: 'no-cors',
      signal: controller.signal,
    })
    return 'up'
  } catch {
    return 'down'
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function queryLocalTabs() {
  if (!hasChromeNamespace('tabs')) return []
  const tabs = await getChromeApi().tabs.query({})
  const byPort = new Map()
  tabs.map(parseLocalTab).filter(Boolean).forEach((tab) => {
    const key = `${tab.protocol}:${tab.port}`
    if (!byPort.has(key)) byPort.set(key, tab)
  })
  return [...byPort.values()].sort((a, b) => a.port - b.port)
}

export async function activateTab(tabId) {
  const chromeApi = getChromeApi()
  const tabsApi = chromeApi?.tabs
  if (!tabsApi || tabId === undefined) return
  const tab = await tabsApi.update(tabId, { active: true })
  if (tab?.windowId !== undefined && chromeApi?.windows?.update) {
    await chromeApi.windows.update(tab.windowId, { focused: true })
  }
}

export function getUnregisteredDetected(registered, detected) {
  return mergeDetectedWithRegistered(registered, detected)
}
