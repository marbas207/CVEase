import { cn } from '../../lib/utils'
import { Bell, BellRing } from 'lucide-react'
import type { CVE } from '../../types/cve'

interface Props {
  cve: CVE
  className?: string
}

function getDaysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

export function FollowupDueBadge({ cve, className }: Props) {
  const hasFollowup = cve.stage === 'Vendor Contacted' || cve.stage === 'Negotiating' || cve.stage === 'CVE Requested'
  if (!hasFollowup || !cve.followup_due_date) return null

  const days = getDaysUntil(cve.followup_due_date)

  if (days < 0) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-xs font-semibold text-red-400', className)}>
        <BellRing className="w-3 h-3" />
        Follow up now
      </span>
    )
  }

  if (days === 0) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-xs font-semibold text-red-400', className)}>
        <BellRing className="w-3 h-3" />
        Follow up today
      </span>
    )
  }

  if (days <= 3) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-xs font-semibold text-yellow-400', className)}>
        <BellRing className="w-3 h-3" />
        {days}d
      </span>
    )
  }

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs text-muted-foreground', className)}>
      <Bell className="w-3 h-3" />
      {days}d
    </span>
  )
}
