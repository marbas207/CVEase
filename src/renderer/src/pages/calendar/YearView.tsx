import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { cn } from '../../lib/utils'
import { MONTH_NAMES, ymd, isSameDay, buildMonthGrid } from './helpers'
import { KIND_META, type CalendarEvent } from './events'
import { DayEventsPopover } from './DayEventsPopover'

interface Props {
  year: number
  today: Date
  eventsByDate: Map<string, CalendarEvent[]>
  onChangeYear: (year: number) => void
  onJumpToMonth: (year: number, month: number) => void
  onSelectCVE: (id: string) => void
}

/**
 * 4×3 grid of mini month-grids covering a single year. Each day cell is
 * tiny — too small for text — so we color the background with the
 * highest-priority event's color and rely on hover tooltips for detail.
 *
 * Click a month name → jumps to Month view.
 * Click a day with events → opens the first event's CVE.
 */
export function YearView({ year, today, eventsByDate, onChangeYear, onJumpToMonth, onSelectCVE }: Props) {
  const months = Array.from({ length: 12 }, (_, m) => m)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{year}</h2>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={() => onChangeYear(year - 1)} className="h-8 w-8 p-0" title="Previous year">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onChangeYear(today.getFullYear())} className="h-8 px-3 text-xs">
            This year
          </Button>
          <Button variant="outline" size="sm" onClick={() => onChangeYear(year + 1)} className="h-8 w-8 p-0" title="Next year">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {months.map((month) => (
          <MiniMonth
            key={month}
            year={year}
            month={month}
            today={today}
            eventsByDate={eventsByDate}
            onJumpToMonth={onJumpToMonth}
            onSelectCVE={onSelectCVE}
          />
        ))}
      </div>
    </div>
  )
}

interface MiniMonthProps {
  year: number
  month: number
  today: Date
  eventsByDate: Map<string, CalendarEvent[]>
  onJumpToMonth: (year: number, month: number) => void
  onSelectCVE: (id: string) => void
}

function MiniMonth({ year, month, today, eventsByDate, onJumpToMonth, onSelectCVE }: MiniMonthProps) {
  const grid = buildMonthGrid(year, month)
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

  return (
    <div className={cn(
      'rounded-md border p-3 bg-card',
      isCurrentMonth ? 'border-primary/40 ring-1 ring-primary/20' : 'border-border'
    )}>
      <button
        onClick={() => onJumpToMonth(year, month)}
        className="text-sm font-semibold mb-2 hover:text-primary transition-colors w-full text-left"
      >
        {MONTH_NAMES[month]}
      </button>

      <div className="grid grid-cols-7 gap-0.5">
        {grid.map((day, i) => {
          const inMonth = day.getMonth() === month
          const isToday = isSameDay(day, today)
          const events = inMonth ? (eventsByDate.get(ymd(day)) ?? []) : []
          // Use the highest-priority event's solid color as the cell fill.
          const dominant = events[0]
          const dotColor = dominant ? KIND_META[dominant.kind].solid : undefined
          const hasEvents = events.length > 0 && inMonth

          const cellButton = (
            <button
              type="button"
              disabled={!inMonth || !hasEvents}
              className={cn(
                'aspect-square w-full rounded-sm flex items-center justify-center relative',
                inMonth ? 'text-[9px] text-muted-foreground' : 'text-[9px] text-muted-foreground/30',
                isToday && 'ring-1 ring-primary text-primary font-bold',
                hasEvents && 'cursor-pointer hover:scale-110 transition-transform'
              )}
              style={dotColor ? { backgroundColor: dotColor + '40' } : undefined}
            >
              {inMonth && day.getDate()}
              {events.length > 1 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: dotColor }}
                />
              )}
            </button>
          )

          // Wrap busy days in a popover so the user can pick which event
          // to open. Empty days render the bare button to keep the markup
          // light (12 months × 42 cells = 504 cells per render).
          if (hasEvents) {
            return (
              <DayEventsPopover
                key={i}
                events={events}
                dateKey={ymd(day)}
                onSelectCVE={onSelectCVE}
              >
                {cellButton}
              </DayEventsPopover>
            )
          }
          return <div key={i}>{cellButton}</div>
        })}
      </div>
    </div>
  )
}
