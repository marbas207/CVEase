import { useState } from 'react'
import { useBoardStore } from '../store/boardStore'
import { OnboardingGuide } from '../components/layout/OnboardingGuide'
import { SeverityBadge } from '../components/cve/SeverityBadge'
import { VendorFavicon } from '../components/vendor/VendorFavicon'
import { FollowupActionModal } from '../components/cve/FollowupActionModal'
import { formatDate, daysUntil } from '../lib/utils'
import { cn } from '../lib/utils'
import { STAGES, SEVERITY_COLORS } from '../lib/constants'
import type { CVE, Vendor, Swimlane, Stage, Severity } from '../types/cve'
import {
  AlertCircle,
  Clock,
  BellRing,
  ArrowRight,
  Mail,
  TrendingUp,
  BarChart3,
  ShieldAlert,
  CheckCircle2,
  Trophy,
  DollarSign
} from 'lucide-react'

// ── Helpers ──────────────────────────────────────────────

function isFollowupOverdue(cve: CVE): boolean {
  if (!cve.followup_due_date) return false
  return cve.followup_due_date <= new Date().toISOString().slice(0, 10)
}

function isDeadlineWarning(cve: CVE): boolean {
  const days = daysUntil(cve.disclosure_deadline)
  return days !== null && days >= 0 && days <= 14
}

function isDeadlineOverdue(cve: CVE): boolean {
  const days = daysUntil(cve.disclosure_deadline)
  return days !== null && days < 0
}

// ── Small card used across action lists ──────────────────

function ActionCard({
  cve,
  icon,
  accent,
  detail,
  onClick,
  action,
  vendor,
  swimlane
}: {
  cve: CVE
  icon: React.ReactNode
  accent: string
  detail: string
  onClick: () => void
  action?: { label: string; onClick: () => void }
  vendor?: Vendor
  swimlane?: Swimlane
}) {
  return (
    <div
      className={cn(
        'w-full text-left bg-card border border-border rounded-lg p-3 hover:border-primary/40 hover:shadow-md transition-all group cursor-pointer',
        'border-l-4',
        accent
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug line-clamp-1">{cve.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <SeverityBadge severity={cve.severity} className="text-[10px] px-1 py-0" />
            {cve.cve_id && <span className="text-[11px] font-mono text-muted-foreground">{cve.cve_id}</span>}
            {cve.affected_versions && <span className="text-[11px] font-mono text-muted-foreground">v{cve.affected_versions}</span>}
          </div>
          {(vendor || swimlane) && (
            <div className="flex items-center gap-1.5 mt-1">
              {vendor && <VendorFavicon url={vendor.url} size={12} />}
              <span className="text-[11px] text-muted-foreground truncate">
                {vendor?.name}{vendor && swimlane ? ' / ' : ''}{swimlane?.software_name}
              </span>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1">{detail}</p>
        </div>
        {action ? (
          <button
            onClick={(e) => { e.stopPropagation(); action.onClick() }}
            className="shrink-0 text-xs font-medium px-2 py-1 rounded border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
          >
            {action.label}
          </button>
        ) : (
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0 mt-1" />
        )}
      </div>
    </div>
  )
}

// ── Stat card ────────────────────────────────────────────

function StatCard({
  label,
  value,
  subtitle,
  icon,
  color
}: {
  label: string
  value: number | string
  subtitle?: string
  icon: React.ReactNode
  color?: string
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
      <div className={cn('p-2 rounded-md', color ?? 'bg-muted')}>{icon}</div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        {subtitle && <p className="text-[11px] text-muted-foreground/70">{subtitle}</p>}
      </div>
    </div>
  )
}

// ── Main page ────────────────────────────────────────────

export function DashboardPage() {
  const { cves: allCves, archivedCVEs, swimlanes, vendors, selectCVE, severityFilter, searchQuery } = useBoardStore()
  const [followupCveId, setFollowupCveId] = useState<string | null>(null)

  // Apply the same filters as the board
  const cves = allCves.filter(c => {
    if (severityFilter && c.severity !== severityFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        c.title.toLowerCase().includes(q) ||
        (c.cve_id ?? '').toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q)
      )
    }
    return true
  })

  // Show onboarding if nothing set up yet
  const needsOnboarding = vendors.length === 0 || swimlanes.length === 0 || allCves.length === 0
  const onboardingDismissed = (() => { try { return localStorage.getItem('cvease-onboarding-dismissed') === '1' } catch { return false } })()

  if (needsOnboarding && !onboardingDismissed) {
    return <OnboardingGuide />
  }

  const getLane = (cve: CVE) => swimlanes.find(s => s.id === cve.swimlane_id)
  const getVendor = (cve: CVE) => {
    const lane = getLane(cve)
    return lane?.vendor_id ? vendors.find(v => v.id === lane.vendor_id) : undefined
  }

  const openCVE = (id: string) => selectCVE(id)

  // ─ Derive action items ─

  // Overdue disclosure deadlines
  const overdueDeadlines = cves
    .filter(c => c.stage !== 'Published' && isDeadlineOverdue(c))
    .sort((a, b) => (a.disclosure_deadline ?? '').localeCompare(b.disclosure_deadline ?? ''))

  // Approaching deadlines (within 14 days)
  const approachingDeadlines = cves
    .filter(c => c.stage !== 'Published' && isDeadlineWarning(c))
    .sort((a, b) => (a.disclosure_deadline ?? '').localeCompare(b.disclosure_deadline ?? ''))

  const followupStages = new Set(['Vendor Contacted', 'Negotiating', 'CVE Requested'])

  // Follow-ups due / overdue
  const followupsDue = cves
    .filter(c => followupStages.has(c.stage) && c.followup_due_date)
    .sort((a, b) => (a.followup_due_date ?? '').localeCompare(b.followup_due_date ?? ''))
  const followupsOverdue = followupsDue.filter(isFollowupOverdue)
  const followupsUpcoming = followupsDue.filter(c => !isFollowupOverdue(c))

  // Active stages with no follow-up date set
  const staleAwaiting = cves
    .filter(c => followupStages.has(c.stage) && !c.followup_due_date)

  // ─ Stats ─

  const stageCounts: Record<Stage, number> = Object.fromEntries(
    STAGES.map(s => [s, cves.filter(c => c.stage === s).length])
  ) as Record<Stage, number>

  const severityCounts = {
    Critical: cves.filter(c => c.severity === 'Critical').length,
    High: cves.filter(c => c.severity === 'High').length,
    Medium: cves.filter(c => c.severity === 'Medium').length,
    Low: cves.filter(c => c.severity === 'Low').length
  }

  const paidBounties = [...cves, ...archivedCVEs].filter(c => c.bounty_status === 'paid')
  const totalBountyValue = paidBounties.reduce((sum, c) => {
    if (!c.bounty_amount) return sum
    const num = parseFloat(c.bounty_amount.replace(/[^0-9.]/g, ''))
    return isNaN(num) ? sum : sum + num
  }, 0)
  const totalActive = cves.length
  const totalArchived = archivedCVEs.length
  const urgentCount = overdueDeadlines.length + followupsOverdue.length

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your CVE disclosure pipeline at a glance.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard
          label="Active Vulns"
          value={totalActive}
          icon={<ShieldAlert className="w-5 h-5 text-primary" />}
          color="bg-primary/10"
        />
        <StatCard
          label="Needs Action"
          value={urgentCount}
          icon={<AlertCircle className="w-5 h-5 text-red-400" />}
          color="bg-red-500/10"
        />
        <StatCard
          label="Waiting on Vendors"
          value={stageCounts['Vendor Contacted']}
          icon={<Mail className="w-5 h-5 text-sky-400" />}
          color="bg-sky-500/10"
        />
        <StatCard
          label="Published"
          value={stageCounts['Published'] + totalArchived}
          icon={<Trophy className="w-5 h-5 text-yellow-400" />}
          color="bg-yellow-500/10"
        />
        <StatCard
          label="Bounties Earned"
          value={paidBounties.length}
          subtitle={totalBountyValue > 0 ? `$${totalBountyValue.toLocaleString()}` : undefined}
          icon={<DollarSign className="w-5 h-5 text-green-400" />}
          color="bg-green-500/10"
        />
      </div>

      {/* Pipeline distribution */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
          Pipeline
        </h3>
        <div className="flex gap-1 h-6 rounded overflow-hidden">
          {STAGES.map(stage => {
            const count = stageCounts[stage]
            if (count === 0) return null
            const pct = (count / totalActive) * 100
            const colors: Record<Stage, string> = {
              'Discovery': 'bg-slate-500',
              'Vendor Contacted': 'bg-blue-500',
              'Negotiating': 'bg-purple-500',
              'CVE Requested': 'bg-amber-500',
              'Published': 'bg-green-500'
            }
            return (
              <div
                key={stage}
                className={cn('transition-all relative group flex items-center justify-center', colors[stage])}
                style={{ width: `${pct}%`, minWidth: count > 0 ? 20 : 0 }}
                title={`${stage}: ${count}`}
              >
                <span className="text-[10px] font-bold text-white/90 truncate px-1">{count}</span>
              </div>
            )
          })}
          {totalActive === 0 && (
            <div className="flex-1 bg-muted flex items-center justify-center">
              <span className="text-[10px] text-muted-foreground">No active vulnerabilities</span>
            </div>
          )}
        </div>
        <div className="flex gap-3 mt-2 flex-wrap">
          {STAGES.map(stage => {
            const count = stageCounts[stage]
            if (count === 0) return null
            const dotColors: Record<Stage, string> = {
              'Discovery': 'bg-slate-500',
              'Vendor Contacted': 'bg-blue-500',
              'Negotiating': 'bg-purple-500',
              'CVE Requested': 'bg-amber-500',
              'Published': 'bg-green-500'
            }
            return (
              <span key={stage} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn('w-2 h-2 rounded-full', dotColors[stage])} />
                {stage}
              </span>
            )
          })}
        </div>
      </div>

      {/* Severity breakdown */}
      {totalActive > 0 && (
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            Severity Breakdown
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {(['Critical', 'High', 'Medium', 'Low'] as Severity[]).map(sev => (
              <div key={sev} className="text-center">
                <p className="text-xl font-bold">{severityCounts[sev]}</p>
                <SeverityBadge severity={sev} className="text-[10px] mt-1" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Action Items ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Overdue deadlines */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-red-400">
            <AlertCircle className="w-4 h-4" />
            Overdue Disclosure Dates
            {overdueDeadlines.length > 0 && (
              <span className="text-xs bg-red-500/20 px-1.5 py-0.5 rounded">{overdueDeadlines.length}</span>
            )}
          </h3>
          {overdueDeadlines.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No overdue disclosure dates.</p>
          ) : (
            <div className="space-y-2">
              {overdueDeadlines.map(cve => {
                const days = Math.abs(daysUntil(cve.disclosure_deadline)!)
                return (
                  <ActionCard
                    key={cve.id}
                    cve={cve}
                    icon={<AlertCircle className="w-4 h-4 text-red-400" />}
                    accent="border-l-red-500"
                    detail={`${days}d past disclosure date (${formatDate(cve.disclosure_deadline)})`}
                    onClick={() => openCVE(cve.id)}
                    vendor={getVendor(cve)}
                    swimlane={getLane(cve)}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Approaching deadlines */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-yellow-400">
            <Clock className="w-4 h-4" />
            Approaching Disclosure Dates
            {approachingDeadlines.length > 0 && (
              <span className="text-xs bg-yellow-500/20 px-1.5 py-0.5 rounded">{approachingDeadlines.length}</span>
            )}
          </h3>
          {approachingDeadlines.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No approaching disclosure dates.</p>
          ) : (
            <div className="space-y-2">
              {approachingDeadlines.map(cve => {
                const days = daysUntil(cve.disclosure_deadline)!
                return (
                  <ActionCard
                    key={cve.id}
                    cve={cve}
                    icon={<Clock className="w-4 h-4 text-yellow-400" />}
                    accent="border-l-yellow-500"
                    detail={`${days}d until disclosure (${formatDate(cve.disclosure_deadline)})`}
                    onClick={() => openCVE(cve.id)}
                    vendor={getVendor(cve)}
                    swimlane={getLane(cve)}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Follow-ups overdue */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-sky-400">
            <BellRing className="w-4 h-4" />
            Follow-ups Due
            {followupsOverdue.length > 0 && (
              <span className="text-xs bg-sky-500/20 px-1.5 py-0.5 rounded">{followupsOverdue.length}</span>
            )}
          </h3>
          {followupsOverdue.length === 0 && followupsUpcoming.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No pending follow-ups.</p>
          ) : (
            <div className="space-y-2">
              {followupsOverdue.map(cve => (
                <ActionCard
                  key={cve.id}
                  cve={cve}
                  icon={<BellRing className="w-4 h-4 text-red-400" />}
                  accent="border-l-red-500"
                  detail={`Follow-up overdue since ${formatDate(cve.followup_due_date)}`}
                  onClick={() => openCVE(cve.id)}
                  action={{ label: 'Follow Up', onClick: () => setFollowupCveId(cve.id) }}
                  vendor={getVendor(cve)}
                  swimlane={getLane(cve)}
                />
              ))}
              {followupsUpcoming.map(cve => {
                const days = daysUntil(cve.followup_due_date)
                return (
                  <ActionCard
                    key={cve.id}
                    cve={cve}
                    icon={<BellRing className="w-4 h-4 text-sky-400" />}
                    accent="border-l-sky-400"
                    detail={`Follow up in ${days}d (${formatDate(cve.followup_due_date)})`}
                    onClick={() => openCVE(cve.id)}
                    action={{ label: 'Follow Up', onClick: () => setFollowupCveId(cve.id) }}
                    vendor={getVendor(cve)}
                    swimlane={getLane(cve)}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Stale awaiting — no follow-up date set */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
            <Mail className="w-4 h-4" />
            No Follow-up Set
            {staleAwaiting.length > 0 && (
              <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{staleAwaiting.length}</span>
            )}
          </h3>
          {staleAwaiting.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">All active vulnerabilities have follow-up dates set.</p>
          ) : (
            <div className="space-y-2">
              {staleAwaiting.map(cve => (
                <ActionCard
                  key={cve.id}
                  cve={cve}
                  icon={<Mail className="w-4 h-4 text-muted-foreground" />}
                  accent="border-l-muted-foreground/40"
                  detail="No follow-up date set."
                  onClick={() => openCVE(cve.id)}
                  action={{ label: 'Set Reminder', onClick: () => setFollowupCveId(cve.id) }}
                  vendor={getVendor(cve)}
                  swimlane={getLane(cve)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recently published */}
      {stageCounts['Published'] > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            Recently Published
          </h3>
          <div className="space-y-2">
            {cves
              .filter(c => c.stage === 'Published')
              .sort((a, b) => (b.date_disclosed ?? '').localeCompare(a.date_disclosed ?? ''))
              .slice(0, 5)
              .map(cve => (
                <ActionCard
                  key={cve.id}
                  cve={cve}
                  icon={<CheckCircle2 className="w-4 h-4 text-green-400" />}
                  accent="border-l-green-500"
                  detail={cve.date_disclosed ? `Published ${formatDate(cve.date_disclosed)}` : 'Published'}
                  onClick={() => openCVE(cve.id)}
                />
              ))}
          </div>
        </div>
      )}

      {followupCveId && (
        <FollowupActionModal
          open={true}
          onOpenChange={(v) => { if (!v) setFollowupCveId(null) }}
          cveId={followupCveId}
        />
      )}
    </div>
  )
}
