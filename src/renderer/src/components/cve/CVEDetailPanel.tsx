import { useState } from 'react'
import { useBoardStore } from '../../store/boardStore'
import { SeverityBadge } from './SeverityBadge'
import { DeadlineBadge } from './DeadlineBadge'
import { FollowUpLog } from './FollowUpLog'
import { AttachmentList } from './AttachmentList'
import { TodoList } from './TodoList'
import { TimelineMilestones } from './TimelineMilestones'
import { CVEForm } from './CVEForm'
import { FollowupActionModal } from './FollowupActionModal'
import { Separator } from '../ui/separator'
import { Button } from '../ui/button'
import { X, Pencil, Trash2, ExternalLink, AlertTriangle, ShieldAlert, Link2, BellRing, DollarSign } from 'lucide-react'
import { formatDate, daysUntil } from '../../lib/utils'

export function CVEDetailPanel() {
  const { selectedCVEId, selectCVE, getCVEById, deleteCVE } = useBoardStore()
  const [editOpen, setEditOpen] = useState(false)
  const [followupOpen, setFollowupOpen] = useState(false)

  const cve = selectedCVEId ? getCVEById(selectedCVEId) : undefined

  if (!cve) return null

  const handleDelete = async () => {
    if (confirm(`Delete "${cve.title}"? This cannot be undone.`)) {
      await deleteCVE(cve.id)
    }
  }

  return (
    <>
      {/* Backdrop — click outside the card to dismiss */}
      <div
        className="fixed inset-0 z-30 bg-black/50 flex items-center justify-center p-6"
        onClick={() => selectCVE(null)}
      />

      {/* Centered card */}
      <div
        className="fixed inset-0 z-40 flex items-center justify-center p-6 pointer-events-none"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="pointer-events-auto w-full max-w-3xl max-h-[90vh] bg-card border border-border rounded-lg shadow-2xl flex flex-col overflow-hidden"
        >
        {/* Header */}
        <div className="flex items-start gap-3 p-4 border-b border-border shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <SeverityBadge severity={cve.severity} />
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                {cve.stage}
              </span>
              {cve.cve_id && (
                <span className="text-xs font-mono text-primary">{cve.cve_id}</span>
              )}
              <DeadlineBadge cve={cve} />
            </div>
            <h2 className="text-base font-semibold leading-snug">{cve.title}</h2>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditOpen(true)} title="Edit">
              <Pencil className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={handleDelete} title="Delete">
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => selectCVE(null)} title="Close">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Created / updated metadata */}
          <div className="text-xs text-muted-foreground">
            Created {formatDate(cve.created_at)} · Updated {formatDate(cve.updated_at)}
          </div>

          {/* Description / Reproduction steps */}
          {cve.description && (
            <div>
              <p className="text-sm font-semibold mb-2">Reproduction Steps / Description</p>
              <pre className="text-xs bg-muted rounded-md p-3 whitespace-pre-wrap font-mono overflow-x-auto">
                {cve.description}
              </pre>
            </div>
          )}

          {/* Affected component & versions */}
          {(cve.affected_component || cve.affected_versions) && (
            <div className="flex gap-3">
              {cve.affected_component && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">Affected Component</p>
                  <p className="text-sm bg-muted rounded px-2 py-1 font-mono truncate">{cve.affected_component}</p>
                </div>
              )}
              {cve.affected_versions && (
                <div className="shrink-0">
                  <p className="text-xs text-muted-foreground mb-1">Versions</p>
                  <p className="text-sm bg-muted rounded px-2 py-1 font-mono">{cve.affected_versions}</p>
                </div>
              )}
            </div>
          )}

          {/* Status badges: patch, bounty, VINCE escalation */}
          {cve.patch_status !== 'unknown' && (
            <div className="flex items-center gap-2 flex-wrap">
              {cve.patch_status === 'no_patch' && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-500/10 rounded px-2 py-1">
                  <AlertTriangle className="w-3 h-3" /> No Patch Available
                </span>
              )}
              {cve.patch_status === 'patch_available' && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-400 bg-green-500/10 rounded px-2 py-1">
                  <ShieldAlert className="w-3 h-3" /> Patch Available
                </span>
              )}
              {cve.patch_status === 'wont_fix' && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-400 bg-yellow-500/10 rounded px-2 py-1">
                  <AlertTriangle className="w-3 h-3" /> Won&apos;t Fix
                </span>
              )}
              {cve.patch_url && (
                <a href={cve.patch_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  <Link2 className="w-3 h-3" /> Advisory
                </a>
              )}
            </div>
          )}

          {(cve.bounty_eligible === 1 || (cve.bounty_status && cve.bounty_status !== 'none')) && (
            <div className="flex items-center gap-2 flex-wrap">
              {cve.bounty_status === 'paid' && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-400 bg-green-500/10 rounded px-2 py-1">
                  <DollarSign className="w-3 h-3" /> Bounty Paid {cve.bounty_amount && `(${cve.bounty_amount})`}
                </span>
              )}
              {cve.bounty_status === 'approved' && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 bg-blue-500/10 rounded px-2 py-1">
                  <DollarSign className="w-3 h-3" /> Bounty Approved
                </span>
              )}
              {cve.bounty_status === 'submitted' && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 rounded px-2 py-1">
                  <DollarSign className="w-3 h-3" /> Bounty Submitted
                </span>
              )}
              {cve.bounty_status === 'rejected' && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-500/10 rounded px-2 py-1">
                  <DollarSign className="w-3 h-3" /> Bounty Rejected
                </span>
              )}
              {cve.bounty_paid_date && (
                <span className="text-xs text-muted-foreground">Paid {formatDate(cve.bounty_paid_date)}</span>
              )}
              {cve.bounty_url && (
                <a href={cve.bounty_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  <Link2 className="w-3 h-3" /> Report
                </a>
              )}
            </div>
          )}

          {cve.escalated_to_vince === 1 && (
            <div className="text-xs bg-orange-500/10 text-orange-400 rounded px-2.5 py-1.5 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>
                <strong>Escalated to VINCE</strong>
                {cve.vince_case_id && <span className="font-mono ml-1.5">{cve.vince_case_id}</span>}
              </span>
            </div>
          )}

          {/* Vendor Contact */}
          {(cve.vendor_contact_name || cve.vendor_contact_email) && (
            <div>
              <p className="text-sm font-semibold mb-2">Vendor Contact</p>
              <div className="space-y-0.5 text-sm">
                {cve.vendor_contact_name && <p>{cve.vendor_contact_name}</p>}
                {cve.vendor_contact_email && (
                  <p className="text-muted-foreground flex items-center gap-1">
                    {cve.vendor_contact_email}
                    <a href={`mailto:${cve.vendor_contact_email}`} className="hover:text-primary">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <TimelineMilestones cve={cve} />

          <Separator />

          {/* Checklist */}
          <TodoList cveId={cve.id} />

          <Separator />

          {/* Follow-up action box (paired with the follow-up log below) */}
          {(cve.stage === 'Vendor Contacted' || cve.stage === 'Negotiating' || cve.stage === 'CVE Requested') && (
            <div className="bg-muted/30 border border-border rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs font-semibold">
                      {cve.followup_due_date
                        ? (() => {
                            const days = daysUntil(cve.followup_due_date)
                            if (days === null) return `Follow-up: ${formatDate(cve.followup_due_date)}`
                            if (days < 0) return `Follow-up overdue by ${Math.abs(days)}d`
                            if (days === 0) return 'Follow up today'
                            return `Follow up in ${days}d (${formatDate(cve.followup_due_date)})`
                          })()
                        : 'No follow-up date set'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => setFollowupOpen(true)}
                >
                  <BellRing className="w-3 h-3" />
                  {cve.followup_due_date ? 'Follow Up' : 'Set Reminder'}
                </Button>
              </div>
            </div>
          )}

          {/* Follow-up log */}
          <FollowUpLog cve={cve} />

          <Separator />

          {/* Attachments */}
          <AttachmentList cveId={cve.id} />
        </div>
        </div>
      </div>

      <CVEForm open={editOpen} onOpenChange={setEditOpen} cve={cve} />
      <FollowupActionModal open={followupOpen} onOpenChange={setFollowupOpen} cveId={cve.id} />
    </>
  )
}
