import { useState, useEffect } from 'react'
import { api } from '../../lib/ipc'
import { formatDate } from '../../lib/utils'
import { ACTIVITY_TYPES, ACTIVITY_ICONS } from '../../lib/constants'
import type { FollowUp, ActivityType } from '../../types/cve'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Trash2, Plus } from 'lucide-react'
import { cn } from '../../lib/utils'

const ACTIVITY_COLOR: Record<ActivityType, string> = {
  'Email Sent':     'text-blue-400',
  'Email Received': 'text-green-400',
  'Phone Call':     'text-purple-400',
  'Meeting':        'text-yellow-400',
  'CVE Requested':  'text-orange-400',
  'Note':           'text-muted-foreground'
}

interface Props {
  cveId: string
}

export function FollowUpLog({ cveId }: Props) {
  const [entries, setEntries] = useState<FollowUp[]>([])
  const [note, setNote] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState<ActivityType>('Note')
  const [adding, setAdding] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    api.followup.list(cveId).then(setEntries).catch(console.error)
  }, [cveId])

  const handleAdd = async () => {
    if (!note.trim()) return
    setAdding(true)
    try {
      const entry = await api.followup.create(cveId, {
        type,
        note: note.trim(),
        occurred_at: date || undefined
      })
      setEntries(prev => [entry, ...prev])
      setNote('')
      setDate('')
      setType('Note')
      setShowForm(false)
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: string) => {
    await api.followup.delete(id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Activity Log</p>
        <Button variant="ghost" size="sm" onClick={() => setShowForm(v => !v)} className="h-7 gap-1 text-xs">
          <Plus className="w-3 h-3" />
          Log Activity
        </Button>
      </div>

      {showForm && (
        <div className="bg-muted/40 rounded-md p-3 space-y-2 border border-border">
          {/* Activity type selector */}
          <div>
            <Label className="text-xs mb-1 block">Activity Type</Label>
            <div className="flex flex-wrap gap-1.5">
              {ACTIVITY_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    'text-xs px-2 py-1 rounded border transition-colors',
                    type === t
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-muted-foreground/50 text-muted-foreground'
                  )}
                >
                  {ACTIVITY_ICONS[t]} {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-1">
            <Label className="text-xs">Notes</Label>
            <Textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Details..."
              className="min-h-[60px] text-sm"
              autoFocus
            />
          </div>

          <div className="grid gap-1">
            <Label className="text-xs">Date/Time (optional)</Label>
            <Input
              type="datetime-local"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button size="sm" onClick={handleAdd} disabled={adding || !note.trim()}>
              {adding ? 'Saving…' : 'Log'}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-1 max-h-72 overflow-y-auto">
        {entries.length === 0 && !showForm && (
          <p className="text-xs text-muted-foreground italic">No activity logged yet.</p>
        )}
        {entries.map(entry => (
          <div key={entry.id} className="group flex gap-3 text-sm py-2 border-b border-border/50 last:border-0">
            <div className="shrink-0 w-5 text-center">
              <span title={entry.type} className={cn('text-sm', ACTIVITY_COLOR[entry.type as ActivityType])}>
                {ACTIVITY_ICONS[entry.type as ActivityType] ?? '📋'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={cn('text-xs font-medium', ACTIVITY_COLOR[entry.type as ActivityType])}>
                  {entry.type}
                </span>
                <span className="text-xs text-muted-foreground">{formatDate(entry.occurred_at)}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{entry.note}</p>
            </div>
            <button
              onClick={() => handleDelete(entry.id)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0 mt-0.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
