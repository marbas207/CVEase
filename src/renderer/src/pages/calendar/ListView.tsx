import { useMemo } from 'react'
import { cn } from '../../lib/utils'
import { formatDate } from '../../lib/utils'
import { KIND_META, flattenEvents, type CalendarEvent } from './events'
import { formatMonthKey, ym } from './helpers'

interface Props {
  eventsByDate: Map<string, CalendarEvent[]>
  onSelectCVE: (id: string) => void
}

/**
 * Reverse-chronological feed of every visible event, grouped by month.
 * The grouping is local to this view — no fancy date library, just a
 * stable ym() key that the formatter turns back into "April 2026".
 */
export function ListView({ eventsByDate, onSelectCVE }: Props) {
  const grouped = useMemo(() => {
    const flat = flattenEvents(eventsByDate)
    const map = new Map<string, CalendarEvent[]>()
    for (const e of flat) {
      const key = ym(new Date(e.date))
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(e)
    }
    // Map preserves insertion order, and flatten already sorted newest-first,
    // so the keys come out in the right order without re-sorting.
    return Array.from(map.entries())
  }, [eventsByDate])

  if (grouped.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-20">
        <p className="text-sm">No events match the current filters.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {grouped.map(([key, events]) => (
        <div key={key}>
          <h3 className="text-sm font-bold text-muted-foreground mb-2 sticky top-0 bg-background py-1">
            {formatMonthKey(key)}
            <span className="ml-2 text-xs text-muted-foreground/60 font-normal">
              {events.length} event{events.length !== 1 ? 's' : ''}
            </span>
          </h3>
          <div className="space-y-1">
            {events.map((e, idx) => {
              const meta = KIND_META[e.kind]
              const Icon = meta.Icon
              return (
                <button
                  key={`${e.cve.id}-${e.kind}-${idx}`}
                  onClick={() => onSelectCVE(e.cve.id)}
                  className={cn(
                    'w-full flex items-center gap-3 text-left px-3 py-2 rounded-md border border-border bg-card hover:border-primary/40 transition-colors'
                  )}
                >
                  <Icon className={cn('w-4 h-4 shrink-0', meta.text)} />
                  <span className={cn('text-xs font-semibold w-32 shrink-0', meta.text)}>
                    {meta.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{e.label}</p>
                    {(e.vendorName || e.softwareName) && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {[e.vendorName, e.softwareName].filter(Boolean).join(' / ')}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0 font-mono">
                    {formatDate(e.date)}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
