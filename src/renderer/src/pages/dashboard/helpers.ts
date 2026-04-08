import type { CVE } from '../../types/cve'
import { daysUntil } from '../../lib/utils'

export function isFollowupOverdue(cve: CVE): boolean {
  if (!cve.followup_due_date) return false
  return cve.followup_due_date <= new Date().toISOString().slice(0, 10)
}

export function isDeadlineWarning(cve: CVE): boolean {
  const days = daysUntil(cve.disclosure_deadline)
  return days !== null && days >= 0 && days <= 14
}

export function isDeadlineOverdue(cve: CVE): boolean {
  const days = daysUntil(cve.disclosure_deadline)
  return days !== null && days < 0
}
