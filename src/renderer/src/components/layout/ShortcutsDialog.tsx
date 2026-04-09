import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '../ui/dialog'
import { SHORTCUT_DEFS } from '../../hooks/useKeyboardShortcuts'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function Key({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded bg-muted border border-border text-[11px] font-mono font-semibold text-muted-foreground">
      {children}
    </kbd>
  )
}

export function ShortcutsDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>Quick actions to navigate CVEase.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          {SHORTCUT_DEFS.map((s, i) => (
            <div key={i} className="flex items-center justify-between py-1">
              <span className="text-sm text-foreground">{s.description}</span>
              <div className="flex items-center gap-1">
                {s.ctrl && <Key>Ctrl</Key>}
                {s.shift && <Key>Shift</Key>}
                <Key>{s.key === 'Escape' ? 'Esc' : s.key.toUpperCase()}</Key>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
