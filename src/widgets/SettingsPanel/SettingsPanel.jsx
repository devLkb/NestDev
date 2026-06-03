import { X } from 'lucide-react'
import styles from '../../App.module.css'

export default function SettingsPanel({ settings, folders, localOnly, onUpdate, onUpdateVisibleWidget, onClose }) {
  return (
    <div className={styles.overlayBackdrop} role="dialog" aria-modal="true" aria-label="설정">
      <section className={styles.settingsPanel}>
        <header className={styles.overlayHeader}>
          <div>
            <p className={styles.breadcrumb}>NestDev</p>
            <h2>설정</h2>
          </div>
          <button type="button" className={styles.iconButton} onClick={onClose} aria-label="닫기"><X size={18} /></button>
        </header>
        {localOnly && <p className={styles.notice}>설정이 이 기기에만 저장됨</p>}

        <label className={styles.settingRow}>
          <span>테마</span>
          <select value={settings.theme} onChange={(event) => onUpdate({ theme: event.target.value })}>
            <option value="dark">다크</option>
            <option value="light">라이트</option>
          </select>
        </label>

        <label className={styles.settingRow}>
          <span>시계 형식</span>
          <select value={settings.clockFormat} onChange={(event) => onUpdate({ clockFormat: event.target.value })}>
            <option value="24h">24시간</option>
            <option value="12h">12시간</option>
          </select>
        </label>

        <label className={styles.settingRow}>
          <span>배경</span>
          <select value={settings.backgroundId} onChange={(event) => onUpdate({ backgroundId: event.target.value })}>
            <option value="gradient">그라데이션</option>
          </select>
        </label>

        <label className={styles.settingRow}>
          <span>북마크 루트</span>
          <select value={settings.bookmarkRootId} onChange={(event) => onUpdate({ bookmarkRootId: event.target.value })}>
            {folders.length === 0 && <option value="1">북마크바</option>}
            {folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.title || '북마크 폴더'}</option>)}
          </select>
        </label>

        <fieldset className={styles.fieldset}>
          <legend>위젯 표시</legend>
          {[
            ['clock', '시계'],
            ['ports', '포트'],
            ['note', '노트'],
          ].map(([key, label]) => (
            <label key={key} className={styles.checkRow}>
              <input type="checkbox" checked={settings.visibleWidgets[key]} onChange={(event) => onUpdateVisibleWidget(key, event.target.checked)} />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
      </section>
    </div>
  )
}
