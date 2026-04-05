import { useState } from 'react'
import { SwimlaneHeader } from './SwimlaneHeader'
import { StageColumn } from './StageColumn'
import { STAGES } from '../../lib/constants'
import { useBoardStore } from '../../store/boardStore'
import type { Swimlane } from '../../types/cve'
import { CVEForm } from '../cve/CVEForm'
import { SwimLaneForm } from '../swimlane/SwimLaneForm'
import { cn } from '../../lib/utils'

interface Props {
  swimlane: Swimlane
}

export function SwimlaneRow({ swimlane }: Props) {
  const getCVEsForCell = useBoardStore(s => s.getCVEsForCell)
  // Subscribe to filter state so we re-render when filters change
  useBoardStore(s => s.severityFilter)
  useBoardStore(s => s.searchQuery)
  const [addCVEOpen, setAddCVEOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const collapsed = swimlane.collapsed === 1

  return (
    <div className="group flex border-b border-border">
      {/* Sticky header column */}
      <div className="sticky left-0 z-10 shrink-0 w-[280px] bg-sidebar border-r border-border">
        <SwimlaneHeader
          swimlane={swimlane}
          onAddCVE={() => setAddCVEOpen(true)}
          onEdit={() => setEditOpen(true)}
        />
      </div>

      {/* Stage columns */}
      {!collapsed && (
        <div className="flex flex-1">
          {STAGES.map((stage) => (
            <div
              key={stage}
              className={cn('flex-1 min-w-[160px] border-r border-border last:border-r-0')}
            >
              <StageColumn
                swimlaneId={swimlane.id}
                stage={stage}
                cards={getCVEsForCell(swimlane.id, stage)}
              />
            </div>
          ))}
        </div>
      )}

      {collapsed && (
        <div className="flex-1 flex items-center px-4 text-xs text-muted-foreground/40 italic">
          Collapsed, click to expand
        </div>
      )}

      {/* Dialogs */}
      <CVEForm
        open={addCVEOpen}
        onOpenChange={setAddCVEOpen}
        swimlaneId={swimlane.id}
      />
      <SwimLaneForm
        open={editOpen}
        onOpenChange={setEditOpen}
        swimlane={swimlane}
      />
    </div>
  )
}
