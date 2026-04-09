import { Search, X, Eye, EyeOff, Tags } from 'lucide-react'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover'
import { useBoardStore } from '../../store/boardStore'
import { SEVERITIES } from '../../lib/constants'
import type { Severity } from '../../types/cve'
import { cn } from '../../lib/utils'
import { collectAllTags } from '../../lib/tags'
import { CVEaseWordmark } from '../CVEaseWordmark'

const SEVERITY_CHIP: Record<Severity, string> = {
  Critical: 'bg-red-600 text-white',
  High: 'bg-orange-500 text-white',
  Medium: 'bg-yellow-500 text-black',
  Low: 'bg-blue-500 text-white'
}

interface Props {
  title: string
  showBoardFilters?: boolean
}

export function TopBar({ title, showBoardFilters = false }: Props) {
  const {
    searchQuery,
    setSearch,
    severityFilter,
    setSeverityFilter,
    hideEmptyLanes,
    setHideEmptyLanes,
    cves,
    tagFilter,
    toggleTagFilter,
    clearTagFilter
  } = useBoardStore()

  // Build the tag list once per render from current CVEs. Cheap because
  // we only iterate the cves array — no DB call.
  const allTags = collectAllTags(cves)
  const activeTagCount = tagFilter.size

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-border bg-background shrink-0 drag-region">
      <h1 className="text-sm font-semibold text-muted-foreground no-drag">
        <CVEaseWordmark className="text-sm" />
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

      {/* Tag filter — only shown if any tags exist anywhere. The popover
          lists every unique tag across the (unfiltered) CVEs and lets
          the user toggle them in/out. OR semantics. */}
      {allTags.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'no-drag flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-all',
                activeTagCount > 0
                  ? 'bg-primary/15 text-primary border-primary/40'
                  : 'border-border text-muted-foreground hover:border-muted-foreground/50'
              )}
              title="Filter by tag"
            >
              <Tags className="w-3 h-3" />
              Tags
              {activeTagCount > 0 && <span className="text-[10px]">· {activeTagCount}</span>}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-2">
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="text-xs font-semibold">Filter by tag</p>
              {activeTagCount > 0 && (
                <button
                  onClick={clearTagFilter}
                  className="text-[10px] text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1 max-h-64 overflow-y-auto">
              {allTags.map((tag) => {
                const active = tagFilter.has(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTagFilter(tag)}
                    className={cn(
                      'text-[11px] px-1.5 py-0.5 rounded transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/10 text-primary hover:bg-primary/20'
                    )}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 px-1">
              Showing vulnerabilities that have any of the selected tags.
            </p>
          </PopoverContent>
        </Popover>
      )}

      {/* View toggle (board only) */}
      {showBoardFilters && (
        <button
          onClick={() => setHideEmptyLanes(!hideEmptyLanes)}
          className="no-drag flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:border-muted-foreground/50 transition-all"
        >
          {hideEmptyLanes ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          Showing: {hideEmptyLanes ? 'Active' : 'All'}
        </button>
      )}

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
      {(searchQuery || severityFilter || hideEmptyLanes || activeTagCount > 0) && (
        <Button
          variant="ghost"
          size="sm"
          className="no-drag h-8 text-xs text-muted-foreground"
          onClick={() => {
            setSearch('')
            setSeverityFilter(null)
            setHideEmptyLanes(false)
            clearTagFilter()
          }}
        >
          Clear filters
        </Button>
      )}
    </div>
  )
}
