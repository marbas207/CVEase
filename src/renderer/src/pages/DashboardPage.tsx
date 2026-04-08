import { useState } from 'react'
import { useBoardStore } from '../store/boardStore'
import { OnboardingGuide } from '../components/layout/OnboardingGuide'
import { FollowupActionModal } from '../components/cve/FollowupActionModal'
import { STAGES } from '../lib/constants'
import type { CVE, Stage, Severity } from '../types/cve'
import { isFollowupOverdue, isDeadlineWarning, isDeadlineOverdue } from './dashboard/helpers'
import { StatsRow } from './dashboard/StatsRow'
import { PipelineBar } from './dashboard/PipelineBar'
import { SeverityBreakdown } from './dashboard/SeverityBreakdown'
import { ActionItemsGrid, type CVEWithContext } from './dashboard/ActionItemsGrid'
import { RecentlyPublished } from './dashboard/RecentlyPublished'

export function DashboardPage() {
  const { cves: allCves, archivedCVEs, swimlanes, vendors, selectCVE, severityFilter, searchQuery } = useBoardStore()
  const [followupCveId, setFollowupCveId] = useState<string | null>(null)

  // Apply the same filters as the board
  const cves = allCves.filter((c) => {
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
  const onboardingDismissed = (() => {
    try { return localStorage.getItem('cvease-onboarding-dismissed') === '1' } catch { return false }
  })()
  if (needsOnboarding && !onboardingDismissed) return <OnboardingGuide />

  // Enrich CVEs with their vendor + swimlane lookup so subcomponents don't
  // each need access to the full lists.
  const getLane = (cve: CVE) => swimlanes.find((s) => s.id === cve.swimlane_id)
  const getVendor = (cve: CVE) => {
    const lane = getLane(cve)
    return lane?.vendor_id ? vendors.find((v) => v.id === lane.vendor_id) : undefined
  }
  const enrich = (cve: CVE): CVEWithContext => ({ cve, vendor: getVendor(cve), swimlane: getLane(cve) })

  // ─ Derived action lists ─
  const followupStages = new Set<Stage>(['Vendor Contacted', 'Negotiating', 'CVE Requested'])

  const overdueDeadlines = cves
    .filter((c) => c.stage !== 'Published' && isDeadlineOverdue(c))
    .sort((a, b) => (a.disclosure_deadline ?? '').localeCompare(b.disclosure_deadline ?? ''))
    .map(enrich)

  const approachingDeadlines = cves
    .filter((c) => c.stage !== 'Published' && isDeadlineWarning(c))
    .sort((a, b) => (a.disclosure_deadline ?? '').localeCompare(b.disclosure_deadline ?? ''))
    .map(enrich)

  const followupsDue = cves
    .filter((c) => followupStages.has(c.stage) && c.followup_due_date)
    .sort((a, b) => (a.followup_due_date ?? '').localeCompare(b.followup_due_date ?? ''))
  const followupsOverdue = followupsDue.filter(isFollowupOverdue).map(enrich)
  const followupsUpcoming = followupsDue.filter((c) => !isFollowupOverdue(c)).map(enrich)

  const staleAwaiting = cves
    .filter((c) => followupStages.has(c.stage) && !c.followup_due_date)
    .map(enrich)

  const recentlyPublished = cves
    .filter((c) => c.stage === 'Published')
    .sort((a, b) => (b.date_disclosed ?? '').localeCompare(a.date_disclosed ?? ''))
    .slice(0, 5)
    .map(enrich)

  // ─ Stats ─
  const stageCounts: Record<Stage, number> = Object.fromEntries(
    STAGES.map((s) => [s, cves.filter((c) => c.stage === s).length])
  ) as Record<Stage, number>

  const severityCounts: Record<Severity, number> = {
    Critical: cves.filter((c) => c.severity === 'Critical').length,
    High: cves.filter((c) => c.severity === 'High').length,
    Medium: cves.filter((c) => c.severity === 'Medium').length,
    Low: cves.filter((c) => c.severity === 'Low').length
  }

  const paidBounties = [...cves, ...archivedCVEs].filter((c) => c.bounty_status === 'paid')
  const totalBountyValue = paidBounties.reduce((sum, c) => {
    if (!c.bounty_amount) return sum
    const num = parseFloat(c.bounty_amount.replace(/[^0-9.]/g, ''))
    return isNaN(num) ? sum : sum + num
  }, 0)

  const totalActive = cves.length
  const urgentCount = overdueDeadlines.length + followupsOverdue.length

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your CVE disclosure pipeline at a glance.</p>
      </div>

      <StatsRow
        totalActive={totalActive}
        urgentCount={urgentCount}
        waitingOnVendors={stageCounts['Vendor Contacted']}
        publishedTotal={stageCounts['Published'] + archivedCVEs.length}
        paidBountyCount={paidBounties.length}
        totalBountyValue={totalBountyValue}
      />

      <PipelineBar stageCounts={stageCounts} totalActive={totalActive} />

      {totalActive > 0 && <SeverityBreakdown counts={severityCounts} />}

      <ActionItemsGrid
        overdueDeadlines={overdueDeadlines}
        approachingDeadlines={approachingDeadlines}
        followupsOverdue={followupsOverdue}
        followupsUpcoming={followupsUpcoming}
        staleAwaiting={staleAwaiting}
        onOpen={selectCVE}
        onFollowUp={setFollowupCveId}
      />

      <RecentlyPublished items={recentlyPublished} onOpen={selectCVE} />

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
