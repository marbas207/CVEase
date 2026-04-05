import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Input } from '../ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select'
import { useBoardStore } from '../../store/boardStore'
import { api } from '../../lib/ipc'
import { cn } from '../../lib/utils'
import { ACTIVITY_TYPES, ACTIVITY_ICONS } from '../../lib/constants'
import type { ActivityType } from '../../types/cve'

const DAY_CHIPS = [
  { label: '7 days', days: 7 },
  { label: '14 days', days: 14 },
  { label: '30 days', days: 30 },
]

function addDays(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  cveId: string
}

export function FollowupActionModal({ open, onOpenChange, cveId }: Props) {
  const { getCVEById, updateCVE } = useBoardStore()
  const cve = getCVEById(cveId)

  const [activityType, setActivityType] = useState<ActivityType>('Email Sent')
  const [note, setNote] = useState('')
  const [nextFollowup, setNextFollowup] = useState('')
  const [saving, setSaving] = useState(false)

  if (!cve) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      // Log activity if note provided
      if (note.trim()) {
        await api.followup.create(cveId, {
          type: activityType,
          note: note.trim()
        })
      }

      // Update follow-up date (clear old, set new or null)
      await updateCVE(cveId, {
        followup_due_date: nextFollowup || null
      })

      // Reset and close
      setNote('')
      setNextFollowup('')
      setActivityType('Email Sent')
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  const isChipDate = (val: string) => DAY_CHIPS.some(c => addDays(c.days) === val)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Follow Up</DialogTitle>
          <DialogDescription>
            Log what you did and set the next check-in date.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Activity type + note */}
          <div className="grid gap-1.5">
            <Label>What did you do?</Label>
            <Select value={activityType} onValueChange={v => setActivityType(v as ActivityType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPES.map(t => (
                  <SelectItem key={t} value={t}>
                    {ACTIVITY_ICONS[t]} {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="fu-note">Details</Label>
            <Textarea
              id="fu-note"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Sent follow-up email #2, still no response..."
              className="min-h-[80px] text-sm"
              autoFocus
            />
          </div>

          {/* Next follow-up */}
          <div className="grid gap-1.5">
            <Label>Next check-in</Label>
            <div className="flex gap-2 flex-wrap">
              {DAY_CHIPS.map(chip => {
                const chipDate = addDays(chip.days)
                const selected = nextFollowup === chipDate
                return (
                  <button
                    key={chip.days}
                    type="button"
                    onClick={() => setNextFollowup(selected ? '' : chipDate)}
                    className={cn(
                      'px-3 py-1 rounded-md text-sm border transition-colors',
                      selected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:border-primary/50 hover:bg-muted'
                    )}
                  >
                    {chip.label}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => {
                  if (!nextFollowup || isChipDate(nextFollowup)) {
                    setNextFollowup(addDays(21))
                  }
                }}
                className={cn(
                  'px-3 py-1 rounded-md text-sm border transition-colors',
                  nextFollowup && !isChipDate(nextFollowup)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:border-primary/50 hover:bg-muted'
                )}
              >
                Custom...
              </button>
              {nextFollowup && (
                <button
                  type="button"
                  onClick={() => setNextFollowup('')}
                  className="px-3 py-1 rounded-md text-sm border border-border text-muted-foreground hover:border-destructive hover:text-destructive transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            {nextFollowup && !isChipDate(nextFollowup) && (
              <Input
                type="date"
                value={nextFollowup}
                onChange={e => setNextFollowup(e.target.value)}
                className="w-auto"
              />
            )}
            {nextFollowup && (
              <p className="text-xs text-muted-foreground">
                Next follow-up: {nextFollowup}
              </p>
            )}
            {!nextFollowup && (
              <p className="text-xs text-muted-foreground">
                No next follow-up. The reminder will be cleared.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !note.trim()}>
            {saving ? 'Saving...' : 'Log & Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
