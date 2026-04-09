import { useState, useEffect, useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from './components/layout/Sidebar'
import { TopBar } from './components/layout/TopBar'
import { ArchiveBanner } from './components/layout/ArchiveBanner'
import { DemoBanner } from './components/layout/DemoBanner'
import { ShortcutsDialog } from './components/layout/ShortcutsDialog'
import { FeaturesTourDialog } from './components/layout/FeaturesTourDialog'
import { CVEDetailPanel } from './components/cve/CVEDetailPanel'
import { CVEForm } from './components/cve/CVEForm'
import { VendorForm } from './components/vendor/VendorForm'
import { useBoardStore } from './store/boardStore'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { daysUntil } from './lib/utils'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/board': 'Kanban Board',
  '/calendar': 'Calendar',
  '/hof': 'Hall of Fame',
  '/settings': 'Settings',
  '/about': 'About'
}

/**
 * Top-level layout. The router (in main.tsx) renders this for every route
 * and swaps the active page into <Outlet />. We keep loading/error/state
 * gates here so they apply uniformly across pages.
 */
export function App() {
  const location = useLocation()
  const navigate = useNavigate()
  const { loadBoard, isLoading, error, archivedCVEs, cves, selectCVE, selectedCVEId, swimlanes } = useBoardStore()
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [newCVEOpen, setNewCVEOpen] = useState(false)
  const [newVendorOpen, setNewVendorOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)

  // Count urgent items for dashboard badge
  const urgentCount = cves.filter((c) => {
    if (c.stage === 'Published') return false
    const deadlineDays = daysUntil(c.disclosure_deadline)
    if (deadlineDays !== null && deadlineDays < 0) return true
    const followupStages = ['Vendor Contacted', 'Negotiating', 'CVE Requested']
    if (followupStages.includes(c.stage) && c.followup_due_date && c.followup_due_date <= new Date().toISOString().slice(0, 10)) return true
    return false
  }).length

  const title = PAGE_TITLES[location.pathname] ?? 'CVEase'
  const showBoardFilters = location.pathname === '/board'

  const shortcuts = useMemo(() => [
    { key: 'n', ctrl: true, description: 'New vulnerability', action: () => { if (swimlanes.length > 0) setNewCVEOpen(true) } },
    { key: 'n', ctrl: true, shift: true, description: 'New vendor', action: () => setNewVendorOpen(true) },
    { key: 'Escape', description: 'Close panel / dialog', action: () => { if (selectedCVEId) selectCVE(null) } },
    { key: '1', ctrl: true, description: 'Go to Dashboard', action: () => navigate('/dashboard') },
    { key: '2', ctrl: true, description: 'Go to Board', action: () => navigate('/board') },
    { key: '3', ctrl: true, description: 'Go to Calendar', action: () => navigate('/calendar') },
    { key: '4', ctrl: true, description: 'Go to Hall of Fame', action: () => navigate('/hof') },
    { key: '5', ctrl: true, description: 'Go to Settings', action: () => navigate('/settings') },
    { key: '/', ctrl: true, description: 'Show keyboard shortcuts', action: () => setShortcutsOpen(true) }
  ], [selectedCVEId, selectCVE, swimlanes.length, navigate])

  useKeyboardShortcuts(shortcuts)

  useEffect(() => {
    loadBoard()
  }, [loadBoard])

  // When the user clicks an OS-level follow-up notification, the main
  // process pushes the CVE id here — open its detail panel.
  useEffect(() => {
    const unsubscribe = window.api.events.onOpenCVE((cveId) => {
      selectCVE(cveId)
    })
    return unsubscribe
  }, [selectCVE])

  // Auto-show the features tour on the very first launch (and only the first
  // launch — once dismissed, the user has to re-open it from the sidebar
  // Help button). The 600ms delay lets the rest of the UI render first so
  // the modal doesn't pop in front of an empty white page.
  useEffect(() => {
    let cancelled = false
    try {
      if (localStorage.getItem('cvease-tour-seen') !== '1') {
        const t = setTimeout(() => {
          if (!cancelled) setTourOpen(true)
        }, 600)
        return () => {
          cancelled = true
          clearTimeout(t)
        }
      }
    } catch {
      /* localStorage may be unavailable in some sandboxed contexts — fine */
    }
    return undefined
  }, [])

  const handleTourOpenChange = (open: boolean) => {
    setTourOpen(open)
    if (!open) {
      try {
        localStorage.setItem('cvease-tour-seen', '1')
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <div className="h-screen flex overflow-hidden">
      <Sidebar
        hofCount={archivedCVEs.length}
        urgentCount={urgentCount}
        onShowTour={() => setTourOpen(true)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title={title} showBoardFilters={showBoardFilters} />
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
            <Outlet />
            <CVEDetailPanel />
          </>
        )}
      </div>

      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      <FeaturesTourDialog open={tourOpen} onOpenChange={handleTourOpenChange} />
      <CVEForm open={newCVEOpen} onOpenChange={setNewCVEOpen} />
      <VendorForm open={newVendorOpen} onOpenChange={setNewVendorOpen} />
    </div>
  )
}
