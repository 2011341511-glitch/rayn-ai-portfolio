import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Shell } from './components/common'
import { AuthProvider } from './contexts/AuthContext'
import WikiPage from './pages/WikiPage'
import WikiPendingPage from './pages/WikiPendingPage'

export default function WikiDemoApp() {
  return (
    <HashRouter>
      <AuthProvider demoMode>
        <Routes>
          <Route element={<Shell />}>
            <Route path="/" element={<Navigate to="/wiki" replace />} />
            <Route path="/chat" element={<Navigate to="/wiki" replace />} />
            <Route path="/wiki" element={<WikiPage />} />
            <Route path="/wiki/pending" element={<WikiPendingPage />} />
            <Route path="*" element={<Navigate to="/wiki" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </HashRouter>
  )
}
