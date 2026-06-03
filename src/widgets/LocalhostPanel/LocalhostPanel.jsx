import { Plus, RefreshCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { activateTab, getUnregisteredDetected } from '../../lib/ports.js'
import { normalizePortEntry, validatePort } from '../../lib/pure.js'
import styles from '../../App.module.css'

function statusLabel(status) {
  if (status === 'up') return '켜짐'
  if (status === 'down') return '꺼짐'
  return '확인 중'
}

export default function LocalhostPanel({ ports, setPorts, detectedTabs, statuses, loading, localOnly, onRefresh }) {
  const [form, setForm] = useState({ port: '', label: '', protocol: 'http' })
  const [error, setError] = useState('')
  const suggestions = getUnregisteredDetected(ports, detectedTabs)

  const addPort = (nextPort) => {
    const normalized = normalizePortEntry(nextPort)
    const validation = validatePort(normalized.port)
    if (!validation.valid) {
      setError(validation.error)
      return
    }
    if (ports.some((item) => item.port === normalized.port && item.protocol === normalized.protocol)) {
      setError('이미 등록된 프로토콜+포트입니다.')
      return
    }
    setPorts((current) => [...current, normalized])
    setForm({ port: '', label: '', protocol: 'http' })
    setError('')
  }

  return (
    <section className={styles.panel} aria-label="localhost 포트">
      <div className={styles.panelHeader}>
        <div>
          <h2>localhost</h2>
          <p>등록 포트와 열린 개발 서버 탭</p>
        </div>
        <button type="button" className={styles.iconButton} onClick={onRefresh} aria-label="포트 새로고침">
          <RefreshCcw size={17} />
        </button>
      </div>

      {localOnly && <p className={styles.notice}>이 포트 목록은 이 기기에만 저장됨</p>}
      <p className={styles.hint}>HTTPS 자체서명 인증서는 실제로 켜져 있어도 꺼짐으로 표시될 수 있습니다.</p>

      {loading ? <div className={styles.skeletonList} /> : (
        <div className={styles.portList}>
          {ports.length === 0 && <p className={styles.empty}>등록된 포트가 없습니다. 포트를 추가하세요.</p>}
          {ports.map((port) => {
            const key = `${port.protocol}:${port.port}`
            const detected = detectedTabs.find((tab) => tab.protocol === port.protocol && tab.port === port.port)
            const status = statuses[key] || 'checking'
            return (
              <div className={styles.portRow} key={port.id}>
                <span className={`${styles.statusDot} ${styles[status]}`} aria-label={statusLabel(status)} />
                <button type="button" className={styles.portMain} onClick={() => detected ? activateTab(detected.tabId) : globalThis.open?.(`${port.protocol}://127.0.0.1:${port.port}`, '_blank')}>
                  <strong>{port.label || `${port.protocol}:${port.port}`}</strong>
                  <span>{port.protocol}://127.0.0.1:{port.port}</span>
                </button>
                <button type="button" className={styles.ghostIcon} onClick={() => setPorts((current) => current.filter((item) => item.id !== port.id))} aria-label="포트 삭제">
                  <Trash2 size={15} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <form className={styles.portForm} onSubmit={(event) => { event.preventDefault(); addPort(form) }}>
        <select value={form.protocol} onChange={(event) => setForm((current) => ({ ...current, protocol: event.target.value }))} aria-label="프로토콜">
          <option value="http">http</option>
          <option value="https">https</option>
        </select>
        <input value={form.port} onChange={(event) => setForm((current) => ({ ...current, port: event.target.value }))} inputMode="numeric" placeholder="3000" aria-label="포트" />
        <input value={form.label} onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))} placeholder="라벨" aria-label="라벨" />
        <button type="submit" className={styles.iconButton} aria-label="포트 추가"><Plus size={17} /></button>
      </form>
      {error && <p className={styles.error}>{error}</p>}

      {suggestions.length > 0 && (
        <div className={styles.detectedList}>
          <p>감지된 탭</p>
          {suggestions.map((tab) => (
            <button key={`${tab.protocol}:${tab.port}`} type="button" onClick={() => addPort({ port: tab.port, protocol: tab.protocol, label: tab.title })}>
              {tab.protocol}:{tab.port} 등록
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
