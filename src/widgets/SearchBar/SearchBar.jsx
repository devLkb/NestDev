import { Grid2X2, MessageCircle, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { runSearchOrNavigate } from '../../lib/search.js'
import styles from '../../App.module.css'

export default function SearchBar({ onOpenBookmarks }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === '/' && document.activeElement !== inputRef.current) {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <form className={styles.searchBar} onSubmit={(event) => { event.preventDefault(); runSearchOrNavigate(query) }} role="search">
      <Search size={20} aria-hidden="true" />
      <input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="검색어 또는 URL 입력" aria-label="검색어 또는 URL" />
      <button type="button" disabled aria-label="메시지 패널은 다음 버전에서 제공됩니다">
        <MessageCircle size={18} />
      </button>
      <button type="button" onClick={onOpenBookmarks} aria-label="전체 북마크 보기">
        <Grid2X2 size={20} />
      </button>
    </form>
  )
}
