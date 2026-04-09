import { Popover, PopoverTrigger, PopoverContent } from '../../components/ui/popover'
import { cn } from '../../lib/utils'
import { formatDate } from '../../lib/utils'
import { KIND_META, type CalendarEvent } from './events'

interface Props {
  /** Trigger element — usually a day cell or a "+N more" button. */
  children: React.ReactNode
  /** All events on this day, in display order. */
  events: CalendarEvent[]
  /** YYYY-MM-DD of the day, used as the popover title. */
  dateKey: string
  onSelectCVE: (id: string) => void
}

/**
 * Floating panel anchored to a day cell that lists every event on that
 * day. Used by both Month view (on the "+N more" button) and Year view
 * (on any day with events) so users can pick which CVE to open instead
 * of being silently dropped into the first one.
 */
export function DayEventsPopover({ children, events, dateKey, onSelectCVE }: Props) {
  if (events.length === 0) return <>{children}</>

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="center">
        <div className="px-3 py-2 border-b border-border">
          <p className="text-xs font-semibold">{formatDate(dateKey)}</p>
          <p className="text-[11px] text-muted-foreground">
            {events.length} event{events.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="max-h-72 overflow-y-auto py-1">
          {events.map((e, idx) => {
            const meta = KIND_META[e.kind]
            const Icon = meta.Icon
            const subline = [e.vendorName, e.softwareName].filter(Boolean).join(' / ')
            return (
              <button
                key={`${e.cve.id}-${e.kind}-${idx}`}
                onClick={() => onSelectCVE(e.cve.id)}
                className="w-full flex items-start gap-2 text-left px-3 py-2 hover:bg-muted/50 transition-colors"
              >
                <Icon className={cn('w-3.5 h-3.5 shrink-0 mt-0.5', meta.text)} />
                <div className="flex-1 min-w-0">
                  <p className={cn('text-[11px] font-semibold', meta.text)}>{meta.label}</p>
                  <p className="text-xs leading-snug truncate">{e.label}</p>
                  {subline && (
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{subline}</p>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
