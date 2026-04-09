import { daysUntil } from '../lib/utils'
import { WARNING_DAYS } from '../lib/constants'
import type { CVE } from '../types/cve'

export type DeadlineStatus = 'overdue' | 'warning' | 'ok' | 'none'

export function useDeadlineStatus(cve: CVE): { status: DeadlineStatus; daysLeft: number | null } {
  if (cve.stage === 'Published') return { status: 'none', daysLeft: null }
  const days = daysUntil(cve.disclosure_deadline)
  if (days === null) return { status: 'none', daysLeft: null }
  if (days < 0) return { status: 'overdue', daysLeft: days }
  if (days <= WARNING_DAYS) return { status: 'warning', daysLeft: days }
  return { status: 'ok', daysLeft: days }
}
