import { useState, useEffect } from 'react'
import { AlertTriangle, CalendarClock, ChevronDown, FileText, Frown, Minus, Save, Smile, Zap, type LucideIcon } from 'lucide-react'
import { api } from '../api'
import type { FeedbackItem } from '../api'
import styles from './Items.module.css'

const TOPICS = ['全部', '可用性Bug', '效果类', '性能类', '产品体验&新功能建议', '产品认可']

const TOPIC_COLOR: Record<string, string> = {
  '可用性Bug':          '#ef4444',
  '效果类':             '#f97316',
  '性能类':             '#eab308',
  '产品体验&新功能建议': '#3b82f6',
  '产品认可':           '#22c55e',
}

const SENTIMENT_ICON: Record<string, LucideIcon> = {
  positive: Smile, negative: Frown, urgent: Zap, neutral: Minus,
}

const SEV_COLOR = ['', '#22c55e', '#84cc16', '#eab308', '#f97316', '#ef4444']

const TRIAGE_LABELS: Record<string, string> = {
  unread: '未读', acknowledged: '已确认', in_progress: '处理中',
  resolved: '已解决', wontfix: '不修', duplicate: '重复',
}

export default function Items() {
  const [topic, setTopic] = useState<string | undefined>(undefined)
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const PAGE = 20

  const load = (t: string | undefined, p: number) => {
    setLoading(true)
    api.items(t, PAGE, p * PAGE)
      .then(r => { setItems(r.items); setTotal(r.total); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load(topic, page) }, [topic, page])

  const handleTopicClick = (t: string) => {
    const next = t === '全部' ? undefined : t
    setTopic(next); setPage(0); setExpanded(null)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>反馈明细</h1>
        <span className={styles.total}>共 {total} 条</span>
      </div>

      <div className={styles.filters}>
        {TOPICS.map(t => (
          <button
            key={t}
            type="button"
            className={`${styles.chip} ${(topic ?? '全部') === t ? styles.active : ''}`}
            style={(topic ?? '全部') === t && t !== '全部'
              ? { borderColor: TOPIC_COLOR[t], color: TOPIC_COLOR[t] } : {}}
            onClick={() => handleTopicClick(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {loading && <div className={styles.loading}>加载中...</div>}

      <div className={styles.list}>
        {items.map(item => (
          <div key={item.id} className={styles.card}>
            <button
              type="button"
              className={styles.cardTop}
              onClick={() => setExpanded(expanded === item.id ? null : item.id)}
              aria-expanded={expanded === item.id}
            >
              <div className={styles.meta}>
                {item.primary_topic && (
                  <span className={styles.tag}
                    style={{ borderColor: TOPIC_COLOR[item.primary_topic] ?? '#6366f1',
                             color: TOPIC_COLOR[item.primary_topic] ?? '#818cf8' }}>
                    {item.primary_topic}
                  </span>
                )}
                {item.severity != null && (
                  <span className={styles.sev} style={{ color: SEV_COLOR[item.severity] }}>
                    <AlertTriangle aria-hidden="true" size={13} strokeWidth={1.9} />
                    <span>{item.severity}</span>
                  </span>
                )}
                {item.sentiment && (
                  <span className={styles.sentiment} title={item.sentiment}>
                    {(() => {
                      const SentimentIcon = SENTIMENT_ICON[item.sentiment ?? '']
                      return SentimentIcon ? <SentimentIcon aria-hidden="true" size={15} strokeWidth={1.9} /> : null
                    })()}
                  </span>
                )}
                {item.speaker && <span className={styles.speaker}>{item.speaker}</span>}
                {item.spoken_at && <span className={styles.time}>{item.spoken_at}</span>}
              </div>
              <div className={styles.preview}>
                {(item.text ?? '').slice(0, 120)}{(item.text ?? '').length > 120 ? '…' : ''}
              </div>
              <div className={styles.foot}>
                <span className={styles.path}><FileText aria-hidden="true" size={12} />{item.split_path}</span>
                <span className={styles.date}><CalendarClock aria-hidden="true" size={12} />{item.created_at.slice(0, 16)}</span>
              </div>
              <ChevronDown className={`${styles.chevron} ${expanded === item.id ? styles.chevronOpen : ''}`} aria-hidden="true" size={16} strokeWidth={1.8} />
            </button>

            {expanded === item.id && (
              <div className={styles.detail}>
                <div className={styles.fullText}>{item.text}</div>
                {item.secondary_topic && (
                  <div className={styles.secondary}>次要分类：{item.secondary_topic}</div>
                )}
                <TriagePanel itemId={item.id} onDone={() => load(topic, page)} />
              </div>
            )}
          </div>
        ))}
      </div>

      {total > PAGE && (
        <div className={styles.pagination}>
          <button type="button" disabled={page === 0} onClick={() => setPage(p => p - 1)}>上一页</button>
          <span>{page + 1} / {Math.ceil(total / PAGE)}</span>
          <button type="button" disabled={(page + 1) * PAGE >= total} onClick={() => setPage(p => p + 1)}>下一页</button>
        </div>
      )}
    </div>
  )
}

// ── 内嵌 Triage 面板 ──────────────────────────────────
function TriagePanel({ itemId, onDone }: { itemId: number; onDone: () => void }) {
  const [status, setStatus] = useState('unread')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    await api.triage(itemId, status, note).catch(() => {})
    setSaving(false)
    onDone()
  }

  return (
    <div className={styles.triage}>
      <select value={status} onChange={e => setStatus(e.target.value)} className={styles.select}>
        {Object.entries(TRIAGE_LABELS).map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
      <input
        className={styles.noteInput}
        placeholder="备注（可选）"
        value={note}
        onChange={e => setNote(e.target.value)}
      />
      <button type="button" className={styles.saveBtn} onClick={save} disabled={saving}>
        <Save aria-hidden="true" size={14} strokeWidth={1.9} />{saving ? '保存中...' : '保存'}
      </button>
    </div>
  )
}
