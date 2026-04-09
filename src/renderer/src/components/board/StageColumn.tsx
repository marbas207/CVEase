import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CVECard } from './CVECard'
import type { CVE, Stage } from '../../types/cve'
import { cn } from '../../lib/utils'
import { useBoardStore } from '../../store/boardStore'

interface Props {
  swimlaneId: string
  stage: Stage
  cards: CVE[]
  isOver?: boolean
}

export function StageColumn({ swimlaneId, stage, cards, isOver }: Props) {
  // CVEs are tied to a single product by design — moving a card across rows
  // would silently re-parent it to a different vendor/product, which is
  // almost always a stray-drag accident rather than an intentional re-tag.
  // While a drag is in progress, any column whose swimlane doesn't match
  // the source is rendered as a non-target (greyed, no drop highlight).
  const activeDragId = useBoardStore((s) => s.activeDragId)
  const cves = useBoardStore((s) => s.cves)
  const draggedCVE = activeDragId ? cves.find((c) => c.id === activeDragId) : undefined
  const isCrossSwimlane = !!draggedCVE && draggedCVE.swimlane_id !== swimlaneId

  const droppableId = `drop::${swimlaneId}::${stage}`
  const { setNodeRef, isOver: droppableOver } = useDroppable({
    id: droppableId,
    data: { swimlaneId, stage },
    disabled: isCrossSwimlane
  })

  const over = (isOver || droppableOver) && !isCrossSwimlane

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col gap-2 min-h-[80px] p-2 rounded-md transition-colors',
        over && 'bg-primary/5 ring-1 ring-primary/30',
        isCrossSwimlane && 'opacity-40 bg-muted/20'
      )}
    >
      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        {cards.map((cve) => (
          <CVECard key={cve.id} cve={cve} />
        ))}
      </SortableContext>
      {cards.length === 0 && !isCrossSwimlane && (
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground/40 italic min-h-[60px]">
          Drop here
        </div>
      )}
    </div>
  )
}
