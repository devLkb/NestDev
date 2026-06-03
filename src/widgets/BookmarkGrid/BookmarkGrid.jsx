import { ExternalLink, Folder, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { createBookmark, createFolder, faviconUrl, removeBookmark } from '../../lib/bookmarks.js'
import { isLikelyUrl, normalizeNavigableUrl } from '../../lib/pure.js'
import styles from '../../App.module.css'

const DEFAULT_VISIBLE = 12

function BookmarkTile({ node, onOpenFolder, onDelete }) {
  const isFolder = !node.url
  if (isFolder) {
    return (
      <button type="button" className={`${styles.bookmarkTile} ${styles.folderTile}`} onClick={() => onOpenFolder(node)}>
        <Folder size={26} />
        <span>{node.title || '폴더'}</span>
      </button>
    )
  }

  return (
    <div className={styles.bookmarkTileWrap}>
      <a className={styles.bookmarkTile} href={node.url} title={node.title || node.url}>
        <img src={faviconUrl(node.url)} alt="" onError={(event) => { event.currentTarget.style.display = 'none' }} />
        <span>{node.title || node.url}</span>
        <ExternalLink size={13} />
      </a>
      <button type="button" className={styles.tileDelete} onClick={() => onDelete(node)} aria-label="북마크 삭제"><Trash2 size={13} /></button>
    </div>
  )
}

export default function BookmarkGrid({ rootId, bookmarks, loading, onOpenFolder, onChanged }) {
  const [expanded, setExpanded] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({ type: 'bookmark', title: '', url: '' })
  const visible = expanded ? bookmarks : bookmarks.slice(0, DEFAULT_VISIBLE)
  const hasMore = bookmarks.length > DEFAULT_VISIBLE

  const submit = async (event) => {
    event.preventDefault()
    const title = form.title.trim()
    const url = form.url.trim()
    if (!title) return
    if (form.type === 'folder') await createFolder(rootId, title)
    else if (url) await createBookmark(rootId, title, isLikelyUrl(url) ? normalizeNavigableUrl(url) : url)
    setForm({ type: 'bookmark', title: '', url: '' })
    setFormOpen(false)
    onChanged()
  }

  const onDelete = async (node) => {
    await removeBookmark(node.id, !node.url)
    onChanged()
  }

  return (
    <section className={styles.bookmarkSection} aria-label="북마크">
      <div className={styles.bookmarkHeader}>
        <div className={styles.bookmarkTitleRow}>
          <h1>Bookmarks</h1>
          <button type="button" className={styles.ghostIcon} onClick={() => setFormOpen((value) => !value)} aria-label="북마크 추가">
            <Plus size={15} />
          </button>
        </div>
        <span className={styles.bookmarkStatus}>폴더 관리 유지</span>
      </div>

      {formOpen && (
        <form className={styles.bookmarkForm} onSubmit={submit}>
          <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}>
            <option value="bookmark">북마크</option>
            <option value="folder">폴더</option>
          </select>
          <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="이름" />
          {form.type === 'bookmark' && <input value={form.url} onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))} placeholder="https://example.com" />}
          <button type="submit">저장</button>
        </form>
      )}

      {loading ? <div className={styles.bookmarkSkeleton} /> : (
        <>
          <div className={styles.bookmarkGrid}>
            {visible.length === 0 && (
              <button type="button" className={`${styles.bookmarkTile} ${styles.emptyBookmarkTile}`} onClick={() => setFormOpen(true)}>
                <Plus size={22} />
                <span>북마크 추가</span>
              </button>
            )}
            {visible.map((node) => <BookmarkTile key={node.id} node={node} onOpenFolder={onOpenFolder} onDelete={onDelete} />)}
          </div>
          {hasMore && <button type="button" className={styles.moreButton} onClick={() => setExpanded((value) => !value)}>{expanded ? '접기' : `더 보기 (${bookmarks.length - DEFAULT_VISIBLE})`}</button>}
        </>
      )}
    </section>
  )
}
