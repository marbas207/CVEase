import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CVECard } from './CVECard'
import type { CVE, Stage } from '../../types/cve'
import { cn } from '../../lib/utils'

interface Props {
  swimlaneId: string
  stage: Stage
  cards: CVE[]
  isOver?: boolean
}

export function StageColumn({ swimlaneId, stage, cards, isOver }: Props) {
  const droppableId = `drop::${swimlaneId}::${stage}`
  const { setNodeRef, isOver: droppableOver } = useDroppable({
    id: droppableId,
    data: { swimlaneId, stage }
  })

  const over = isOver || droppableOver

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col gap-2 min-h-[80px] p-2 rounded-md transition-colors',
        over && 'bg-primary/5 ring-1 ring-primary/30'
      )}
    >
      <SortableContext items={cards.map(c => c.id)} strategy={verticalListSortingStrategy}>
        {cards.map(cve => (
          <CVECard key={cve.id} cve={cve} />
        ))}
      </SortableContext>
      {cards.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground/40 italic min-h-[60px]">
          Drop here
        </div>
      )}
    </div>
  )
}
