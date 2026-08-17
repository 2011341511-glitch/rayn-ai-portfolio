import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router-dom';
import './styles.css';
import './index.css';
import { AppShell } from './components/AppShell';
import { HomePage } from './pages/HomePage';
import { ProjectDemoPage } from './pages/ProjectDemoPage';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/wiki" element={<ProjectDemoPage projectId="wiki" />} />
          <Route path="/skill-eval" element={<ProjectDemoPage projectId="skill-eval" />} />
          <Route path="/feedback-agent" element={<ProjectDemoPage projectId="feedback-agent" />} />
          <Route path="/web-forge" element={<ProjectDemoPage projectId="web-forge" />} />
        </Route>
      </Routes>
    </HashRouter>
  </React.StrictMode>,
);
