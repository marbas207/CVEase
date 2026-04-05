import { useState, useEffect } from 'react'
import { api } from '../../lib/ipc'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Separator } from '../ui/separator'
import { Plus, Trash2, GripVertical, ArrowRight, Lock, Pencil, Check, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { ChecklistTemplateItem } from '../../types/cve'

export function ChecklistTemplateEditor() {
  const [items, setItems] = useState<ChecklistTemplateItem[]>([])
  const [newText, setNewText] = useState('')
  const [addingNew, setAddingNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  useEffect(() => {
    api.checklistTemplate.list().then(setItems).catch(console.error)
  }, [])

  const handleAdd = async () => {
    if (!newText.trim()) return
    const item = await api.checklistTemplate.create(newText.trim(), items.length)
    setItems(prev => [...prev, item])
    setNewText('')
    setAddingNew(false)
  }

  const handleDelete = async (id: string) => {
    await api.checklistTemplate.delete(id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const handleStartEdit = (item: ChecklistTemplateItem) => {
    setEditingId(item.id)
    setEditText(item.text)
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editText.trim()) return
    const updated = await api.checklistTemplate.update(editingId, editText.trim())
    setItems(prev => prev.map(i => i.id === editingId ? updated : i))
    setEditingId(null)
    setEditText('')
  }

  const handleMoveUp = async (index: number) => {
    if (index === 0) return
    const newItems = [...items]
    ;[newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]]
    const updates = newItems.map((item, i) => ({ id: item.id, sort_order: i }))
    await api.checklistTemplate.reorder(updates)
    setItems(newItems.map((item, i) => ({ ...item, sort_order: i })))
  }

  const handleMoveDown = async (index: number) => {
    if (index >= items.length - 1) return
    const newItems = [...items]
    ;[newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]]
    const updates = newItems.map((item, i) => ({ id: item.id, sort_order: i }))
    await api.checklistTemplate.reorder(updates)
    setItems(newItems.map((item, i) => ({ ...item, sort_order: i })))
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold">Checklist Template</h3>
          <p className="text-xs text-muted-foreground">Default tasks added to every new vulnerability. Stage-trigger items cannot be removed.</p>
        </div>
        <Button size="sm" onClick={() => setAddingNew(true)} className="gap-1">
          <Plus className="w-3.5 h-3.5" />
          Add Step
        </Button>
      </div>

      <Separator className="mb-3" />

      <div className="space-y-1">
        {items.map((item, index) => {
          const isTrigger = !!item.trigger_stage
          const isEditing = editingId === item.id

          return (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-2 py-1.5 px-2 rounded-md group',
                isTrigger ? 'bg-primary/5' : 'hover:bg-muted/30'
              )}
            >
              {/* Reorder buttons */}
              <div className="flex flex-col shrink-0">
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="text-muted-foreground/30 hover:text-muted-foreground disabled:opacity-0 text-[10px] leading-none"
                >
                  ▲
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index >= items.length - 1}
                  className="text-muted-foreground/30 hover:text-muted-foreground disabled:opacity-0 text-[10px] leading-none"
                >
                  ▼
                </button>
              </div>

              {/* Text */}
              {isEditing ? (
                <Input
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  className="h-7 text-sm flex-1"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') setEditingId(null) }}
                />
              ) : (
                <p className="text-sm flex-1 min-w-0 truncate">{item.text}</p>
              )}

              {/* Stage trigger badge */}
              {isTrigger && (
                <span className="shrink-0 flex items-center gap-0.5 text-[10px] text-primary/70 border border-primary/20 rounded px-1.5 py-0.5">
                  <ArrowRight className="w-2.5 h-2.5" />
                  {item.trigger_stage}
                </span>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {isEditing ? (
                  <>
                    <button onClick={handleSaveEdit} className="text-green-500 hover:text-green-400">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleStartEdit(item)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {isTrigger ? (
                      <Lock className="w-3.5 h-3.5 text-muted-foreground/30" title="Stage trigger, cannot be removed" />
                    ) : (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}

        {items.length === 0 && (
          <p className="text-sm text-muted-foreground italic py-2">No checklist items. Add some steps above.</p>
        )}
      </div>

      {/* Add new item */}
      {addingNew && (
        <div className="flex gap-2 mt-3">
          <Input
            value={newText}
            onChange={e => setNewText(e.target.value)}
            placeholder="New checklist step..."
            className="h-8 text-sm"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAddingNew(false) }}
          />
          <Button size="sm" className="h-8" onClick={handleAdd} disabled={!newText.trim()}>Add</Button>
          <Button size="sm" variant="ghost" className="h-8" onClick={() => setAddingNew(false)}>Cancel</Button>
        </div>
      )}
    </div>
  )
}
