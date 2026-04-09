import type { CVE } from '../types/cve'

/**
 * Days since the CVE last transitioned into its current stage.
 *
 * Falls back to `created_at` if `stage_changed_at` is somehow missing
 * (shouldn't happen post-migration v16, but defensive). Returns null
 * for CVEs with neither timestamp.
 */
export function daysInCurrentStage(cve: CVE): number | null {
  const ref = cve.stage_changed_at ?? cve.created_at
  if (!ref) return null
  const then = new Date(ref).getTime()
  if (Number.isNaN(then)) return null
  const now = Date.now()
  const diff = now - then
  if (diff < 0) return 0
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

/**
 * A CVE is "stale" if it's been sitting in an in-flight stage (Vendor
 * Contacted, Negotiating, or CVE Requested) for more than `days` days
 * AND has no future-dated follow-up reminder set. Discovery and
 * Published are excluded — Discovery is the user's planning state,
 * Published is done.
 */
export function isStaleCVE(cve: CVE, thresholdDays = 30): boolean {
  if (cve.stage === 'Discovery' || cve.stage === 'Published') return false
  const days = daysInCurrentStage(cve)
  if (days === null || days < thresholdDays) return false
  // If the user has a follow-up date set in the future, they're tracking
  // it actively — not stale.
  if (cve.followup_due_date) {
    const today = new Date().toISOString().slice(0, 10)
    if (cve.followup_due_date >= today) return false
  }
  return true
}
