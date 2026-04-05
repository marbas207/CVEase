import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '../../lib/utils'
import { SeverityBadge } from '../cve/SeverityBadge'
import { DeadlineBadge } from '../cve/DeadlineBadge'
import { FollowupDueBadge } from '../cve/FollowupDueBadge'
import { SEVERITY_BORDER } from '../../lib/constants'
import { useDeadlineStatus } from '../../hooks/useDeadlineStatus'
import type { CVE } from '../../types/cve'
import { useBoardStore } from '../../store/boardStore'

interface Props {
  cve: CVE
  isDragOverlay?: boolean
}

const FOLLOWUP_STAGES = new Set(['Vendor Contacted', 'Negotiating', 'CVE Requested'])

function isFollowupOverdue(cve: CVE): boolean {
  if (!FOLLOWUP_STAGES.has(cve.stage) || !cve.followup_due_date) return false
  return cve.followup_due_date < new Date().toISOString().slice(0, 10)
}

export function CVECard({ cve, isDragOverlay = false }: Props) {
  const selectCVE = useBoardStore(s => s.selectCVE)
  const { status } = useDeadlineStatus(cve)
  const followupOverdue = isFollowupOverdue(cve)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: cve.id, data: { cve } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      ref={setNodeRef}
      style={isDragOverlay ? undefined : style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation()
        selectCVE(cve.id)
      }}
      className={cn(
        'group relative bg-card border border-border rounded-md p-3 cursor-pointer select-none',
        'hover:border-primary/50 hover:shadow-md transition-all',
        'border-l-4',
        SEVERITY_BORDER[cve.severity],
        isDragging && 'opacity-40',
        isDragOverlay && 'shadow-xl rotate-1 opacity-95',
        status === 'overdue' && 'ring-1 ring-red-500/40',
        status === 'warning' && 'ring-1 ring-yellow-500/30',
        followupOverdue && 'ring-1 ring-sky-500/40'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <p className="text-sm font-medium leading-snug line-clamp-2 flex-1">{cve.title}</p>
        <SeverityBadge severity={cve.severity} className="shrink-0" />
      </div>
      {cve.cve_id && (
        <p className="text-xs text-muted-foreground font-mono mb-1">{cve.cve_id}</p>
      )}
      {(cve.affected_component || cve.affected_versions) && (
        <p className="text-[11px] text-muted-foreground/70 font-mono bg-muted/40 rounded px-1 py-0.5 truncate mb-1">
          {cve.affected_component}{cve.affected_component && cve.affected_versions ? ' · ' : ''}{cve.affected_versions && `v${cve.affected_versions}`}
        </p>
      )}
      {(cve.escalated_to_vince === 1 || cve.patch_status === 'no_patch' || cve.patch_status === 'wont_fix' || (cve.bounty_status && cve.bounty_status !== 'none')) && (
        <div className="flex items-center gap-1.5 flex-wrap mb-1">
          {cve.escalated_to_vince === 1 && (
            <span className="text-[10px] font-bold text-orange-400 bg-orange-500/10 rounded px-1 py-0.5">VINCE</span>
          )}
          {cve.patch_status === 'no_patch' && (
            <span className="text-[10px] font-bold text-red-400 bg-red-500/10 rounded px-1 py-0.5">No Patch</span>
          )}
          {cve.patch_status === 'wont_fix' && (
            <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 rounded px-1 py-0.5">Won't Fix</span>
          )}
          {cve.bounty_status === 'paid' && (
            <span className="text-[10px] font-bold text-green-400 bg-green-500/10 rounded px-1 py-0.5">{cve.bounty_amount ? `$ ${cve.bounty_amount}` : '$ Paid'}</span>
          )}
          {cve.bounty_status === 'approved' && (
            <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 rounded px-1 py-0.5">$ Approved</span>
          )}
          {cve.bounty_status === 'submitted' && (
            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 rounded px-1 py-0.5">$ Pending</span>
          )}
        </div>
      )}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-muted-foreground truncate max-w-[60%]">
          {cve.vendor_contact_name ?? cve.vendor_contact_email ?? ''}
        </span>
        <FollowupDueBadge cve={cve} />
        <DeadlineBadge cve={cve} />
      </div>
    </div>
  )
}
