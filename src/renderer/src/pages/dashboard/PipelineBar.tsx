import { BarChart3 } from 'lucide-react'
import { STAGES } from '../../lib/constants'
import { cn } from '../../lib/utils'
import type { Stage } from '../../types/cve'

const STAGE_COLORS: Record<Stage, string> = {
  'Discovery': 'bg-slate-500',
  'Vendor Contacted': 'bg-blue-500',
  'Negotiating': 'bg-purple-500',
  'CVE Requested': 'bg-amber-500',
  'Published': 'bg-green-500'
}

interface Props {
  stageCounts: Record<Stage, number>
  totalActive: number
}

export function PipelineBar({ stageCounts, totalActive }: Props) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-muted-foreground" />
        Pipeline
      </h3>
      <div className="flex gap-1 h-6 rounded overflow-hidden">
        {STAGES.map((stage) => {
          const count = stageCounts[stage]
          if (count === 0) return null
          const pct = (count / totalActive) * 100
          return (
            <div
              key={stage}
              className={cn('transition-all relative group flex items-center justify-center', STAGE_COLORS[stage])}
              style={{ width: `${pct}%`, minWidth: count > 0 ? 20 : 0 }}
              title={`${stage}: ${count}`}
            >
              <span className="text-[10px] font-bold text-white/90 truncate px-1">{count}</span>
            </div>
          )
        })}
        {totalActive === 0 && (
          <div className="flex-1 bg-muted flex items-center justify-center">
            <span className="text-[10px] text-muted-foreground">No active vulnerabilities</span>
          </div>
        )}
      </div>
      <div className="flex gap-3 mt-2 flex-wrap">
        {STAGES.map((stage) => {
          const count = stageCounts[stage]
          if (count === 0) return null
          return (
            <span key={stage} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn('w-2 h-2 rounded-full', STAGE_COLORS[stage])} />
              {stage}
            </span>
          )
        })}
      </div>
    </div>
  )
}
