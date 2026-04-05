import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../ui/select'
import { useBoardStore } from '../../store/boardStore'
import { calcDeadline } from '../../lib/utils'
import { STAGES, SEVERITIES, STAGE_ORDER } from '../../lib/constants'

// Which stage index the CVE is at (for showing/hiding form sections)
function stageIdx(s: Stage): number { return STAGE_ORDER[s] ?? 0 }
import type { CVE, Stage, Severity, PatchStatus, BountyStatus, CreateCVEInput, UpdateCVEInput } from '../../types/cve'

function autoAdvanceStage(
  currentStage: Stage,
  prevVendorNotified: string | null | undefined,
  newVendorNotified: string,
  prevCveId: string | null | undefined,
  newCveId: string,
  prevDateDisclosed: string | null | undefined,
  newDateDisclosed: string
): Stage {
  let stage = currentStage

  // Setting vendor notified for first time → advance to Vendor Contacted (if still in Discovery)
  if (newVendorNotified && !prevVendorNotified && STAGE_ORDER[stage] < STAGE_ORDER['Vendor Contacted']) {
    stage = 'Vendor Contacted'
  }

  // Assigning a CVE ID for first time → advance to CVE Requested (if not already past it)
  if (newCveId && !prevCveId && STAGE_ORDER[stage] < STAGE_ORDER['CVE Requested']) {
    stage = 'CVE Requested'
  }

  // Setting disclosed date → advance to Published
  if (newDateDisclosed && !prevDateDisclosed && STAGE_ORDER[stage] < STAGE_ORDER['Published']) {
    stage = 'Published'
  }

  return stage
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  swimlaneId?: string   // for create mode
  cve?: CVE             // for edit mode
}

export function CVEForm({ open, onOpenChange, swimlaneId, cve }: Props) {
  const { addCVE, updateCVE, getVendorForSwimlane, swimlanes, vendors } = useBoardStore()
  const isEdit = !!cve

  const [selectedVendorId, setSelectedVendorId] = useState('')
  const [selectedSwimlaneId, setSelectedSwimlaneId] = useState(swimlaneId ?? '')
  const [title, setTitle] = useState('')
  const [severity, setSeverity] = useState<Severity>('High')
  const [stage, setStage] = useState<Stage>('Discovery')
  const [cveId, setCveId] = useState('')
  const [description, setDescription] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactOther, setContactOther] = useState('')
  const [dateDiscovered, setDateDiscovered] = useState('')
  const [dateVendorNotified, setDateVendorNotified] = useState('')
  const [dateCveRequested, setDateCveRequested] = useState('')
  const [dateDisclosed, setDateDisclosed] = useState('')
  const [disclosureDeadline, setDisclosureDeadline] = useState('')
  const [affectedComponent, setAffectedComponent] = useState('')
  const [affectedVersions, setAffectedVersions] = useState('')
  const [patchStatus, setPatchStatus] = useState<PatchStatus>('unknown')
  const [patchUrl, setPatchUrl] = useState('')
  const [escalatedToVince, setEscalatedToVince] = useState(false)
  const [vinceCaseId, setVinceCaseId] = useState('')
  const [cveEligible, setCveEligible] = useState<number | null>(1)
  const [bountyEligible, setBountyEligible] = useState<number | null>(null)
  const [bountyStatus, setBountyStatus] = useState<BountyStatus>('none')
  const [bountyAmount, setBountyAmount] = useState('')
  const [bountyPaidDate, setBountyPaidDate] = useState('')
  const [bountyUrl, setBountyUrl] = useState('')
  const [saving, setSaving] = useState(false)

  // Auto-fill deadline from vendor notified + 90 days if not manually set
  const autoDeadline = calcDeadline(dateVendorNotified)
  const effectiveDeadline = disclosureDeadline || autoDeadline || ''

  const resolvedSwimlaneId = swimlaneId ?? selectedSwimlaneId

  // When swimlane changes in create mode, re-fill vendor contacts
  useEffect(() => {
    if (!cve && resolvedSwimlaneId) {
      const vendor = getVendorForSwimlane(resolvedSwimlaneId)
      setContactName(vendor?.security_contact_name ?? '')
      setContactEmail(vendor?.security_contact_email ?? '')
      setContactOther(vendor?.security_contact_other ?? '')
      const lane = swimlanes.find(s => s.id === resolvedSwimlaneId)
      if (lane?.bounty_in_scope === 1) setBountyEligible(1)
      else if (vendor?.has_bounty_program === 1) setBountyEligible(null) // vendor has program but product scope unknown
      else setBountyEligible(null)
    }
  }, [resolvedSwimlaneId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open) {
      setSelectedVendorId('')
      setSelectedSwimlaneId(swimlaneId ?? '')
      setTitle(cve?.title ?? '')
      setSeverity(cve?.severity ?? 'High')
      setStage(cve?.stage ?? 'Discovery')
      setCveId(cve?.cve_id ?? '')
      setDescription(cve?.description ?? '')
      if (cve) {
        setContactName(cve.vendor_contact_name ?? '')
        setContactEmail(cve.vendor_contact_email ?? '')
        setContactOther(cve.vendor_contact_other ?? '')
      }
      setDateDiscovered(cve?.date_discovered ?? '')
      setDateVendorNotified(cve?.date_vendor_notified ?? '')
      setDateCveRequested(cve?.date_cve_requested ?? '')
      setDateDisclosed(cve?.date_disclosed ?? '')
      setDisclosureDeadline(cve?.disclosure_deadline ?? '')
      setAffectedComponent(cve?.affected_component ?? '')
      setAffectedVersions(cve?.affected_versions ?? '')
      setPatchStatus((cve?.patch_status as PatchStatus) ?? 'unknown')
      setPatchUrl(cve?.patch_url ?? '')
      setEscalatedToVince(cve?.escalated_to_vince === 1)
      setVinceCaseId(cve?.vince_case_id ?? '')
      setCveEligible(cve?.cve_eligible ?? 1)
      setBountyEligible(cve?.bounty_eligible ?? null)
      setBountyStatus((cve?.bounty_status as BountyStatus) ?? 'none')
      setBountyAmount(cve?.bounty_amount ?? '')
      setBountyPaidDate(cve?.bounty_paid_date ?? '')
      setBountyUrl(cve?.bounty_url ?? '')
    }
  }, [open, cve])

  const handleSave = async () => {
    if (!title.trim() || (!isEdit && !resolvedSwimlaneId)) return
    setSaving(true)
    try {
      if (isEdit && cve) {
        const resolvedStage = autoAdvanceStage(
          stage,
          cve.date_vendor_notified,
          dateVendorNotified,
          cve.cve_id,
          cveId.trim(),
          cve.date_disclosed,
          dateDisclosed
        )

        const data: UpdateCVEInput = {
          title: title.trim(),
          severity,
          stage: resolvedStage,
          cve_id: cveId.trim() || null,
          description: description.trim() || null,
          vendor_contact_name: contactName.trim() || null,
          vendor_contact_email: contactEmail.trim() || null,
          vendor_contact_other: contactOther.trim() || null,
          date_discovered: dateDiscovered || null,
          date_vendor_notified: dateVendorNotified || null,
          disclosure_deadline: effectiveDeadline || null,
          date_cve_requested: dateCveRequested || null,
          date_disclosed: dateDisclosed || null,
          affected_component: affectedComponent.trim() || null,
          affected_versions: affectedVersions.trim() || null,
          patch_status: patchStatus,
          patch_url: patchUrl.trim() || null,
          escalated_to_vince: escalatedToVince,
          vince_case_id: vinceCaseId.trim() || null,
          cve_eligible: cveEligible,
          bounty_eligible: bountyEligible,
          bounty_status: bountyStatus,
          bounty_amount: bountyAmount.trim() || null,
          bounty_paid_date: bountyPaidDate || null,
          bounty_url: bountyUrl.trim() || null
        }
        await updateCVE(cve.id, data)
      } else {
        const data: CreateCVEInput = {
          swimlane_id: resolvedSwimlaneId,
          title: title.trim(),
          severity,
          stage,
          cve_id: cveId.trim() || undefined,
          description: description.trim() || undefined,
          vendor_contact_name: contactName.trim() || undefined,
          vendor_contact_email: contactEmail.trim() || undefined,
          vendor_contact_other: contactOther.trim() || undefined,
          date_discovered: dateDiscovered || undefined,
          date_vendor_notified: dateVendorNotified || undefined,
          disclosure_deadline: effectiveDeadline || undefined,
          date_cve_requested: dateCveRequested || undefined,
          date_disclosed: dateDisclosed || undefined,
          affected_component: affectedComponent.trim() || undefined,
          affected_versions: affectedVersions.trim() || undefined,
          cve_eligible: cveEligible
        }
        await addCVE(data)
      }
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Vulnerability' : 'New Vulnerability'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the details for this vulnerability.' : 'Add a new vulnerability to track through the disclosure workflow.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          {/* Vendor → Product picker (when not pre-set) */}
          {!isEdit && !swimlaneId && (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label>Vendor *</Label>
                <Select value={selectedVendorId} onValueChange={v => { setSelectedVendorId(v); setSelectedSwimlaneId('') }}>
                  <SelectTrigger><SelectValue placeholder="Select vendor..." /></SelectTrigger>
                  <SelectContent>
                    {vendors.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                        {v.is_cna === 1 && <span className="ml-1 text-[10px] font-bold text-primary bg-primary/10 rounded px-1 py-0.5">CNA</span>}
                        {v.has_bounty_program === 1 && <span className="ml-1 text-[10px] font-bold text-green-500 bg-green-500/10 rounded px-1 py-0.5">Bounty</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Software / Product *</Label>
                <Select
                  value={selectedSwimlaneId}
                  onValueChange={setSelectedSwimlaneId}
                  disabled={!selectedVendorId}
                >
                  <SelectTrigger><SelectValue placeholder={selectedVendorId ? 'Select product...' : 'Select vendor first'} /></SelectTrigger>
                  <SelectContent>
                    {swimlanes
                      .filter(lane => lane.vendor_id === selectedVendorId)
                      .map(lane => (
                        <SelectItem key={lane.id} value={lane.id}>
                          {lane.software_name}
                          {lane.bounty_in_scope === 1 && <span className="ml-1 text-[10px] font-bold text-green-500 bg-green-500/10 rounded px-1 py-0.5">Bounty</span>}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* ── Always visible: core info ── */}
          <div className="grid gap-1.5">
            <Label htmlFor="cve-title">Title / Short Description *</Label>
            <Input
              id="cve-title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Remote Code Execution via unsanitized path"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label>Severity *</Label>
              <Select value={severity} onValueChange={v => setSeverity(v as Severity)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {isEdit && (
              <div className="grid gap-1.5">
                <Label>Stage</Label>
                <Select value={stage} onValueChange={v => setStage(v as Stage)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="cve-component">Affected Component / Location</Label>
              <Input id="cve-component" value={affectedComponent} onChange={e => setAffectedComponent(e.target.value)} placeholder="e.g. Login page, /api/v1/admin" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cve-versions">Affected Versions</Label>
              <Input id="cve-versions" value={affectedVersions} onChange={e => setAffectedVersions(e.target.value)} placeholder="e.g. 2.0-2.4, < 3.1.2, all" className="font-mono" />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="cve-desc">Reproduction Steps / Description</Label>
            <Textarea
              id="cve-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detailed steps to reproduce the vulnerability, impact analysis..."
              className="min-h-[100px] font-mono text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="date-discovered">Date Discovered</Label>
              <Input id="date-discovered" type="date" value={dateDiscovered} onChange={e => setDateDiscovered(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>CVE Eligible</Label>
              <Select value={String(cveEligible)} onValueChange={v => setCveEligible(v === 'null' ? null : Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Yes</SelectItem>
                  <SelectItem value="0">No (bounty only)</SelectItem>
                  <SelectItem value="null">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ── Vendor Contacted+ : contact info & dates ── */}
          {stageIdx(stage) >= stageIdx('Vendor Contacted') && (
            <>
              <div>
                <p className="text-sm font-semibold mb-3">Vendor Contact</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="contact-name">Name</Label>
                    <Input id="contact-name" value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Security Team" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="contact-email">Email</Label>
                    <Input id="contact-email" type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="security@vendor.com" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="contact-other">Other (HackerOne / etc.)</Label>
                    <Input id="contact-other" value={contactOther} onChange={e => setContactOther(e.target.value)} placeholder="HackerOne: vendor" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="date-notified">Date Vendor Notified</Label>
                  <Input id="date-notified" type="date" value={dateVendorNotified} onChange={e => setDateVendorNotified(e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="date-deadline">Disclosure Deadline</Label>
                  <Input id="date-deadline" type="date" value={effectiveDeadline} onChange={e => setDisclosureDeadline(e.target.value)} />
                  {!disclosureDeadline && autoDeadline && (
                    <p className="text-[11px] text-muted-foreground">Auto-set to 90 days from notification</p>
                  )}
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label>Bounty Eligible</Label>
                <Select value={String(bountyEligible)} onValueChange={v => setBountyEligible(v === 'null' ? null : Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">Unknown</SelectItem>
                    <SelectItem value="1">Yes</SelectItem>
                    <SelectItem value="0">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* ── Negotiating+ : patch status, escalation ── */}
          {stageIdx(stage) >= stageIdx('Negotiating') && (
            <>
              <div>
                <p className="text-sm font-semibold mb-3">Patch Status</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label>Status</Label>
                    <Select value={patchStatus} onValueChange={v => setPatchStatus(v as PatchStatus)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unknown">Unknown</SelectItem>
                        <SelectItem value="no_patch">No Patch Available</SelectItem>
                        <SelectItem value="patch_available">Patch Available</SelectItem>
                        <SelectItem value="wont_fix">Won't Fix</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="patch-url">Patch / Advisory URL</Label>
                    <Input id="patch-url" value={patchUrl} onChange={e => setPatchUrl(e.target.value)} placeholder="https://..." />
                  </div>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-3">Escalation</p>
                <div className="flex items-center gap-3 mb-3">
                  <button
                    type="button"
                    onClick={() => setEscalatedToVince(!escalatedToVince)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${escalatedToVince ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${escalatedToVince ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </button>
                  <Label className="cursor-pointer" onClick={() => setEscalatedToVince(!escalatedToVince)}>
                    Escalated to VINCE (CERT/CC)
                  </Label>
                </div>
                {escalatedToVince && (
                  <div className="grid gap-1.5">
                    <Label htmlFor="vince-case">VINCE Case ID</Label>
                    <Input id="vince-case" value={vinceCaseId} onChange={e => setVinceCaseId(e.target.value)} placeholder="VU#123456" className="font-mono" />
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── CVE Requested+ : CVE ID, date requested ── */}
          {stageIdx(stage) >= stageIdx('CVE Requested') && cveEligible !== 0 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="cve-id">CVE ID</Label>
                <Input id="cve-id" value={cveId} onChange={e => setCveId(e.target.value)} placeholder="CVE-2024-XXXXX" className="font-mono" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="date-cve-req">Date CVE Requested</Label>
                <Input id="date-cve-req" type="date" value={dateCveRequested} onChange={e => setDateCveRequested(e.target.value)} />
              </div>
            </div>
          )}

          {/* ── Published : disclosure date, bounty outcome ── */}
          {stageIdx(stage) >= stageIdx('Published') && (
            <>
              <div className="grid gap-1.5">
                <Label htmlFor="date-disclosed">Date Publicly Disclosed</Label>
                <Input id="date-disclosed" type="date" value={dateDisclosed} onChange={e => setDateDisclosed(e.target.value)} />
              </div>

              {bountyEligible === 1 && (
                <div>
                  <p className="text-sm font-semibold mb-3">Bounty Outcome</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-1.5">
                      <Label>Status</Label>
                      <Select value={bountyStatus} onValueChange={v => setBountyStatus(v as BountyStatus)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="bounty-amount">Amount</Label>
                      <Input id="bounty-amount" value={bountyAmount} onChange={e => setBountyAmount(e.target.value)} placeholder="$500 USD" />
                    </div>
                  </div>
                  {(bountyStatus === 'paid' || bountyStatus === 'approved') && (
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div className="grid gap-1.5">
                        <Label htmlFor="bounty-paid-date">Date Paid</Label>
                        <Input id="bounty-paid-date" type="date" value={bountyPaidDate} onChange={e => setBountyPaidDate(e.target.value)} />
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor="bounty-url">Report URL</Label>
                        <Input id="bounty-url" value={bountyUrl} onChange={e => setBountyUrl(e.target.value)} placeholder="https://..." />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !title.trim() || (!isEdit && !resolvedSwimlaneId)}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Vulnerability'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
