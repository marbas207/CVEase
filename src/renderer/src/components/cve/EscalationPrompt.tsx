import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { useBoardStore } from '../../store/boardStore'
import type { CVE } from '../../types/cve'

interface Props {
  cve: CVE
  /**
   * How many follow-ups already exist for this CVE. The banner appears once
   * the user is on (or about to log) at least their second follow-up — that's
   * the point where it's worth offering CERT/CC mediation.
   */
  priorFollowupCount: number
}

/**
 * Inline nudge that appears in follow-up surfaces (the activity log on the
 * detail panel, and the "Follow Up" modal launched from the dashboard) when:
 *
 *   - the CVE is CVE-eligible (not flagged ineligible),
 *   - it isn't already escalated to VINCE,
 *   - and the user has logged at least one prior follow-up.
 *
 * Renders nothing when the conditions aren't met.
 */
export function EscalationPrompt({ cve, priorFollowupCount }: Props) {
  const updateCVE = useBoardStore((s) => s.updateCVE)
  const [open, setOpen] = useState(false)
  const [vinceCaseId, setVinceCaseId] = useState('')
  const [saving, setSaving] = useState(false)

  const visible =
    priorFollowupCount >= 1 && cve.cve_eligible !== 0 && cve.escalated_to_vince !== 1

  if (!visible) return null

  const handleEscalate = async () => {
    setSaving(true)
    try {
      await updateCVE(cve.id, {
        escalated_to_vince: true,
        vince_case_id: vinceCaseId.trim() || null
      })
      setOpen(false)
      setVinceCaseId('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-md border border-amber-400 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 p-3 space-y-2">
      <div className="flex gap-2">
        <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            Vendor not responding?
          </p>
          <p className="text-xs text-amber-800 dark:text-amber-100/80 mt-0.5">
            You&apos;ve already logged a follow-up without resolution. Consider escalating to
            CERT/CC via VINCE for third-party mediation.
          </p>
        </div>
        {!open && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
            className="h-7 text-xs border-amber-500 text-amber-900 hover:bg-amber-100 dark:border-amber-500/60 dark:text-amber-100 dark:hover:bg-amber-500/20 shrink-0"
          >
            Escalate
          </Button>
        )}
      </div>

      {open && (
        <div className="pl-6 space-y-2">
          <div className="grid gap-1">
            <Label className="text-xs">VINCE Case ID (optional)</Label>
            <Input
              value={vinceCaseId}
              onChange={(e) => setVinceCaseId(e.target.value)}
              placeholder="e.g. VU#298437"
              className="h-8 text-sm font-mono"
              autoFocus
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setOpen(false)
                setVinceCaseId('')
              }}
            >
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={handleEscalate} disabled={saving}>
              {saving ? 'Saving…' : 'Mark as escalated'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
