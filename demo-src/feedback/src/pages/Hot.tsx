import { useState, useEffect } from 'react'
import { Activity } from 'lucide-react'
import { api } from '../api'
import type { StatsResponse } from '../api'
import styles from './Hot.module.css'

const TOPIC_COLORS: Record<string, string> = {
  '可用性Bug':          '#ef4444',
  '效果类':             '#f97316',
  '性能类':             '#eab308',
  '产品体验&新功能建议': '#3b82f6',
  '产品认可':           '#22c55e',
}

const PERIODS = [
  { label: '7天', days: 7 },
  { label: '30天', days: 30 },
  { label: '全期', days: undefined },
]

export default function Hot() {
  const [data, setData] = useState<StatsResponse | null>(null)
  const [days, setDays] = useState<number | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.stats(days).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [days])

  const max = data ? Math.max(...data.topics.map(t => t.count), 1) : 1

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.heading}>
          <span className={styles.titleMark}><Activity aria-hidden="true" size={19} strokeWidth={1.8} /></span>
          <h1 className={styles.title}>反馈热度榜</h1>
        </div>
        <div className={styles.tabs}>
          {PERIODS.map(p => (
            <button
              key={p.label}
              type="button"
              className={`${styles.tab} ${days === p.days ? styles.active : ''}`}
              onClick={() => setDays(p.days)}
              aria-pressed={days === p.days}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <div className={styles.loading}>加载中...</div>}

      {data && (
        <div className={styles.chart}>
          {data.topics.map(t => {
            const pct = Math.round((t.count / max) * 100)
            const color = TOPIC_COLORS[t.name] ?? '#6366f1'
            return (
              <div key={t.name} className={styles.row}>
                <div className={styles.label}>{t.name}</div>
                <div className={styles.barWrap} aria-label={`${t.name}，${t.count} 条`}>
                  <div
                    className={styles.bar}
                    style={{ width: `${pct}%`, background: color }}
                  />
                  <span className={styles.count}>{t.count}</span>
                </div>
                <div className={styles.summary}>{t.summary}</div>
              </div>
            )
          })}
        </div>
      )}

      {data && data.topics.every(t => t.count === 0) && (
        <div className={styles.empty}>暂无数据，发几条反馈试试~</div>
      )}
    </div>
  )
}
