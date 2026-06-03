import { useState } from 'react'
import { faviconUrl } from '../../lib/bookmarks.js'
import { bookmarkAccentHue, bookmarkInitial } from '../../lib/pure.js'
import styles from '../../App.module.css'

export default function BookmarkIcon({ title, url }) {
  const [fallback, setFallback] = useState(false)

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
        src={faviconUrl(url, 128)}
        srcSet={`${faviconUrl(url, 64)} 1x, ${faviconUrl(url, 128)} 2x`}
        alt=""
        decoding="async"
        draggable="false"
        onError={() => setFallback(true)}
      />
    </span>
  )
}
