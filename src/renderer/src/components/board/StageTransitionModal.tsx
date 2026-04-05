import { useState, useEffect, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { STAGE_REQUIREMENTS } from '../../lib/stageRequirements'
import { ACTIVITY_ICONS } from '../../lib/constants'
import type { CVE, Stage } from '../../types/cve'
import { ArrowRight } from 'lucide-react'
import { cn } from '../../lib/utils'

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

export interface StageTransitionResult {
  fieldUpdates: Partial<CVE>
  activityNote: string
}

interface Props {
  open: boolean
  cve: CVE
  targetStage: Stage
  onConfirm: (result: StageTransitionResult) => void
  onCancel: () => void
}

export function StageTransitionModal({ open, cve, targetStage, onConfirm, onCancel }: Props) {
  const req = STAGE_REQUIREMENTS[targetStage]
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [activityNote, setActivityNote] = useState('')

  // Filter out CVE-specific fields when not CVE eligible
  const visibleFields = (req?.fields ?? []).filter(f => {
    if ((f.key === 'cve_id' || f.key === 'date_cve_requested') && cve.cve_eligible === 0) return false
    return true
  })

  const silentConfirm = useCallback(() => {
    if (open && !req) onConfirm({ fieldUpdates: {}, activityNote: '' })
  }, [open, req, onConfirm])

  useEffect(() => {
    if (!req) { silentConfirm(); return }
    if (open) {
      const initial: Record<string, string> = {}
      for (const f of visibleFields) {
        const raw = (cve as Record<string, unknown>)[f.key]
        if (f.type === 'toggle') {
          initial[f.key] = raw === 1 || raw === true ? '1' : ''
        } else {
          initial[f.key] = (raw as string) ?? ''
        }
      }
      setFieldValues(initial)
      setActivityNote('')
    }
  }, [open, cve, req, silentConfirm]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!req) return null

  const isValid = visibleFields
    .filter(f => f.required)
    .every(f => (fieldValues[f.key] ?? '').trim().length > 0)

  const handleConfirm = () => {
    const fieldUpdates: Partial<CVE> = {}
    for (const f of visibleFields) {
      if (fieldValues[f.key] !== undefined) {
        if (f.type === 'toggle') {
          (fieldUpdates as Record<string, unknown>)[f.key] = fieldValues[f.key] === '1'
        } else {
          (fieldUpdates as Record<string, unknown>)[f.key] = fieldValues[f.key] || null
        }
      }
    }
    onConfirm({ fieldUpdates, activityNote: activityNote.trim() })
  }

  const setField = (key: string, val: string) =>
    setFieldValues(prev => ({ ...prev, [key]: val }))

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onCancel() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-primary" />
            Moving to: {req.title}
          </DialogTitle>
          <DialogDescription>{req.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Required / optional fields */}
          {visibleFields.map(f => (
            <div key={f.key} className="grid gap-1.5">
              <Label htmlFor={`tf-${f.key}`}>
                {f.label}
                {f.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {f.type === 'toggle' ? (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setField(f.key, fieldValues[f.key] === '1' ? '' : '1')}
                    className={cn(
                      'relative w-9 h-5 rounded-full transition-colors',
                      fieldValues[f.key] === '1' ? 'bg-primary' : 'bg-muted'
                    )}
                  >
                    <span className={cn(
                      'block w-4 h-4 rounded-full bg-white shadow transition-transform',
                      fieldValues[f.key] === '1' ? 'translate-x-4' : 'translate-x-0.5'
                    )} />
                  </button>
                  {f.hint && <p className="text-xs text-muted-foreground flex-1">{f.hint}</p>}
                </div>
              ) : f.type === 'days_picker' ? (
                <div className="space-y-2">
                  <div className="flex gap-2 flex-wrap">
                    {DAY_CHIPS.map(chip => {
                      const chipDate = addDays(chip.days)
                      const selected = fieldValues[f.key] === chipDate
                      return (
                        <button
                          key={chip.days}
                          type="button"
                          onClick={() => setField(f.key, selected ? '' : chipDate)}
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
                        const isChipDate = DAY_CHIPS.some(c => addDays(c.days) === fieldValues[f.key])
                        if (isChipDate || !fieldValues[f.key]) {
                          // Switch to custom: seed with a reasonable default
                          setField(f.key, addDays(21))
                        }
                      }}
                      className={cn(
                        'px-3 py-1 rounded-md text-sm border transition-colors',
                        fieldValues[f.key] && !DAY_CHIPS.some(c => addDays(c.days) === fieldValues[f.key])
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:border-primary/50 hover:bg-muted'
                      )}
                    >
                      Custom…
                    </button>
                  </div>
                  {fieldValues[f.key] && !DAY_CHIPS.some(c => addDays(c.days) === fieldValues[f.key]) && (
                    <Input
                      id={`tf-${f.key}`}
                      type="date"
                      value={fieldValues[f.key] ?? ''}
                      onChange={e => setField(f.key, e.target.value)}
                      className="w-auto"
                    />
                  )}
                  {fieldValues[f.key] && (
                    <p className="text-xs text-muted-foreground">
                      Follow-up reminder set for {fieldValues[f.key]}
                    </p>
                  )}
                </div>
              ) : f.type === 'textarea' ? (
                <Textarea
                  id={`tf-${f.key}`}
                  value={fieldValues[f.key] ?? ''}
                  onChange={e => setField(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="min-h-[80px] text-sm"
                />
              ) : (
                <Input
                  id={`tf-${f.key}`}
                  type={f.type}
                  value={fieldValues[f.key] ?? ''}
                  onChange={e => setField(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className={f.type === 'text' && f.key === 'cve_id' ? 'font-mono' : ''}
                />
              )}
              {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
            </div>
          ))}

          {/* Activity note */}
          <div className="grid gap-1.5">
            <Label htmlFor="tf-note">
              <span className="mr-1">{ACTIVITY_ICONS[req.activityType]}</span>
              {req.activityPrompt}
              <span className="text-muted-foreground ml-1 font-normal">(optional)</span>
            </Label>
            <Textarea
              id="tf-note"
              value={activityNote}
              onChange={e => setActivityNote(e.target.value)}
              placeholder="Add details that will be saved to the activity log…"
              className="min-h-[80px] text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!isValid}>
            Confirm Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
