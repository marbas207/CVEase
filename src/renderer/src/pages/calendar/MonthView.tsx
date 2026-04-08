import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { cn } from '../../lib/utils'
import { MONTH_NAMES, DOW, ymd, isSameDay, buildMonthGrid } from './helpers'
import { KIND_META, type CalendarEvent } from './events'
import { DayEventsPopover } from './DayEventsPopover'

const MAX_VISIBLE_PER_CELL = 3

interface Props {
  year: number
  month: number
  today: Date
  eventsByDate: Map<string, CalendarEvent[]>
  onChangeMonth: (year: number, month: number) => void
  onSelectCVE: (id: string) => void
}

export function MonthView({ year, month, today, eventsByDate, onChangeMonth, onSelectCVE }: Props) {
  const grid = buildMonthGrid(year, month)

  const goPrev = () => {
    const m = month - 1
    if (m < 0) onChangeMonth(year - 1, 11)
    else onChangeMonth(year, m)
  }
  const goNext = () => {
    const m = month + 1
    if (m > 11) onChangeMonth(year + 1, 0)
    else onChangeMonth(year, m)
  }
  const goToday = () => onChangeMonth(today.getFullYear(), today.getMonth())

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{MONTH_NAMES[month]} {year}</h2>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" onClick={goPrev} className="h-8 w-8 p-0" title="Previous month">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday} className="h-8 px-3 text-xs">
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={goNext} className="h-8 w-8 p-0" title="Next month">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 gap-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
        {DOW.map((d) => <div key={d} className="px-2 py-1">{d}</div>)}
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-7 gap-1">
        {grid.map((day, i) => {
          const inMonth = day.getMonth() === month
          const isToday = isSameDay(day, today)
          const events = eventsByDate.get(ymd(day)) ?? []
          const visible = events.slice(0, MAX_VISIBLE_PER_CELL)
          const hidden = events.length - visible.length

          return (
            <div
              key={i}
              className={cn(
                'min-h-[110px] rounded-md border p-1.5 flex flex-col gap-1',
                inMonth ? 'bg-card border-border' : 'bg-muted/20 border-border/40',
                isToday && 'ring-2 ring-primary border-primary'
              )}
            >
              <div className={cn(
                'text-[11px] font-semibold leading-none',
                inMonth ? 'text-foreground' : 'text-muted-foreground/40',
                isToday && 'text-primary'
              )}>
                {day.getDate()}
              </div>

              <div className="flex-1 flex flex-col gap-0.5 overflow-hidden">
                {visible.map((e, idx) => {
                  const meta = KIND_META[e.kind]
                  const Icon = meta.Icon
                  return (
                    <button
                      key={`${e.cve.id}-${e.kind}-${idx}`}
                      onClick={() => onSelectCVE(e.cve.id)}
                      title={`${meta.label}: ${e.label}`}
                      className={cn(
                        'flex items-center gap-1 text-[10px] leading-tight rounded px-1 py-0.5 text-left truncate ring-1',
                        meta.bg, meta.text, meta.ring,
                        'hover:brightness-125 transition-all'
                      )}
                    >
                      <Icon className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{e.label}</span>
                    </button>
                  )
                })}
                {hidden > 0 && (
                  <DayEventsPopover events={events} dateKey={ymd(day)} onSelectCVE={onSelectCVE}>
                    <button className="text-[10px] text-muted-foreground hover:text-foreground text-left px-1">
                      +{hidden} more
                    </button>
                  </DayEventsPopover>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
