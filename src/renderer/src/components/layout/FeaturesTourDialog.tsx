import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../ui/dialog'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'
import {
  ShieldAlert,
  Gauge,
  Columns3,
  CalendarDays,
  FileText,
  Mail,
  Settings
} from 'lucide-react'
import logoLight from '../../assets/cvease-logo-light.svg'
import logoDark from '../../assets/cvease-logo-dark.svg'

interface TourStep {
  Icon: typeof ShieldAlert
  title: string
  body: string
}

/**
 * Tour content. Kept declarative so adding/removing steps is just an array
 * edit — no JSX surgery in the dialog component itself.
 */
const STEPS: TourStep[] = [
  {
    Icon: ShieldAlert,
    title: 'Welcome to CVEase',
    body:
      'CVEase tracks coordinated vulnerability disclosure from discovery to publication. ' +
      'This quick tour walks through the main features. You can re-open it any time from the Help button in the sidebar.'
  },
  {
    Icon: Gauge,
    title: 'Start with the Dashboard',
    body:
      'The Dashboard surfaces what needs your attention right now: follow-ups due, overdue disclosure deadlines, and vulnerabilities without check-ins. ' +
      'Action items are sorted with the most actionable first: follow-ups you can do today, then deadlines you\u2019re tracking. ' +
      'Click any card to jump straight to that vulnerability.'
  },
  {
    Icon: Columns3,
    title: 'Track the workflow on the Board',
    body:
      'Each row is a product (a swimlane), each column is a stage in your disclosure workflow: ' +
      'Discovery \u2192 Vendor Contacted \u2192 Negotiating \u2192 CVE Requested \u2192 Published. ' +
      'Drag a vulnerability between columns to advance it. Cross-product drags are blocked to prevent stray re-tagging.'
  },
  {
    Icon: CalendarDays,
    title: 'See your timeline on the Calendar',
    body:
      'Switch between Month, Year, and List views to see deadlines, follow-ups, and milestones plotted against time. ' +
      'Filter chips hide event types you don\u2019t care about right now. Click a busy day to pick which event to open.'
  },
  {
    Icon: FileText,
    title: 'Everything about a vulnerability in one card',
    body:
      'Click any vulnerability card and a centered detail panel opens with the full picture: description, technical metadata (CVSS, CWE), ' +
      'vendor contact, timeline, checklist, follow-ups, and attachments. The card is your workspace for that vulnerability.'
  },
  {
    Icon: Mail,
    title: 'Draft disclosures and advisories from your data',
    body:
      'When you\u2019re ready to contact a vendor, click "Draft disclosure" on the vulnerability detail card. CVEase pre-fills a coordinated-disclosure email ' +
      'with the title, severity, technical detail, and proposed timeline. Edit, copy, paste into your mail client. ' +
      'When you\u2019re publishing, click "Draft advisory" for a publication-ready Markdown writeup with timeline, references, and credit.'
  },
  {
    Icon: Settings,
    title: 'Settings: vendors, checklists, and safety',
    body:
      'Set up your vendors once and they\u2019ll pre-fill new vulnerabilities you create. Customize the default todo checklist to match your workflow. ' +
      'Backup and restore your database from Settings, and if you ever need to start fresh, the Danger Zone has type-to-confirm purge actions ' +
      'that always take a safety backup first.'
  }
]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Multi-step "features tour" dialog. Shows once on first app launch
 * (gated by localStorage) and is re-openable any time from the sidebar
 * Help button.
 *
 * Doesn't own the localStorage flag itself — that lives in App.tsx so the
 * auto-show timing and the dialog can be tested/triggered independently.
 */
export function FeaturesTourDialog({ open, onOpenChange }: Props) {
  const [step, setStep] = useState(0)

  // Reset to the welcome card whenever the dialog opens — re-opening from
  // the sidebar should always start at the beginning.
  useEffect(() => {
    if (open) setStep(0)
  }, [open])

  const isFirst = step === 0
  const isLast = step === STEPS.length - 1
  const current = STEPS[step]
  const Icon = current.Icon

  const close = () => onOpenChange(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex flex-col items-center text-center pt-2 pb-1">
            {isFirst ? (
              // Welcome step: show the full logo instead of a generic icon.
              // The logo already says "CVEase," so we hide the title visually
              // (kept in DOM for a11y).
              <>
                <img src={logoLight} alt="CVEase" className="block dark:hidden w-64 mb-2" />
                <img src={logoDark} alt="CVEase" className="hidden dark:block w-64 mb-2" />
                <DialogTitle className="sr-only">{current.title}</DialogTitle>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <DialogTitle className="text-xl">{current.title}</DialogTitle>
              </>
            )}
          </div>
        </DialogHeader>

        <p className="text-sm text-muted-foreground text-center px-4 leading-relaxed min-h-[110px]">
          {current.body}
        </p>

        {/* Progress dots — also clickable for jump-to-step. */}
        <div className="flex items-center justify-center gap-1.5 py-3">
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i)}
              aria-label={`Go to step ${i + 1}`}
              className={cn(
                'transition-all rounded-full',
                i === step
                  ? 'w-6 h-1.5 bg-primary'
                  : 'w-1.5 h-1.5 bg-muted hover:bg-muted-foreground/40'
              )}
            />
          ))}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between gap-2">
          <div>
            {!isFirst && (
              <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {!isLast && (
              <Button variant="outline" onClick={close}>
                Skip tour
              </Button>
            )}
            {isLast ? (
              <Button onClick={close}>Get started</Button>
            ) : (
              <Button onClick={() => setStep((s) => s + 1)}>Next</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
