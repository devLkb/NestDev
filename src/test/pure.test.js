import test from 'node:test'
import assert from 'node:assert/strict'
import {
  bookmarkAccentHue,
  bookmarkInitial,
  exceedsSyncItemQuota,
  formatClock,
  isLikelyUrl,
  mergeDetectedWithRegistered,
  normalizeNavigableUrl,
  parseLocalTab,
  sortBookmarkChildren,
  validatePort,
} from '../lib/pure.js'
import { faviconUrl } from '../lib/bookmarks.js'

test('validatePort accepts only integer Chrome port range', () => {
  assert.deepEqual(validatePort(3000), { valid: true, port: 3000 })
  assert.equal(validatePort(0).valid, false)
  assert.equal(validatePort(65536).valid, false)
  assert.equal(validatePort('abc').valid, false)
})

test('URL detection routes URLs separately from search text', () => {
  assert.equal(isLikelyUrl('https://example.com/path'), true)
  assert.equal(isLikelyUrl('example.com/path'), true)
  assert.equal(isLikelyUrl('localhost:5173'), true)
  assert.equal(isLikelyUrl('hello world'), false)
  assert.equal(normalizeNavigableUrl('example.com'), 'https://example.com')
  assert.equal(normalizeNavigableUrl('http://localhost:3000'), 'http://localhost:3000')
})

test('parseLocalTab only returns localhost-family tabs', () => {
  assert.deepEqual(parseLocalTab({ id: 1, title: 'dev', url: 'http://localhost:5173/x' }), {
    tabId: 1,
    title: 'dev',
    url: 'http://localhost:5173/x',
    host: 'localhost',
    port: 5173,
    protocol: 'http',
  })
  assert.equal(parseLocalTab({ id: 2, url: 'https://example.com' }), null)
  assert.equal(parseLocalTab({ id: 3 }), null)
})

test('detected ports exclude registered protocol+port pairs', () => {
  const registered = [{ protocol: 'http', port: 3000 }]
  const detected = [{ protocol: 'http', port: 3000 }, { protocol: 'https', port: 3000 }]
  assert.deepEqual(mergeDetectedWithRegistered(registered, detected), [{ protocol: 'https', port: 3000 }])
})

test('bookmark children render folders before bookmark URLs while preserving index', () => {
  const sorted = sortBookmarkChildren([
    { id: 'b', index: 0, title: 'B', url: 'https://b.test' },
    { id: 'f2', index: 2, title: 'F2' },
    { id: 'f1', index: 1, title: 'F1' },
  ])
  assert.deepEqual(sorted.map((item) => item.id), ['f1', 'f2', 'b'])
})

test('bookmark icon fallback uses title or URL deterministically', () => {
  assert.equal(bookmarkInitial('나무위키', 'https://namu.wiki'), '나')
  assert.equal(bookmarkInitial('', 'https://github.com/openai'), 'G')
  assert.equal(bookmarkAccentHue('Git', 'https://github.com'), bookmarkAccentHue('Git', 'https://github.com'))
})


test('favicon URL uses Chrome MV3 endpoint with stable 48px default', () => {
  const url = new URL(faviconUrl('https://github.com/openai?tab=repositories'))
  assert.equal(url.pathname, '/_favicon/')
  assert.equal(url.searchParams.get('pageUrl'), 'https://github.com/openai?tab=repositories')
  assert.equal(url.searchParams.get('size'), '48')
})

test('sync quota helper detects oversized values', () => {
  assert.equal(exceedsSyncItemQuota({ a: 'small' }), false)
  assert.equal(exceedsSyncItemQuota({ a: 'x'.repeat(9000) }), true)
})

test('clock formatting supports 12h and 24h modes', () => {
  const date = new Date('2026-06-03T13:05:00+09:00')
  assert.match(formatClock(date, '24h'), /13|오후/)
  assert.match(formatClock(date, '12h'), /오후|PM/i)
})
