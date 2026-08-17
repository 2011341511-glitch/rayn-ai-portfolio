import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ThemeProvider } from './components/theme/ThemeProvider'
import WikiDemoApp from './WikiDemoApp'

createRoot(document.getElementById('root')!).render(
  <StrictMode><ThemeProvider><WikiDemoApp /></ThemeProvider></StrictMode>,
)
