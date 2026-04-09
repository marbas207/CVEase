import { useState, useEffect } from 'react'
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
import { AlertOctagon } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Bold red title at the top of the dialog. */
  title: string
  /** Plain-text body explaining what will be deleted. */
  description: string
  /** The exact word the user must type to enable the confirm button. */
  confirmKeyword: string
  /** Label for the confirm button. */
  confirmLabel: string
  /** Async callback. Resolves on success, rejects on failure. */
  onConfirm: () => Promise<void>
}

/**
 * GitHub-style "type a keyword to confirm" dialog. The confirm button stays
 * disabled until the input matches `confirmKeyword` (case-sensitive). On
 * confirm we await the action; if it throws, the error is shown inline and
 * the dialog stays open so the user can see what went wrong.
 */
export function PurgeConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmKeyword,
  confirmLabel,
  onConfirm
}: Props) {
  const [typed, setTyped] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)

  // Reset when the dialog opens so a previous failed attempt doesn't leak
  // into the next try.
  useEffect(() => {
    if (open) {
      setTyped('')
      setError(null)
      setRunning(false)
    }
  }, [open])

  const matches = typed === confirmKeyword

  const handleConfirm = async () => {
    if (!matches) return
    setRunning(true)
    setError(null)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (e) {
      setError(String(e))
    } finally {
      setRunning(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!running) onOpenChange(v) }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertOctagon className="w-5 h-5" />
            {title}
          </DialogTitle>
          <DialogDescription className="whitespace-pre-line">{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 py-2">
          <Label htmlFor="purge-confirm-input" className="text-xs">
            Type <span className="font-mono font-bold text-destructive">{confirmKeyword}</span> to confirm:
          </Label>
          <Input
            id="purge-confirm-input"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoFocus
            autoComplete="off"
            disabled={running}
            className="font-mono"
          />
        </div>

        {error && (
          <div className="text-xs text-destructive whitespace-pre-wrap rounded-md border border-destructive/40 bg-destructive/10 p-2">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={running}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!matches || running}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {running ? 'Working…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
