import { cn } from '../../lib/utils'
import { useDeadlineStatus } from '../../hooks/useDeadlineStatus'
import type { CVE } from '../../types/cve'
import { AlertCircle, Clock } from 'lucide-react'

interface Props {
  cve: CVE
  className?: string
}

export function DeadlineBadge({ cve, className }: Props) {
  const { status, daysLeft } = useDeadlineStatus(cve)

  if (status === 'none') return null

  if (status === 'overdue') {
    return (
      <span className={cn('inline-flex items-center gap-1 text-xs font-semibold text-red-400', className)}>
        <AlertCircle className="w-3 h-3" />
        {Math.abs(daysLeft!)}d overdue
      </span>
    )
  }

  if (status === 'warning') {
    return (
      <span className={cn('inline-flex items-center gap-1 text-xs font-semibold text-yellow-400', className)}>
        <Clock className="w-3 h-3" />
        {daysLeft}d left
      </span>
    )
  }

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs text-muted-foreground', className)}>
      <Clock className="w-3 h-3" />
      {daysLeft}d
    </span>
  )
}
