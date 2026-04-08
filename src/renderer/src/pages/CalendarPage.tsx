import { useState, useMemo } from 'react'
import { CalendarDays, Grid3x3, List } from 'lucide-react'
import { useBoardStore } from '../store/boardStore'
import { cn } from '../lib/utils'
import { tagsFromString } from '../lib/tags'
import { KIND_META, KIND_ORDER, deriveEvents, type EventKind } from './calendar/events'
import { MonthView } from './calendar/MonthView'
import { YearView } from './calendar/YearView'
import { ListView } from './calendar/ListView'

type ViewMode = 'month' | 'year' | 'list'

const VIEW_MODES: { id: ViewMode; label: string; Icon: typeof CalendarDays }[] = [
  { id: 'month', label: 'Month', Icon: CalendarDays },
  { id: 'year',  label: 'Year',  Icon: Grid3x3 },
  { id: 'list',  label: 'List',  Icon: List }
]

export function CalendarPage() {
  const { cves: allCves, swimlanes, vendors, severityFilter, searchQuery, tagFilter, selectCVE } = useBoardStore()

  const today = useMemo(() => new Date(), [])

  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [cursor, setCursor] = useState<{ year: number; month: number }>(() => ({
    year: today.getFullYear(),
    month: today.getMonth()
  }))

  // All event kinds visible by default. Filter chips toggle membership.
  const [enabledKinds, setEnabledKinds] = useState<Set<EventKind>>(() => new Set(KIND_ORDER))

  // Apply the same global filters every other page honours.
  const cves = useMemo(() => allCves.filter((c) => {
    if (severityFilter && c.severity !== severityFilter) return false
    if (tagFilter.size > 0) {
      const cveTags = tagsFromString(c.tags)
      if (!cveTags.some((t) => tagFilter.has(t))) return false
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        c.title.toLowerCase().includes(q) ||
        (c.cve_id ?? '').toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q)
      )
    }
    return true
  }), [allCves, severityFilter, searchQuery, tagFilter])

  const eventsByDate = useMemo(
    () => deriveEvents(cves, enabledKinds, swimlanes, vendors),
    [cves, enabledKinds, swimlanes, vendors]
  )

  // Per-kind counts for the filter chips. The count is *context-aware* —
  // it reflects what's visible in the current view's date range, not the
  // entire dataset:
  //   • month view → events in cursor month
  //   • year view  → events in cursor year
  //   • list view  → all events (the list shows everything)
  // Computed against ALL kinds (not just enabled) so disabled chips still
  // show their count, otherwise the user couldn't tell what they'd get if
  // they re-enabled a chip.
  const totalsByKind = useMemo(() => {
    const counts: Record<EventKind, number> = {
      discovery: 0, notified: 0, requested: 0, published: 0, deadline: 0, followup: 0
    }
    let from = '0000-01-01'
    let to = '9999-12-31'
    if (viewMode === 'month') {
      const m = String(cursor.month + 1).padStart(2, '0')
      from = `${cursor.year}-${m}-01`
      // Last day of cursor.month: day-0 of next month rolls back.
      const lastDay = new Date(cursor.year, cursor.month + 1, 0).getDate()
      to = `${cursor.year}-${m}-${String(lastDay).padStart(2, '0')}`
    } else if (viewMode === 'year') {
      from = `${cursor.year}-01-01`
      to = `${cursor.year}-12-31`
    }

    const all = deriveEvents(cves, new Set(KIND_ORDER), swimlanes, vendors)
    for (const [date, list] of all) {
      if (date < from || date > to) continue
      for (const e of list) counts[e.kind]++
    }
    return counts
  }, [cves, swimlanes, vendors, viewMode, cursor])

  const toggleKind = (kind: EventKind) => {
    setEnabledKinds((prev) => {
      const next = new Set(prev)
      if (next.has(kind)) next.delete(kind)
      else next.add(kind)
      return next
    })
  }

  const handleJumpToMonth = (year: number, month: number) => {
    setCursor({ year, month })
    setViewMode('month')
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {/* Header — title + view-mode toggle */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Disclosure deadlines, follow-ups, and milestones across your pipeline.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-muted/30 rounded-md p-1 border border-border">
          {VIEW_MODES.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setViewMode(id)}
              className={cn(
                'flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded transition-colors',
                viewMode === id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter chips — clickable legend that hides/shows event kinds */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">Show:</span>
        {KIND_ORDER.map((kind) => {
          const meta = KIND_META[kind]
          const Icon = meta.Icon
          const enabled = enabledKinds.has(kind)
          const count = totalsByKind[kind]
          return (
            <button
              key={kind}
              onClick={() => toggleKind(kind)}
              className={cn(
                'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all',
                enabled
                  ? cn(meta.bg, meta.text, 'border-transparent ring-1', meta.ring)
                  : 'border-border text-muted-foreground/60 hover:border-muted-foreground/40'
              )}
            >
              <Icon className="w-3 h-3" />
              {meta.label}
              {count > 0 && (
                <span className={cn('text-[10px]', enabled ? 'opacity-70' : 'opacity-50')}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Active view */}
      {viewMode === 'month' && (
        <MonthView
          year={cursor.year}
          month={cursor.month}
          today={today}
          eventsByDate={eventsByDate}
          onChangeMonth={(year, month) => setCursor({ year, month })}
          onSelectCVE={selectCVE}
        />
      )}
      {viewMode === 'year' && (
        <YearView
          year={cursor.year}
          today={today}
          eventsByDate={eventsByDate}
          onChangeYear={(year) => setCursor((c) => ({ ...c, year }))}
          onJumpToMonth={handleJumpToMonth}
          onSelectCVE={selectCVE}
        />
      )}
      {viewMode === 'list' && (
        <ListView
          eventsByDate={eventsByDate}
          onSelectCVE={selectCVE}
        />
      )}
    </div>
  )
}
