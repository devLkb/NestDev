import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Settings } from 'lucide-react'
import { findBookmarkBarId, getBookmarkTree } from './lib/bookmarks.js'
import { getPorts, getSettings, getNotes, savePorts, saveSettings, saveNotes } from './lib/storage.js'
import { getFolderChildren } from './lib/bookmarks.js'
import { checkPortStatus, queryLocalTabs } from './lib/ports.js'
import Clock from './widgets/Clock/Clock.jsx'
import LocalhostPanel from './widgets/LocalhostPanel/LocalhostPanel.jsx'
import NoteList from './widgets/Note/NoteList.jsx'
import SearchBar from './widgets/SearchBar/SearchBar.jsx'
import BookmarkGrid from './widgets/BookmarkGrid/BookmarkGrid.jsx'
import BookmarkOverlay from './widgets/BookmarkOverlay/BookmarkOverlay.jsx'
import SettingsPanel from './widgets/SettingsPanel/SettingsPanel.jsx'
import './design/tokens.css'
import styles from './App.module.css'

const SAVE_DELAY = 350

function collectTopLevelFolders(tree) {
  const root = tree[0]
  return (root?.children || []).filter((node) => !node.url)
}

function App() {
  const [settings, setSettings] = useState(null)
  const [ports, setPorts] = useState([])
  const [notes, setNotes] = useState([])
  const [bookmarks, setBookmarks] = useState([])
  const [bookmarkFolders, setBookmarkFolders] = useState([])
  const [detectedTabs, setDetectedTabs] = useState([])
  const [portStatuses, setPortStatuses] = useState({})
  const [localOnly, setLocalOnly] = useState({ settings: false, ports: false, notes: false })
  const [loading, setLoading] = useState({ settings: true, ports: true, notes: true, bookmarks: true })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [bookmarkOverlayOpen, setBookmarkOverlayOpen] = useState(false)
  const [activeFolder, setActiveFolder] = useState(null)
  const saveTimers = useRef({})
  const initialized = useRef({ settings: false, ports: false, notes: false })
  const portsRef = useRef([])

  const visibleWidgets = settings?.visibleWidgets || {}

  const loadBookmarks = useCallback(async (rootId = settings?.bookmarkRootId) => {
    await Promise.resolve()
    setLoading((current) => ({ ...current, bookmarks: true }))
    try {
      const tree = await getBookmarkTree()
      setBookmarkFolders(collectTopLevelFolders(tree))
      const fallbackRoot = rootId || (await findBookmarkBarId())
      if (!settings?.bookmarkRootId && settings) {
        setSettings((current) => ({ ...current, bookmarkRootId: fallbackRoot }))
      }
      const children = await getFolderChildren(fallbackRoot)
      setBookmarks(children)
    } finally {
      setLoading((current) => ({ ...current, bookmarks: false }))
    }
  }, [settings])

  useEffect(() => {
    portsRef.current = ports
  }, [ports])

  const refreshPorts = useCallback(async (registeredPorts = portsRef.current) => {
    setDetectedTabs(await queryLocalTabs())
    const checking = {}
    registeredPorts.forEach((port) => {
      checking[`${port.protocol}:${port.port}`] = 'checking'
    })
    setPortStatuses((current) => ({ ...current, ...checking }))

    const results = await Promise.all(
      registeredPorts.map(async (port) => [`${port.protocol}:${port.port}`, await checkPortStatus(port)]),
    )
    setPortStatuses((current) => ({ ...current, ...Object.fromEntries(results) }))
  }, [])

  useEffect(() => {
    let cancelled = false
    async function boot() {
      const [settingsResult, portsResult, notesResult] = await Promise.all([
        getSettings(),
        getPorts(),
        getNotes(),
      ])
      if (cancelled) return
      setSettings(settingsResult.settings)
      setPorts(portsResult.ports)
      setNotes(notesResult.notes)
      setLocalOnly({
        settings: settingsResult.localOnly,
        ports: portsResult.localOnly,
        notes: notesResult.localOnly,
      })
      setLoading({ settings: false, ports: false, notes: false, bookmarks: true })
      initialized.current = { settings: true, ports: true, notes: true }
      await refreshPorts(portsResult.ports)
    }
    boot()
    return () => { cancelled = true }
  }, [refreshPorts])

  useEffect(() => {
    if (!settings) return undefined
    document.documentElement.dataset.theme = settings.theme
    const id = setTimeout(() => {
      loadBookmarks(settings.bookmarkRootId)
    }, 0)
    return () => clearTimeout(id)
  }, [settings, loadBookmarks])

  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden) refreshPorts()
    }
    const id = setInterval(() => {
      if (!document.hidden) refreshPorts()
    }, 30000)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [refreshPorts])

  useEffect(() => {
    if (!initialized.current.settings || !settings) return
    clearTimeout(saveTimers.current.settings)
    saveTimers.current.settings = setTimeout(async () => {
      const result = await saveSettings(settings)
      setLocalOnly((current) => ({ ...current, settings: result.localOnly }))
    }, SAVE_DELAY)
  }, [settings])

  useEffect(() => {
    if (!initialized.current.ports) return
    clearTimeout(saveTimers.current.ports)
    saveTimers.current.ports = setTimeout(async () => {
      const result = await savePorts(ports)
      setLocalOnly((current) => ({ ...current, ports: result.localOnly }))
      refreshPorts(ports)
    }, SAVE_DELAY)
  }, [ports, refreshPorts])

  useEffect(() => {
    if (!initialized.current.notes) return
    clearTimeout(saveTimers.current.notes)
    saveTimers.current.notes = setTimeout(async () => {
      const result = await saveNotes(notes)
      setLocalOnly((current) => ({ ...current, notes: result.localOnly }))
    }, SAVE_DELAY)
  }, [notes])

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setBookmarkOverlayOpen(false)
        setActiveFolder(null)
        setSettingsOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const updateSettings = useCallback((patch) => {
    setSettings((current) => ({ ...current, ...patch }))
  }, [])

  const updateVisibleWidget = useCallback((key, value) => {
    setSettings((current) => ({
      ...current,
      visibleWidgets: { ...current.visibleWidgets, [key]: value },
    }))
  }, [])

  const storageWarning = useMemo(() => Object.entries(localOnly)
    .filter(([, value]) => value)
    .map(([key]) => key)
    .join(', '), [localOnly])

  if (!settings || loading.settings) {
    return <main className={styles.shell}><div className={styles.loading}>NestDev를 준비하는 중…</div></main>
  }

  return (
    <main className={styles.shell}>
      <div className={styles.backgroundGlow} aria-hidden="true" />
      <section className={styles.leftColumn} aria-label="개발자 위젯">
        {visibleWidgets.clock && <Clock clockFormat={settings.clockFormat} />}
        {visibleWidgets.ports && (
          <LocalhostPanel
            ports={ports}
            setPorts={setPorts}
            detectedTabs={detectedTabs}
            statuses={portStatuses}
            loading={loading.ports}
            localOnly={localOnly.ports}
            onRefresh={() => refreshPorts()}
          />
        )}
        {visibleWidgets.note && (
          <NoteList
            notes={notes}
            setNotes={setNotes}
            loading={loading.notes}
            localOnly={localOnly.notes}
          />
        )}
      </section>

      <section className={styles.centerColumn} aria-label="검색과 북마크">
        <SearchBar onOpenBookmarks={() => setBookmarkOverlayOpen(true)} />
        <BookmarkGrid
          rootId={settings.bookmarkRootId}
          bookmarks={bookmarks}
          loading={loading.bookmarks}
          onOpenFolder={(folder) => setActiveFolder(folder)}
          onChanged={() => loadBookmarks(settings.bookmarkRootId)}
        />
      </section>

      <aside className={styles.rightColumn} aria-label="설정">
        <button className={styles.settingsButton} type="button" onClick={() => setSettingsOpen(true)} aria-label="설정 열기">
          <Settings size={22} />
        </button>
      </aside>

      {storageWarning && <p className={styles.localOnlyToast}>일부 데이터가 이 기기에만 저장됨: {storageWarning}</p>}

      {settingsOpen && (
        <SettingsPanel
          settings={settings}
          folders={bookmarkFolders}
          localOnly={localOnly.settings}
          onUpdate={updateSettings}
          onUpdateVisibleWidget={updateVisibleWidget}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {(bookmarkOverlayOpen || activeFolder) && (
        <BookmarkOverlay
          rootId={activeFolder?.id || settings.bookmarkRootId}
          title={activeFolder?.title || '전체 북마크'}
          onClose={() => {
            setBookmarkOverlayOpen(false)
            setActiveFolder(null)
            loadBookmarks(settings.bookmarkRootId)
          }}
        />
      )}
    </main>
  )
}

export default App
