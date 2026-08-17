import { useState } from 'react'
import { Activity, ListFilter, Radar, type LucideIcon } from 'lucide-react'
import Hot from './pages/Hot'
import Items from './pages/Items'
import styles from './App.module.css'

type Page = 'hot' | 'items'

export default function App() {
  const [page, setPage] = useState<Page>('hot')

  return (
    <div className={styles.layout}>
      {/* 侧边栏 */}
      <nav className={styles.nav}>
        <div className={styles.logo}>
          <span className={styles.logoMark}><Radar aria-hidden="true" size={19} strokeWidth={1.8} /></span>
          <span>
            <span className={styles.logoText}>反馈看板</span>
            <span className={styles.logoMeta}>SIGNAL TRIAGE</span>
          </span>
        </div>
        <NavItem label="热度榜" icon={Activity} active={page === 'hot'} onClick={() => setPage('hot')} />
        <NavItem label="反馈明细" icon={ListFilter} active={page === 'items'} onClick={() => setPage('items')} />
        <div className={styles.navFooter}>
          <span className={styles.apiLink}><i aria-hidden="true" />公开版 · 本地脱敏样例</span>
        </div>
      </nav>

      {/* 主内容 */}
      <main className={styles.main}>
        {page === 'hot'   && <Hot />}
        {page === 'items' && <Items />}
      </main>
    </div>
  )
}

function NavItem({ label, icon: Icon, active, onClick }: {
  label: string; icon: LucideIcon; active: boolean; onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`${styles.navItem} ${active ? styles.navActive : ''}`}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className={styles.navIcon} aria-hidden="true" size={17} strokeWidth={1.8} />
      <span>{label}</span>
    </button>
  )
}
