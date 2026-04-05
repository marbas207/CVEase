import { useState } from 'react'
import { useBoardStore } from '../store/boardStore'
import { TimelineMilestones } from '../components/cve/TimelineMilestones'
import { SeverityBadge } from '../components/cve/SeverityBadge'
import { DeadlineBadge } from '../components/cve/DeadlineBadge'
import { VendorFavicon } from '../components/vendor/VendorFavicon'
import { useDeadlineStatus } from '../hooks/useDeadlineStatus'
import { cn } from '../lib/utils'
import { ChevronDown, ChevronRight, Layers, Columns3 } from 'lucide-react'
import { STAGES } from '../lib/constants'
import type { CVE, Swimlane, Stage } from '../types/cve'

const STAGE_DOT: Record<Stage, string> = {
  'Discovery': 'bg-slate-500',
  'Vendor Contacted': 'bg-blue-500',
  'Negotiating': 'bg-purple-500',
  'CVE Requested': 'bg-amber-500',
  'Published': 'bg-green-500'
}

function TimelineRow({ cve }: { cve: CVE }) {
  const { status } = useDeadlineStatus(cve)
  const { selectCVE } = useBoardStore()

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/40 transition-colors',
        status === 'overdue' && 'ring-1 ring-red-500/40',
        status === 'warning' && 'ring-1 ring-yellow-500/30'
      )}
      onClick={() => selectCVE(cve.id)}
    >
      <div className="flex items-start gap-3 mb-3">
        <SeverityBadge severity={cve.severity} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">{cve.title}</p>
          <div className="flex items-center gap-2 flex-wrap">
            {cve.cve_id && <p className="text-xs text-primary font-mono">{cve.cve_id}</p>}
            {cve.affected_versions && <span className="text-xs text-muted-foreground font-mono">v{cve.affected_versions}</span>}
          </div>
          <p className="text-xs text-muted-foreground">{cve.stage}</p>
        </div>
        <DeadlineBadge cve={cve} />
      </div>
      <TimelineMilestones cve={cve} />
    </div>
  )
}

function CollapsibleSection({
  label,
  count,
  icon,
  children,
  defaultOpen = true
}: {
  label: React.ReactNode
  count: number
  icon?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 mb-3 w-full text-left"
      >
        {open
          ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
          : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
        {icon}
        <span className="text-sm font-bold">{label}</span>
        <span className="text-xs text-muted-foreground/50">
          {count} vuln{count !== 1 ? 's' : ''}
        </span>
      </button>
      {open && <div className="ml-6">{children}</div>}
    </div>
  )
}

type GroupBy = 'software' | 'stage'

export function TimelinePage() {
  const { cves, swimlanes, vendors } = useBoardStore()
  const [groupBy, setGroupBy] = useState<GroupBy>('software')

  const sortedCves = (list: CVE[]) =>
    [...list].sort((a, b) => {
      const dateA = a.date_discovered ?? a.created_at
      const dateB = b.date_discovered ?? b.created_at
      return dateA.localeCompare(dateB)
    })

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Group-by toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Group by:</span>
        <button
          onClick={() => setGroupBy('software')}
          className={cn(
            'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors',
            groupBy === 'software'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border text-muted-foreground hover:border-primary/50'
          )}
        >
          <Layers className="w-3 h-3" />
          Software
        </button>
        <button
          onClick={() => setGroupBy('stage')}
          className={cn(
            'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md border transition-colors',
            groupBy === 'stage'
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border text-muted-foreground hover:border-primary/50'
          )}
        >
          <Columns3 className="w-3 h-3" />
          Stage
        </button>
      </div>

      {cves.length === 0 && (
        <div className="text-center text-muted-foreground py-20">
          <p className="text-lg mb-2">No vulnerabilities yet</p>
          <p className="text-sm">Add a software entry and create vulnerabilities from the Board view.</p>
        </div>
      )}

      {/* Group by Software */}
      {groupBy === 'software' && swimlanes.map(lane => {
        const laneCves = sortedCves(cves.filter(c => c.swimlane_id === lane.id))
        if (laneCves.length === 0) return null
        const vendor = lane.vendor_id ? vendors.find(v => v.id === lane.vendor_id) : undefined

        // Sub-group by stage within each software
        const stageGroups = STAGES
          .map(stage => ({ stage, items: laneCves.filter(c => c.stage === stage) }))
          .filter(g => g.items.length > 0)

        return (
          <CollapsibleSection
            key={lane.id}
            label={<>{lane.software_name} <span className="font-normal text-muted-foreground">{lane.vendor}</span></>}
            count={laneCves.length}
            icon={<VendorFavicon url={vendor?.url} size={16} />}
          >
            <div className="space-y-4">
              {stageGroups.map(({ stage, items }) => (
                <CollapsibleSection
                  key={stage}
                  label={stage}
                  count={items.length}
                  icon={<span className={cn('w-2.5 h-2.5 rounded-full shrink-0', STAGE_DOT[stage])} />}
                >
                  <div className="grid gap-3">
                    {items.map(cve => <TimelineRow key={cve.id} cve={cve} />)}
                  </div>
                </CollapsibleSection>
              ))}
            </div>
          </CollapsibleSection>
        )
      })}

      {/* Group by Stage */}
      {groupBy === 'stage' && STAGES.map(stage => {
        const stageCves = sortedCves(cves.filter(c => c.stage === stage))
        if (stageCves.length === 0) return null

        // Sub-group by software within each stage
        const laneGroups = swimlanes
          .map(lane => ({ lane, items: stageCves.filter(c => c.swimlane_id === lane.id) }))
          .filter(g => g.items.length > 0)

        return (
          <CollapsibleSection
            key={stage}
            label={stage}
            count={stageCves.length}
            icon={<span className={cn('w-2.5 h-2.5 rounded-full shrink-0', STAGE_DOT[stage])} />}
          >
            <div className="space-y-4">
              {laneGroups.map(({ lane, items }) => {
                const vendor = lane.vendor_id ? vendors.find(v => v.id === lane.vendor_id) : undefined
                return (
                  <CollapsibleSection
                    key={lane.id}
                    label={<>{lane.software_name} <span className="font-normal text-muted-foreground">{lane.vendor}</span></>}
                    count={items.length}
                    icon={<VendorFavicon url={vendor?.url} size={14} />}
                  >
                    <div className="grid gap-3">
                      {items.map(cve => <TimelineRow key={cve.id} cve={cve} />)}
                    </div>
                  </CollapsibleSection>
                )
              })}
            </div>
          </CollapsibleSection>
        )
      })}
    </div>
  )
}
