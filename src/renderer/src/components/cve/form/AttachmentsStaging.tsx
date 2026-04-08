import { Paperclip, X } from 'lucide-react'
import { Button } from '../../ui/button'
import { Label } from '../../ui/label'

function basename(p: string): string {
  const parts = p.split(/[/\\]/)
  return parts[parts.length - 1] || p
}

interface Props {
  pendingPaths: string[]
  onAddClick: () => void
  onRemove: (idx: number) => void
}

/**
 * The "stage attachments while creating a new CVE" UI. State and handlers
 * are owned by the parent (CVEForm) because the submit handler needs to
 * import them after the CVE row is created.
 */
export function AttachmentsStaging({ pendingPaths, onAddClick, onRemove }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm font-semibold">Attachments</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAddClick}
          className="h-7 gap-1 text-xs"
        >
          <Paperclip className="w-3 h-3" />
          Add files…
        </Button>
      </div>
      {pendingPaths.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          No files staged. Files will be copied into the app on save.
        </p>
      ) : (
        <ul className="space-y-1">
          {pendingPaths.map((p, i) => (
            <li
              key={`${p}-${i}`}
              className="flex items-center gap-2 text-xs bg-muted/40 rounded px-2 py-1.5 border border-border"
            >
              <Paperclip className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="flex-1 truncate font-mono" title={p}>{basename(p)}</span>
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="text-muted-foreground hover:text-destructive shrink-0"
                aria-label="Remove attachment"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
