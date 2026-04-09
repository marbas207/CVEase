import { formatDate } from '../../lib/utils'
import type { CVE } from '../../types/cve'
import { cn } from '../../lib/utils'

interface Props {
  cve: CVE
}

interface Milestone {
  label: string
  date: string | null | undefined
  color: string
}

export function TimelineMilestones({ cve }: Props) {
  const milestones: Milestone[] = [
    { label: 'Discovered', date: cve.date_discovered, color: 'bg-blue-500' },
    { label: 'Vendor Notified', date: cve.date_vendor_notified, color: 'bg-yellow-500' },
    { label: 'Disclosure Date', date: cve.disclosure_deadline, color: 'bg-orange-500' },
    ...(cve.followup_due_date ? [{ label: 'Follow-up Due', date: cve.followup_due_date, color: 'bg-sky-400' }] : []),
    { label: 'CVE Requested', date: cve.date_cve_requested, color: 'bg-purple-500' },
    { label: 'Published', date: cve.date_disclosed, color: 'bg-green-500' }
  ]

  const hasDates = milestones.some(m => m.date)
  if (!hasDates) return null

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold">Timeline</p>
      <div className="flex flex-col gap-2">
        {milestones.map((m) => (
          <div key={m.label} className="flex items-center gap-3">
            <div className={cn('w-2 h-2 rounded-full shrink-0', m.date ? m.color : 'bg-muted')} />
            <span className="text-xs text-muted-foreground w-28 shrink-0">{m.label}</span>
            <span className={cn('text-xs', m.date ? 'text-foreground' : 'text-muted-foreground/40 italic')}>
              {m.date ? formatDate(m.date) : 'Not set'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
