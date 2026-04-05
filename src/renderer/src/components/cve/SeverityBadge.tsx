import { cn } from '../../lib/utils'
import { SEVERITY_COLORS } from '../../lib/constants'
import type { Severity } from '../../types/cve'

interface Props {
  severity: Severity
  className?: string
}

export function SeverityBadge({ severity, className }: Props) {
  return (
    <span className={cn('text-xs font-bold px-1.5 py-0.5 rounded', SEVERITY_COLORS[severity], className)}>
      {severity}
    </span>
  )
}
