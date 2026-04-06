import { useState, useEffect, useMemo } from 'react'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { ArchiveBanner } from './components/layout/ArchiveBanner'
import { DemoBanner } from './components/layout/DemoBanner'
import { ShortcutsDialog } from './components/layout/ShortcutsDialog'
import { DashboardPage } from './pages/DashboardPage'
import { BoardPage } from './pages/BoardPage'
import { TimelinePage } from './pages/TimelinePage'
import { HallOfFamePage } from './pages/HallOfFamePage'
import { SettingsPage } from './pages/SettingsPage'
import { AboutPage } from './pages/AboutPage'
import { CVEDetailPanel } from './components/cve/CVEDetailPanel'
import { CVEForm } from './components/cve/CVEForm'
import { VendorForm } from './components/vendor/VendorForm'
import { useBoardStore } from './store/boardStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { daysUntil } from './lib/utils'

type Page = 'dashboard' | 'board' | 'timeline' | 'hof' | 'settings' | 'about'

const PAGE_TITLES: Record<Page, string> = {
  dashboard: 'Dashboard',
  board: 'Kanban Board',
  timeline: 'Timeline',
  hof: 'Hall of Fame',
  settings: 'Settings',
  about: 'About'
}

export function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const { loadBoard, isLoading, error, archivedCVEs, cves, selectCVE, selectedCVEId, swimlanes } = useBoardStore()
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [newCVEOpen, setNewCVEOpen] = useState(false)
  const [newVendorOpen, setNewVendorOpen] = useState(false)

  // Count urgent items for dashboard badge
  const urgentCount = cves.filter(c => {
    if (c.stage === 'Published') return false
    const deadlineDays = daysUntil(c.disclosure_deadline)
    if (deadlineDays !== null && deadlineDays < 0) return true
    const followupStages = ['Vendor Contacted', 'Negotiating', 'CVE Requested']
    if (followupStages.includes(c.stage) && c.followup_due_date && c.followup_due_date <= new Date().toISOString().slice(0, 10)) return true
    return false
  }).length

  const shortcuts = useMemo(() => [
    { key: 'n', ctrl: true, description: 'New vulnerability', action: () => { if (swimlanes.length > 0) setNewCVEOpen(true) } },
    { key: 'n', ctrl: true, shift: true, description: 'New vendor', action: () => setNewVendorOpen(true) },
    { key: 'Escape', description: 'Close panel / dialog', action: () => { if (selectedCVEId) selectCVE(null) } },
    { key: '1', ctrl: true, description: 'Go to Dashboard', action: () => setPage('dashboard') },
    { key: '2', ctrl: true, description: 'Go to Board', action: () => setPage('board') },
    { key: '3', ctrl: true, description: 'Go to Timeline', action: () => setPage('timeline') },
    { key: '4', ctrl: true, description: 'Go to Hall of Fame', action: () => setPage('hof') },
    { key: '5', ctrl: true, description: 'Go to Settings', action: () => setPage('settings') },
    { key: '/', ctrl: true, description: 'Show keyboard shortcuts', action: () => setShortcutsOpen(true) },
  ], [selectedCVEId, selectCVE, swimlanes.length])

  useKeyboardShortcuts(shortcuts)

  useEffect(() => {
    loadBoard()
  }, [loadBoard])

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar currentPage={page} onNavigate={setPage} hofCount={archivedCVEs.length} urgentCount={urgentCount} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title={PAGE_TITLES[page]} showBoardFilters={page === 'board'} />
        <ArchiveBanner />
        <DemoBanner />

        {isLoading && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p className="text-sm">Loading…</p>
          </div>
        )}

        {error && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-destructive text-sm font-semibold mb-2">Failed to load data</p>
              <p className="text-xs text-muted-foreground">{error}</p>
            </div>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {page === 'dashboard' && <DashboardPage />}
            {page === 'board' && <BoardPage />}
            {page === 'timeline' && <TimelinePage />}
            {page === 'hof' && <HallOfFamePage />}
            {page === 'settings' && <SettingsPage />}
            {page === 'about' && <AboutPage />}
            <CVEDetailPanel />
          </>
        )}
      </div>

      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <CVEForm open={newCVEOpen} onOpenChange={setNewCVEOpen} />
      <VendorForm open={newVendorOpen} onOpenChange={setNewVendorOpen} />
    </div>
  )
}
