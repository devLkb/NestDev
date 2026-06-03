import { useCallback, useState } from 'react'
import { faviconUrl } from '../../lib/bookmarks.js'
import { bookmarkAccentHue, bookmarkInitial } from '../../lib/pure.js'
import styles from '../../App.module.css'

export default function BookmarkIcon({ title, url }) {
  const [fallback, setFallback] = useState(false)

  const showFallback = useCallback(() => {
    setFallback(true)
  }, [])

  const handleLoad = useCallback((event) => {
    const image = event.currentTarget
    if (!image.naturalWidth || !image.naturalHeight) showFallback()
  }, [showFallback])

  if (fallback) {
    return (
      <span className={styles.bookmarkIconFrame} style={{ '--bookmark-hue': bookmarkAccentHue(title, url) }} aria-hidden="true">
        <span className={styles.bookmarkFallback}>{bookmarkInitial(title, url)}</span>
      </span>
    )
  }

  return (
    <span className={styles.bookmarkIconFrame} aria-hidden="true">
      <img
        className={styles.bookmarkIconImage}
        src={faviconUrl(url, 48)}
        alt=""
        decoding="async"
        draggable="false"
        onLoad={handleLoad}
        onError={showFallback}
      />
    </span>
  )
}
