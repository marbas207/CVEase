import { useState } from 'react'
import { useBoardStore } from '../store/boardStore'
import { SeverityBadge } from '../components/cve/SeverityBadge'
import { LinkedInPostModal } from '../components/cve/LinkedInPostModal'
import { formatDate } from '../lib/utils'
import { Trophy, Linkedin, Calendar, Clock } from 'lucide-react'
import { Button } from '../components/ui/button'
import { cn } from '../lib/utils'
import type { CVE, Swimlane } from '../types/cve'

const SEVERITY_GLOW: Record<string, string> = {
  Critical: 'shadow-red-900/40',
  High: 'shadow-orange-900/40',
  Medium: 'shadow-yellow-900/30',
  Low: 'shadow-blue-900/30'
}

const SEVERITY_MEDAL: Record<string, string> = {
  Critical: '🥇',
  High: '🥈',
  Medium: '🥉',
  Low: '🏅'
}

function HoFCard({ cve, swimlane }: { cve: CVE; swimlane: Swimlane | undefined }) {
  const [postOpen, setPostOpen] = useState(false)

  const disclosureDays = (() => {
    if (!cve.date_discovered || !cve.date_disclosed) return null
    const start = new Date(cve.date_discovered)
    const end = new Date(cve.date_disclosed)
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  })()

  return (
    <>
      <div className={cn(
        'bg-card border border-border rounded-xl p-5 flex flex-col gap-3 shadow-lg',
        SEVERITY_GLOW[cve.severity]
      )}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="text-2xl">{SEVERITY_MEDAL[cve.severity] ?? '🏅'}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <SeverityBadge severity={cve.severity} />
              {cve.cve_id && (
                <span className="text-xs font-mono font-bold text-primary">{cve.cve_id}</span>
              )}
            </div>
            <h3 className="text-sm font-semibold leading-snug">{cve.title}</h3>
            {swimlane && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {swimlane.software_name} · {swimlane.vendor}
                {cve.affected_versions && ` v${cve.affected_versions}`}
              </p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {cve.date_discovered && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Found {formatDate(cve.date_discovered)}
            </span>
          )}
          {cve.date_disclosed && (
            <span className="flex items-center gap-1">
              <Trophy className="w-3 h-3 text-yellow-400" />
              Published {formatDate(cve.date_disclosed)}
            </span>
          )}
          {disclosureDays !== null && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {disclosureDays}d from discovery to publish
            </span>
          )}
        </div>

        {/* Description excerpt */}
        {cve.description && (
          <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
            {cve.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
          <span className="text-xs text-muted-foreground">
            Archived {formatDate(cve.archived_at)}
          </span>
          {swimlane && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => setPostOpen(true)}
            >
              <Linkedin className="w-3.5 h-3.5" />
              Share
            </Button>
          )}
        </div>
      </div>

      {swimlane && (
        <LinkedInPostModal
          open={postOpen}
          onOpenChange={setPostOpen}
          cve={cve}
          swimlane={swimlane}
        />
      )}
    </>
  )
}

export function HallOfFamePage() {
  const { archivedCVEs, swimlanes } = useBoardStore()

  const total = archivedCVEs.length

  const getLane = (id: string): Swimlane | undefined =>
    swimlanes.find(s => s.id === id)

  const grouped = ['Critical', 'High', 'Medium', 'Low'].map(sev => ({
    severity: sev,
    items: archivedCVEs.filter(c => c.severity === sev)
  })).filter(g => g.items.length > 0)

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Trophy className="w-8 h-8 text-yellow-400" />
        <div>
          <h1 className="text-2xl font-bold">Hall of Fame</h1>
          <p className="text-sm text-muted-foreground">
            {total} vulnerabilit{total === 1 ? 'y' : 'ies'} disclosed
          </p>
        </div>
      </div>

      {total === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="text-lg mb-2">Nothing here yet</p>
          <p className="text-sm">Published CVEs will be archived here after 30 days.</p>
        </div>
      )}

      <div className="space-y-10">
        {grouped.map(({ severity, items }) => (
          <div key={severity}>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
              {SEVERITY_MEDAL[severity]} {severity}
              <span className="text-muted-foreground/40 font-normal normal-case tracking-normal">
                {items.length} finding{items.length !== 1 ? 's' : ''}
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map(cve => (
                <HoFCard
                  key={cve.id}
                  cve={cve}
                  swimlane={getLane(cve.swimlane_id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
