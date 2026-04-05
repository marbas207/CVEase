import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent
} from '@dnd-kit/core'
import { BoardColumnHeader } from './BoardColumnHeader'
import { VendorGroup } from './VendorGroup'
import { CVECard } from './CVECard'
import { StageTransitionModal, type StageTransitionResult } from './StageTransitionModal'
import { useBoardStore } from '../../store/boardStore'
import { api } from '../../lib/ipc'
import { STAGE_REQUIREMENTS } from '../../lib/stageRequirements'
import type { CVE, Stage } from '../../types/cve'
import { STAGES } from '../../lib/constants'
import { firePublishedConfetti } from '../../lib/confetti'
import { Plus } from 'lucide-react'
import { Button } from '../ui/button'
import { SwimLaneForm } from '../swimlane/SwimLaneForm'
import { VendorForm } from '../vendor/VendorForm'
import { CVEForm } from '../cve/CVEForm'

const SWIMLANE_HEADER_WIDTH = 280

interface PendingMove {
  cve: CVE
  destStage: Stage
  destSwimlaneId: string
  targetIndex: number
}

export function KanbanBoard() {
  const {
    vendors,
    swimlanes,
    cves,
    activeDragId,
    setActiveDrag,
    moveCVE,
    updateCVE,
    optimisticMove,
    saveDragSnapshot,
    rollbackDrag
  } = useBoardStore()

  const [addLaneOpen, setAddLaneOpen] = useState(false)
  const [addVendorOpen, setAddVendorOpen] = useState(false)
  const [addCVEOpen, setAddCVEOpen] = useState(false)
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const activeCVE: CVE | undefined = activeDragId
    ? cves.find(c => c.id === activeDragId)
    : undefined

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDrag(event.active.id as string)
    saveDragSnapshot()
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDrag(null)
    const { active, over } = event
    if (!over) { rollbackDrag(); return }

    const draggedCVE = cves.find(c => c.id === active.id)
    if (!draggedCVE) return

    let destSwimlaneId: string
    let destStage: Stage
    let targetIndex: number

    const overId = over.id as string

    if (overId.startsWith('drop::')) {
      const parts = overId.split('::')
      destSwimlaneId = parts[1]
      destStage = parts[2] as Stage
      const destCards = cves.filter(
        c => c.swimlane_id === destSwimlaneId && c.stage === destStage && c.id !== active.id
      )
      targetIndex = destCards.length
    } else {
      const overCVE = cves.find(c => c.id === overId)
      if (!overCVE) return
      destSwimlaneId = overCVE.swimlane_id
      destStage = overCVE.stage
      const destCards = cves
        .filter(c => c.swimlane_id === destSwimlaneId && c.stage === destStage && c.id !== active.id)
        .sort((a, b) => a.sort_order - b.sort_order)
      targetIndex = destCards.findIndex(c => c.id === overCVE.id)
      if (targetIndex === -1) targetIndex = destCards.length
    }

    // If same stage, just reorder (no transition modal needed)
    if (draggedCVE.stage === destStage && draggedCVE.swimlane_id === destSwimlaneId) {
      optimisticMove(draggedCVE.id, destStage, destSwimlaneId, targetIndex)
      moveCVE(draggedCVE.id, destStage, destSwimlaneId, targetIndex).catch(() => rollbackDrag())
      return
    }

    // If target stage has requirements, show modal — hold off on optimistic update until confirmed
    const req = STAGE_REQUIREMENTS[destStage]
    if (req) {
      // Show the transition modal; keep snapshot for potential rollback
      setPendingMove({ cve: draggedCVE, destStage, destSwimlaneId, targetIndex })
    } else {
      // No requirements — commit immediately
      optimisticMove(draggedCVE.id, destStage, destSwimlaneId, targetIndex)
      moveCVE(draggedCVE.id, destStage, destSwimlaneId, targetIndex).catch(() => rollbackDrag())
      if (destStage === 'Published') firePublishedConfetti()
    }
  }

  const handleTransitionConfirm = async (result: StageTransitionResult) => {
    if (!pendingMove) return
    const { cve, destStage, destSwimlaneId, targetIndex } = pendingMove
    setPendingMove(null)

    // Optimistic update now
    optimisticMove(cve.id, destStage, destSwimlaneId, targetIndex)

    try {
      // Apply field updates if any
      if (Object.keys(result.fieldUpdates).length > 0) {
        await updateCVE(cve.id, result.fieldUpdates)
      }
      // Move card
      await moveCVE(cve.id, destStage, destSwimlaneId, targetIndex)
      if (destStage === 'Published') firePublishedConfetti()
      // Log activity if note provided
      const req = STAGE_REQUIREMENTS[destStage]
      if (result.activityNote && req) {
        await api.followup.create(cve.id, {
          type: req.activityType,
          note: result.activityNote
        })
      }
    } catch (e) {
      console.error('Transition failed, rolling back', e)
      rollbackDrag()
    }
  }

  const handleTransitionCancel = () => {
    setPendingMove(null)
    rollbackDrag()
  }

  const totalMinWidth = SWIMLANE_HEADER_WIDTH + STAGES.length * 160

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-full overflow-auto">
        <div style={{ minWidth: totalMinWidth }}>
          <BoardColumnHeader />
          {Array.from(
            swimlanes.reduce((map, lane) => {
              const group = map.get(lane.vendor) ?? []
              group.push(lane)
              map.set(lane.vendor, group)
              return map
            }, new Map<string, typeof swimlanes>())
          ).map(([vendor, lanes]) => (
            <VendorGroup
              key={vendor}
              vendor={vendor}
              swimlanes={lanes}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 p-4 border-t border-border mt-auto">
          <Button size="sm" onClick={() => setAddCVEOpen(true)} disabled={swimlanes.length === 0} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Vulnerability
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAddLaneOpen(true)} disabled={vendors.length === 0} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Software
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAddVendorOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Vendor
          </Button>
        </div>
      </div>

      <DragOverlay>
        {activeCVE && <CVECard cve={activeCVE} isDragOverlay />}
      </DragOverlay>

      <CVEForm open={addCVEOpen} onOpenChange={setAddCVEOpen} />
      <VendorForm open={addVendorOpen} onOpenChange={setAddVendorOpen} />
      <SwimLaneForm open={addLaneOpen} onOpenChange={setAddLaneOpen} />

      {pendingMove && (
        <StageTransitionModal
          open={true}
          cve={pendingMove.cve}
          targetStage={pendingMove.destStage}
          onConfirm={handleTransitionConfirm}
          onCancel={handleTransitionCancel}
        />
      )}
    </DndContext>
  )
}
