import { chromeRuntimeUrl, getChromeApi, hasChromeNamespace } from './chromeApi.js'
import { sortBookmarkChildren } from './pure.js'

function bookmarksApi() {
  return getChromeApi()?.bookmarks
}

export function faviconUrl(pageUrl, size = 48) {
  const url = new URL(chromeRuntimeUrl('/_favicon/'), globalThis.location?.href || 'http://localhost/')
  url.searchParams.set('pageUrl', pageUrl)
  url.searchParams.set('size', String(size))
  return url.toString()
}

export async function getBookmarkTree() {
  if (!hasChromeNamespace('bookmarks')) return []
  return bookmarksApi().getTree()
}

export async function findBookmarkBarId() {
  const tree = await getBookmarkTree()
  const root = tree[0]
  const bar = root?.children?.find((node) => node.folderType === 'bookmarks-bar')
  return bar?.id || root?.children?.[0]?.id || '1'
}

export async function getFolderChildren(folderId) {
  if (!hasChromeNamespace('bookmarks')) return []
  const [folder] = await bookmarksApi().getSubTree(folderId)
  return sortBookmarkChildren(folder?.children || [])
}

export function onBookmarksChanged(callback) {
  const api = bookmarksApi()
  if (!api) return () => {}
  const events = [api.onChanged, api.onMoved, api.onCreated, api.onRemoved]
  events.forEach((event) => event?.addListener(callback))
  return () => events.forEach((event) => event?.removeListener(callback))
}

export async function createBookmark(parentId, title, url) {
  return bookmarksApi().create({ parentId, title, url })
}

export async function createFolder(parentId, title) {
  return bookmarksApi().create({ parentId, title })
}

export async function updateBookmark(id, changes) {
  return bookmarksApi().update(id, changes)
}

export async function removeBookmark(id, isFolder = false) {
  return isFolder ? bookmarksApi().removeTree(id) : bookmarksApi().remove(id)
}

export async function moveBookmark(id, destination) {
  return bookmarksApi().move(id, destination)
}
