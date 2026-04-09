import './globals.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { App } from './App'
import { ErrorBoundary } from './components/layout/ErrorBoundary'
import { DashboardPage } from './pages/DashboardPage'
import { BoardPage } from './pages/BoardPage'
import { CalendarPage } from './pages/CalendarPage'
import { HallOfFamePage } from './pages/HallOfFamePage'
import { SettingsPage } from './pages/SettingsPage'
import { AboutPage } from './pages/AboutPage'

// HashRouter is the right choice for Electron — the renderer loads from a
// `file://` URL in production, which means BrowserRouter's pushState routes
// have no server to handle them on reload. HashRouter uses the URL fragment
// (#/foo) and works without any server-side support.
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route element={<App />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="board" element={<BoardPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="hof" element={<HallOfFamePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="about" element={<AboutPage />} />
            {/* Anything else falls back to the dashboard. */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
