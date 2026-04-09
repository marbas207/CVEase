import { useState } from 'react'
import { useBoardStore } from '../../store/boardStore'
import { api } from '../../lib/ipc'
import { Button } from '../ui/button'
import { FlaskConical, X } from 'lucide-react'

export function DemoBanner() {
  const { loadBoard, vendors, swimlanes, cves, demoActive, setDemoActive } = useBoardStore()
  const [clearing, setClearing] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  const hasDemoVendors = vendors.some(v => v.name === 'Acme Corp' || v.name === 'Globex Industries')
  if ((!demoActive && !hasDemoVendors) || dismissed) return null

  const handleClearDemo = async () => {
    if (!confirm('This will delete ALL data (vendors, software, vulnerabilities, activity logs, attachments) and start fresh. Continue?')) return
    setClearing(true)
    try {
      for (const lane of swimlanes) {
        await api.swimlane.delete(lane.id)
      }
      for (const vendor of vendors) {
        await api.vendor.delete(vendor.id)
      }
      for (const cve of cves) {
        await api.cve.delete(cve.id)
      }

      setDemoActive(false)
      try { localStorage.removeItem('cvease-onboarding-dismissed') } catch { /* ignore */ }

      await loadBoard()
    } finally {
      setClearing(false)
    }
  }

  const handleDismiss = () => {
    setDemoActive(false)
    setDismissed(true)
  }

  return (
    <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center gap-3 shrink-0">
      <FlaskConical className="w-4 h-4 text-primary shrink-0" />
      <p className="text-xs text-foreground flex-1">
        You're viewing <strong>demo data</strong>. Ready to start with your own?
      </p>
      <Button
        size="sm"
        className="h-7 text-xs gap-1.5"
        onClick={handleClearDemo}
        disabled={clearing}
      >
        {clearing ? 'Clearing...' : 'Clear demo & start fresh'}
      </Button>
      <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground transition-colors" title="Dismiss">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
