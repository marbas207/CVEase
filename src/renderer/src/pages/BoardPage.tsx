import { KanbanBoard } from '../components/board/KanbanBoard'

export function BoardPage() {
  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <KanbanBoard />
    </div>
  )
}
