import { useEffect, useState } from 'react'
import { formatClock, formatKoreanDate } from '../../lib/pure.js'
import styles from '../../App.module.css'

export default function Clock({ clockFormat }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <section className={styles.clock} aria-label="시계">
      <p className={styles.time}>{formatClock(now, clockFormat)}</p>
      <p className={styles.date}>{formatKoreanDate(now)}</p>
    </section>
  )
}
