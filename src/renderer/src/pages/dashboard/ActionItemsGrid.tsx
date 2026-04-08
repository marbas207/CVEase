import { AlertCircle, Clock, BellRing, Mail } from 'lucide-react'
import { ActionCard } from './ActionCard'
import { formatDate, daysUntil } from '../../lib/utils'
import type { CVE, Vendor, Swimlane } from '../../types/cve'

export interface CVEWithContext {
  cve: CVE
  vendor?: Vendor
  swimlane?: Swimlane
}

interface Props {
  overdueDeadlines: CVEWithContext[]
  approachingDeadlines: CVEWithContext[]
  followupsOverdue: CVEWithContext[]
  followupsUpcoming: CVEWithContext[]
  staleAwaiting: CVEWithContext[]
  onOpen: (id: string) => void
  onFollowUp: (id: string) => void
}

export function ActionItemsGrid({
  overdueDeadlines,
  approachingDeadlines,
  followupsOverdue,
  followupsUpcoming,
  staleAwaiting,
  onOpen,
  onFollowUp
}: Props) {
  return (
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
            {overdueDeadlines.map(({ cve, vendor, swimlane }) => {
              const days = Math.abs(daysUntil(cve.disclosure_deadline)!)
              return (
                <ActionCard
                  key={cve.id}
                  cve={cve}
                  icon={<AlertCircle className="w-4 h-4 text-red-400" />}
                  accent="border-l-red-500"
                  detail={`${days}d past disclosure date (${formatDate(cve.disclosure_deadline)})`}
                  onClick={() => onOpen(cve.id)}
                  vendor={vendor}
                  swimlane={swimlane}
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
            {approachingDeadlines.map(({ cve, vendor, swimlane }) => {
              const days = daysUntil(cve.disclosure_deadline)!
              return (
                <ActionCard
                  key={cve.id}
                  cve={cve}
                  icon={<Clock className="w-4 h-4 text-yellow-400" />}
                  accent="border-l-yellow-500"
                  detail={`${days}d until disclosure (${formatDate(cve.disclosure_deadline)})`}
                  onClick={() => onOpen(cve.id)}
                  vendor={vendor}
                  swimlane={swimlane}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Follow-ups overdue + upcoming */}
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
            {followupsOverdue.map(({ cve, vendor, swimlane }) => (
              <ActionCard
                key={cve.id}
                cve={cve}
                icon={<BellRing className="w-4 h-4 text-red-400" />}
                accent="border-l-red-500"
                detail={`Follow-up overdue since ${formatDate(cve.followup_due_date)}`}
                onClick={() => onOpen(cve.id)}
                action={{ label: 'Follow Up', onClick: () => onFollowUp(cve.id) }}
                vendor={vendor}
                swimlane={swimlane}
              />
            ))}
            {followupsUpcoming.map(({ cve, vendor, swimlane }) => {
              const days = daysUntil(cve.followup_due_date)
              return (
                <ActionCard
                  key={cve.id}
                  cve={cve}
                  icon={<BellRing className="w-4 h-4 text-sky-400" />}
                  accent="border-l-sky-400"
                  detail={`Follow up in ${days}d (${formatDate(cve.followup_due_date)})`}
                  onClick={() => onOpen(cve.id)}
                  action={{ label: 'Follow Up', onClick: () => onFollowUp(cve.id) }}
                  vendor={vendor}
                  swimlane={swimlane}
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
            {staleAwaiting.map(({ cve, vendor, swimlane }) => (
              <ActionCard
                key={cve.id}
                cve={cve}
                icon={<Mail className="w-4 h-4 text-muted-foreground" />}
                accent="border-l-muted-foreground/40"
                detail="No follow-up date set."
                onClick={() => onOpen(cve.id)}
                action={{ label: 'Set Reminder', onClick: () => onFollowUp(cve.id) }}
                vendor={vendor}
                swimlane={swimlane}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
