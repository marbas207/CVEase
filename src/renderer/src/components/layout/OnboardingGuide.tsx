import { useState } from 'react'
import { useBoardStore } from '../../store/boardStore'
import { VendorForm } from '../vendor/VendorForm'
import { SwimLaneForm } from '../swimlane/SwimLaneForm'
import { CVEForm } from '../cve/CVEForm'
import { loadDemoData } from '../../lib/demoData'
import { Bug, ChevronRight, Building2, Package, ShieldAlert, Keyboard, FlaskConical } from 'lucide-react'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

const steps = [
  {
    id: 'vendor',
    title: 'Add a Vendor',
    description: 'Start by adding a vendor or organization whose software you\'re researching. Include their security team contact details and CNA status.',
    icon: Building2,
    color: 'text-blue-400'
  },
  {
    id: 'software',
    title: 'Add Software',
    description: 'Add a software product under that vendor. This creates a swimlane on the Kanban board where you\'ll track vulnerabilities.',
    icon: Package,
    color: 'text-purple-400'
  },
  {
    id: 'cve',
    title: 'Create a Vulnerability',
    description: 'Add your first vulnerability. Vendor contact info will be pre-filled, and a disclosure checklist is automatically created.',
    icon: ShieldAlert,
    color: 'text-primary'
  }
] as const

export function OnboardingGuide() {
  const { vendors, swimlanes, cves, loadBoard, setDemoActive } = useBoardStore()
  const [vendorOpen, setVendorOpen] = useState(false)
  const [softwareOpen, setSoftwareOpen] = useState(false)
  const [cveOpen, setCveOpen] = useState(false)
  const [loadingDemo, setLoadingDemo] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem('cvease-onboarding-dismissed') === '1' } catch { return false }
  })

  // Determine which steps are done
  const hasVendors = vendors.length > 0
  const hasSwimlanes = swimlanes.length > 0
  const hasCves = cves.length > 0

  // Don't show if all done or dismissed
  if ((hasVendors && hasSwimlanes && hasCves) || dismissed) return null

  const currentStep = !hasVendors ? 0 : !hasSwimlanes ? 1 : 2

  const handleLoadDemo = async () => {
    setLoadingDemo(true)
    try {
      await loadDemoData()
      setDemoActive(true)
      await loadBoard()
    } catch (e) {
      console.error('Failed to load demo data', e)
    } finally {
      setLoadingDemo(false)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    try { localStorage.setItem('cvease-onboarding-dismissed', '1') } catch { /* ignore */ }
  }

  const handleStepClick = (stepId: string) => {
    if (stepId === 'vendor') setVendorOpen(true)
    else if (stepId === 'software') setSoftwareOpen(true)
    else if (stepId === 'cve') setCveOpen(true)
  }

  return (
    <>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-lg w-full space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex p-3 rounded-xl bg-primary/10">
              <Bug className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Welcome to CVEase</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Let's set up your first disclosure workflow in three quick steps.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {steps.map((step, i) => {
              const done = (i === 0 && hasVendors) || (i === 1 && hasSwimlanes) || (i === 2 && hasCves)
              const active = i === currentStep
              const locked = i > currentStep

              return (
                <button
                  key={step.id}
                  onClick={() => !done && !locked && handleStepClick(step.id)}
                  disabled={locked}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-lg border text-left transition-all',
                    done && 'bg-primary/5 border-primary/20 opacity-60',
                    active && 'bg-card border-primary/40 shadow-md hover:shadow-lg',
                    locked && 'opacity-40 cursor-not-allowed border-border',
                    !done && !active && !locked && 'bg-card border-border'
                  )}
                >
                  <div className={cn(
                    'shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
                    done ? 'bg-primary/10' : active ? 'bg-primary/10' : 'bg-muted'
                  )}>
                    {done ? (
                      <span className="text-primary text-lg">&#10003;</span>
                    ) : (
                      <step.icon className={cn('w-5 h-5', active ? step.color : 'text-muted-foreground')} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-semibold', done && 'line-through text-muted-foreground')}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                  </div>
                  {active && !done && (
                    <ChevronRight className="w-5 h-5 text-primary shrink-0" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Demo data */}
          <button
            onClick={handleLoadDemo}
            disabled={loadingDemo}
            className="w-full flex items-center gap-4 p-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 text-left hover:bg-primary/10 hover:border-primary/50 transition-all"
          >
            <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{loadingDemo ? 'Loading demo data...' : 'Try with demo data'}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Load sample vendors, products, and vulnerabilities across all stages to explore CVEase.
              </p>
            </div>
          </button>

          {/* Shortcut hint + dismiss */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Keyboard className="w-3 h-3" />
              Press <kbd className="px-1 py-0.5 rounded bg-muted border border-border text-[10px] font-mono">Ctrl+/</kbd> anytime for keyboard shortcuts
            </p>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={handleDismiss}>
              Skip setup
            </Button>
          </div>
        </div>
      </div>

      <VendorForm open={vendorOpen} onOpenChange={setVendorOpen} />
      <SwimLaneForm open={softwareOpen} onOpenChange={setSoftwareOpen} />
      <CVEForm open={cveOpen} onOpenChange={setCveOpen} />
    </>
  )
}
