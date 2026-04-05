import { useState, useEffect } from 'react'
import { api } from '../../lib/ipc'
import type { Todo, Stage } from '../../types/cve'
import { useBoardStore } from '../../store/boardStore'
import { STAGE_REQUIREMENTS } from '../../lib/stageRequirements'
import { StageTransitionModal, type StageTransitionResult } from '../board/StageTransitionModal'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { cn } from '../../lib/utils'
import { Plus, Trash2, ArrowRight, CheckCircle2, Circle } from 'lucide-react'
import { firePublishedConfetti } from '../../lib/confetti'

interface Props {
  cveId: string
}

export function TodoList({ cveId }: Props) {
  const [todos, setTodos] = useState<Todo[]>([])
  const [newText, setNewText] = useState('')
  const [addingCustom, setAddingCustom] = useState(false)

  // For the completion note prompt
  const [pendingComplete, setPendingComplete] = useState<Todo | null>(null)
  const [completionNote, setCompletionNote] = useState('')

  // For stage transition (triggered todos)
  const [pendingTransition, setPendingTransition] = useState<{ todo: Todo; stage: Stage } | null>(null)

  const { getCVEById, updateCVE, moveCVE, cves } = useBoardStore()
  const cve = getCVEById(cveId)

  useEffect(() => {
    api.todo.list(cveId).then(setTodos).catch(console.error)
  }, [cveId])

  const completedCount = todos.filter(t => t.completed).length
  const total = todos.length

  const handleCheck = async (todo: Todo) => {
    if (todo.completed) {
      // Uncomplete
      const updated = await api.todo.uncomplete(todo.id)
      setTodos(prev => prev.map(t => t.id === todo.id ? updated : t))
      return
    }

    // If this todo triggers a stage change and stage has requirements, show transition modal
    if (todo.trigger_stage && cve) {
      // Block CVE Requested if not CVE eligible
      if (todo.trigger_stage === 'CVE Requested' && cve.cve_eligible === 0) {
        alert('Cannot move to CVE Requested: this vulnerability is marked as not CVE eligible.')
        return
      }
      const req = STAGE_REQUIREMENTS[todo.trigger_stage as Stage]
      if (req) {
        setPendingTransition({ todo, stage: todo.trigger_stage as Stage })
        return
      }
    }

    // Otherwise: prompt for a note
    setPendingComplete(todo)
    setCompletionNote('')
  }

  const confirmComplete = async (todo: Todo, note: string) => {
    const updated = await api.todo.complete(todo.id, { completion_note: note || undefined })
    setTodos(prev => prev.map(t => t.id === todo.id ? updated : t))

    // Auto-log activity if note provided
    if (note.trim()) {
      await api.followup.create(cveId, { type: 'Note', note: `✓ ${todo.text}: ${note.trim()}` })
    }

    setPendingComplete(null)
    setCompletionNote('')
  }

  const handleTransitionConfirm = async (result: StageTransitionResult) => {
    if (!pendingTransition || !cve) return
    const { todo, stage } = pendingTransition
    setPendingTransition(null)

    // Complete the todo
    const updated = await api.todo.complete(todo.id, {
      completion_note: result.activityNote || undefined
    })
    setTodos(prev => prev.map(t => t.id === todo.id ? updated : t))

    // Apply field updates
    if (Object.keys(result.fieldUpdates).length > 0) {
      await updateCVE(cveId, result.fieldUpdates)
    }

    // Move to the new stage
    const stageCves = cves.filter(c => c.swimlane_id === cve.swimlane_id && c.stage === stage)
    await moveCVE(cve.id, stage, cve.swimlane_id, stageCves.length)
    if (stage === 'Published') firePublishedConfetti()

    // Log activity
    const req = STAGE_REQUIREMENTS[stage]
    if (result.activityNote && req) {
      await api.followup.create(cveId, { type: req.activityType, note: result.activityNote })
    }
  }

  const handleAddCustom = async () => {
    if (!newText.trim()) return
    const todo = await api.todo.create(cveId, newText.trim())
    setTodos(prev => [...prev, todo])
    setNewText('')
    setAddingCustom(false)
  }

  const handleDelete = async (id: string) => {
    await api.todo.delete(id)
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="space-y-2">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">Checklist</p>
          {total > 0 && (
            <span className="text-xs text-muted-foreground">{completedCount}/{total}</span>
          )}
        </div>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setAddingCustom(v => !v)}>
          <Plus className="w-3 h-3" />
          Add Task
        </Button>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${(completedCount / total) * 100}%` }}
          />
        </div>
      )}

      {/* Custom task input */}
      {addingCustom && (
        <div className="flex gap-2">
          <Input
            value={newText}
            onChange={e => setNewText(e.target.value)}
            placeholder="New task…"
            className="h-8 text-sm"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleAddCustom(); if (e.key === 'Escape') setAddingCustom(false) }}
          />
          <Button size="sm" className="h-8" onClick={handleAddCustom} disabled={!newText.trim()}>Add</Button>
        </div>
      )}

      {/* Inline completion note prompt */}
      {pendingComplete && (
        <div className="bg-muted/40 border border-border rounded-md p-3 space-y-2">
          <p className="text-xs font-medium">✓ Completing: <span className="text-foreground">{pendingComplete.text}</span></p>
          <div className="grid gap-1">
            <Label className="text-xs">Note (optional)</Label>
            <Textarea
              value={completionNote}
              onChange={e => setCompletionNote(e.target.value)}
              placeholder="Any details worth logging…"
              className="min-h-[60px] text-sm"
              autoFocus
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setPendingComplete(null)}>Cancel</Button>
            <Button size="sm" onClick={() => confirmComplete(pendingComplete, completionNote)}>Mark Complete</Button>
          </div>
        </div>
      )}

      {/* Todo items */}
      <div className="space-y-0.5">
        {todos.map(todo => (
          <div
            key={todo.id}
            className={cn(
              'group flex items-start gap-2.5 py-1.5 px-1 rounded-md hover:bg-muted/30 transition-colors',
              todo.completed && 'opacity-60'
            )}
          >
            <button
              onClick={() => handleCheck(todo)}
              className={cn(
                'shrink-0 mt-0.5 transition-colors',
                todo.completed ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {todo.completed
                ? <CheckCircle2 className="w-4 h-4" />
                : <Circle className="w-4 h-4" />}
            </button>

            <div className="flex-1 min-w-0">
              <p className={cn('text-sm', todo.completed && 'line-through text-muted-foreground')}>
                {todo.text}
              </p>
              {todo.completion_note && (
                <p className="text-xs text-muted-foreground mt-0.5 italic">{todo.completion_note}</p>
              )}
            </div>

            {/* Stage trigger badge */}
            {todo.trigger_stage && !todo.completed && (
              <span className="shrink-0 flex items-center gap-0.5 text-[10px] text-primary/70 border border-primary/20 rounded px-1 py-0.5">
                <ArrowRight className="w-2.5 h-2.5" />
                {todo.trigger_stage}
              </span>
            )}

            <button
              onClick={() => handleDelete(todo.id)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {todos.length === 0 && (
          <p className="text-xs text-muted-foreground italic">No tasks.</p>
        )}
      </div>

      {/* Stage transition modal (triggered from todo) */}
      {pendingTransition && cve && (
        <StageTransitionModal
          open={true}
          cve={cve}
          targetStage={pendingTransition.stage}
          onConfirm={handleTransitionConfirm}
          onCancel={() => setPendingTransition(null)}
        />
      )}
    </div>
  )
}
