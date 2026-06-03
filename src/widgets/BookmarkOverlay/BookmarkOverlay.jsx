import { ArrowLeft, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getFolderChildren, removeBookmark } from '../../lib/bookmarks.js'
import BookmarkIcon from '../BookmarkIcon/BookmarkIcon.jsx'
import styles from '../../App.module.css'

export default function BookmarkOverlay({ rootId, title, onClose }) {
  const [stack, setStack] = useState([{ id: rootId, title }])
  const [children, setChildren] = useState([])
  const [loading, setLoading] = useState(true)
  const current = stack[stack.length - 1]

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const next = await getFolderChildren(current.id)
      if (!cancelled) {
        setChildren(next)
        setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [current.id])

  const deleteNode = async (node) => {
    await removeBookmark(node.id, !node.url)
    setChildren(await getFolderChildren(current.id))
  }

  return (
    <div className={styles.overlayBackdrop} role="dialog" aria-modal="true" aria-label="북마크 보기">
      <section className={styles.overlayPanel}>
        <header className={styles.overlayHeader}>
          <div>
            <p className={styles.breadcrumb}>{stack.map((item) => item.title).join(' / ')}</p>
            <h2>{current.title}</h2>
          </div>
          <div className={styles.overlayActions}>
            {stack.length > 1 && <button type="button" className={styles.iconButton} onClick={() => setStack((items) => items.slice(0, -1))} aria-label="뒤로"><ArrowLeft size={18} /></button>}
            <button type="button" className={styles.iconButton} onClick={onClose} aria-label="닫기"><X size={18} /></button>
          </div>
        </header>
        {loading ? <div className={styles.bookmarkSkeleton} /> : (
          <div className={styles.overlayGrid}>
            {children.length === 0 && <p className={styles.empty}>이 폴더는 비어 있습니다.</p>}
            {children.map((node) => !node.url ? (
              <button key={node.id} type="button" className={`${styles.bookmarkTile} ${styles.folderTile}`} onClick={() => setStack((items) => [...items, { id: node.id, title: node.title || '폴더' }])}>
                <span className={`${styles.bookmarkIconFrame} ${styles.folderIconFrame}`} aria-hidden="true">
                  <span className={styles.folderGlyph} />
                </span>
                <span>{node.title || '폴더'}</span>
              </button>
            ) : (
              <div className={styles.bookmarkTileWrap} key={node.id}>
                <a className={styles.bookmarkTile} href={node.url}>
                  <BookmarkIcon title={node.title} url={node.url} />
                  <span>{node.title || node.url}</span>
                </a>
                <button type="button" className={styles.tileDelete} onClick={() => deleteNode(node)} aria-label="북마크 삭제"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
