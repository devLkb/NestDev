import { getChromeApi, hasChromeNamespace } from './chromeApi.js'
import { isLikelyUrl, normalizeNavigableUrl } from './pure.js'

export async function runSearchOrNavigate(rawQuery) {
  const query = rawQuery.trim()
  if (!query) return { type: 'empty' }

  if (isLikelyUrl(query)) {
    const url = normalizeNavigableUrl(query)
    globalThis.location.assign(url)
    return { type: 'navigate', url }
  }

  if (hasChromeNamespace('search')) {
    await getChromeApi().search.query({ text: query })
    return { type: 'search', query }
  }

  const fallbackUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`
  globalThis.location.assign(fallbackUrl)
  return { type: 'fallback-search', url: fallbackUrl }
}
