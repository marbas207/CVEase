import { Search, X, Eye, EyeOff } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { useBoardStore } from '../../store/boardStore'
import { SEVERITIES } from '../../lib/constants'
import type { Severity } from '../../types/cve'
import { cn } from '../../lib/utils'

const SEVERITY_CHIP: Record<Severity, string> = {
  Critical: 'bg-red-600 text-white',
  High: 'bg-orange-500 text-white',
  Medium: 'bg-yellow-500 text-black',
  Low: 'bg-blue-500 text-white'
}

interface Props {
  title: string
}

export function TopBar({ title }: Props) {
  const { searchQuery, setSearch, severityFilter, setSeverityFilter, hideEmptyLanes, setHideEmptyLanes } = useBoardStore()

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-background shrink-0 drag-region">
      <h1 className="text-sm font-semibold text-muted-foreground no-drag">
        <span className="text-primary font-bold">CVEase</span>
        <span className="mx-1.5 text-border">/</span>
        {title}
      </h1>
      <div className="flex-1" />

      {/* Severity filter chips */}
      <div className="flex items-center gap-1 no-drag">
        {SEVERITIES.map(sev => (
          <button
            key={sev}
            onClick={() => setSeverityFilter(severityFilter === sev ? null : sev)}
            className={cn(
              'text-xs font-bold px-2 py-0.5 rounded-full transition-all border',
              severityFilter === sev
                ? cn(SEVERITY_CHIP[sev], 'border-transparent')
                : 'border-border text-muted-foreground hover:border-muted-foreground/50'
            )}
          >
            {sev}
          </button>
        ))}
      </div>

      {/* View toggle */}
      <button
        onClick={() => setHideEmptyLanes(!hideEmptyLanes)}
        className="no-drag flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:border-muted-foreground/50 transition-all"
      >
        {hideEmptyLanes ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
        Showing: {hideEmptyLanes ? 'Active' : 'All'}
      </button>

      {/* Search */}
      <div className="relative no-drag w-56">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <Input
          value={searchQuery}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search vulnerabilities..."
          className="pl-8 h-8 text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter count indicator */}
      {(searchQuery || severityFilter || hideEmptyLanes) && (
        <Button
          variant="ghost"
          size="sm"
          className="no-drag h-8 text-xs text-muted-foreground"
          onClick={() => { setSearch(''); setSeverityFilter(null); setHideEmptyLanes(false) }}
        >
          Clear filters
        </Button>
      )}
    </div>
  )
}
