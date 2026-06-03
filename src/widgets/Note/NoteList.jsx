import { Plus, Trash2 } from 'lucide-react'
import { createNote } from '../../lib/storage.js'
import styles from '../../App.module.css'

export default function NoteList({ notes, setNotes, loading, localOnly }) {
  const addNote = () => setNotes((current) => [createNote(''), ...current])
  const updateNote = (id, content) => setNotes((current) => current.map((note) => note.id === id ? { ...note, content, updatedAt: Date.now() } : note))
  const deleteNote = (id) => setNotes((current) => current.filter((note) => note.id !== id))

  return (
    <section className={styles.panel} aria-label="노트">
      <div className={styles.panelHeader}>
        <div>
          <h2>노트</h2>
          <p>일반 텍스트로 저장됩니다</p>
        </div>
        <button type="button" className={styles.iconButton} onClick={addNote} aria-label="노트 추가"><Plus size={17} /></button>
      </div>
      {localOnly && <p className={styles.notice}>노트가 이 기기에만 저장됨</p>}
      {loading ? <div className={styles.skeletonList} /> : (
        <div className={styles.noteList}>
          {notes.length === 0 && <button type="button" className={styles.emptyButton} onClick={addNote}>Add Note</button>}
          {notes.map((note) => (
            <div className={styles.noteCard} key={note.id}>
              <textarea value={note.content} onChange={(event) => updateNote(note.id, event.target.value)} placeholder="메모 내용" />
              <button type="button" className={styles.ghostIcon} onClick={() => deleteNote(note.id)} aria-label="노트 삭제"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
