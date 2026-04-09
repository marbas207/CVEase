import { STAGES } from '../../lib/constants'

export function BoardColumnHeader() {
  return (
    <div className="flex sticky top-0 z-20 bg-background border-b border-border">
      {/* Blank space for swimlane header */}
      <div className="sticky left-0 z-30 w-[280px] shrink-0 bg-background border-r border-border" />
      {/* Stage labels */}
      <div className="flex flex-1">
        {STAGES.map((stage) => (
          <div
            key={stage}
            className="flex-1 min-w-[160px] border-r border-border last:border-r-0 px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
          >
            {stage}
          </div>
        ))}
      </div>
    </div>
  )
}
