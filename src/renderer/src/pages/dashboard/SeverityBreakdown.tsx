import { TrendingUp } from 'lucide-react'
import { SeverityBadge } from '../../components/cve/SeverityBadge'
import type { Severity } from '../../types/cve'

interface Props {
  counts: Record<Severity, number>
}

const ORDER: Severity[] = ['Critical', 'High', 'Medium', 'Low']

export function SeverityBreakdown({ counts }: Props) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-muted-foreground" />
        Severity Breakdown
      </h3>
      <div className="grid grid-cols-4 gap-3">
        {ORDER.map((sev) => (
          <div key={sev} className="text-center">
            <p className="text-xl font-bold">{counts[sev]}</p>
            <SeverityBadge severity={sev} className="text-[10px] mt-1" />
          </div>
        ))}
      </div>
    </div>
  )
}
