import { useState, useEffect } from 'react'
import { useForm, FormProvider, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '../ui/dialog'
import { Button } from '../ui/button'
import { useBoardStore } from '../../store/boardStore'
import { api } from '../../lib/ipc'
import { calcDeadline } from '../../lib/utils'
import { STAGE_ORDER } from '../../lib/constants'
import { CVEFormValues, CVE_FORM_DEFAULTS } from '../../../../shared/schemas/cve'
import type { CVE, Stage, CreateCVEInput, UpdateCVEInput } from '../../types/cve'
import { VendorProductPicker } from './form/VendorProductPicker'
import { CoreFieldsSection } from './form/CoreFieldsSection'
import { VendorContactSection } from './form/VendorContactSection'
import { NegotiationSection } from './form/NegotiationSection'
import { CveRequestedSection } from './form/CveRequestedSection'
import { PublishedSection } from './form/PublishedSection'
import { AttachmentsStaging } from './form/AttachmentsStaging'

function stageIdx(s: Stage): number { return STAGE_ORDER[s] ?? 0 }

function basename(p: string): string {
  const parts = p.split(/[/\\]/)
  return parts[parts.length - 1] || p
}

/**
 * Walk the form forward through stage milestones based on which dates and
 * IDs the user just supplied. Mirrors the legacy behavior — only ever
 * advances; never backs the stage off.
 */
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
  if (newVendorNotified && !prevVendorNotified && STAGE_ORDER[stage] < STAGE_ORDER['Vendor Contacted']) {
    stage = 'Vendor Contacted'
  }
  if (newCveId && !prevCveId && STAGE_ORDER[stage] < STAGE_ORDER['CVE Requested']) {
    stage = 'CVE Requested'
  }
  if (newDateDisclosed && !prevDateDisclosed && STAGE_ORDER[stage] < STAGE_ORDER['Published']) {
    stage = 'Published'
  }
  return stage
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  swimlaneId?: string
  cve?: CVE
}

/** Build initial form values for a given CVE row (edit) or empty form (create). */
function initialValues(cve: CVE | undefined, swimlaneId: string | undefined): CVEFormValues {
  if (!cve) {
    return { ...CVE_FORM_DEFAULTS, swimlane_id: swimlaneId ?? '' }
  }
  return {
    swimlane_id: cve.swimlane_id,
    title: cve.title,
    severity: cve.severity,
    stage: cve.stage,
    cve_id: cve.cve_id ?? '',
    description: cve.description ?? '',
    vendor_contact_name: cve.vendor_contact_name ?? '',
    vendor_contact_email: cve.vendor_contact_email ?? '',
    vendor_contact_other: cve.vendor_contact_other ?? '',
    date_discovered: cve.date_discovered ?? '',
    date_vendor_notified: cve.date_vendor_notified ?? '',
    disclosure_deadline: cve.disclosure_deadline ?? '',
    date_cve_requested: cve.date_cve_requested ?? '',
    date_disclosed: cve.date_disclosed ?? '',
    affected_component: cve.affected_component ?? '',
    affected_versions: cve.affected_versions ?? '',
    cvss_vector: cve.cvss_vector ?? '',
    cwe_id: cve.cwe_id ?? '',
    tags: cve.tags ?? '',
    references_list: cve.references_list ?? '',
    patch_status: cve.patch_status,
    patch_url: cve.patch_url ?? '',
    escalated_to_vince: cve.escalated_to_vince === 1,
    vince_case_id: cve.vince_case_id ?? '',
    cve_eligible: cve.cve_eligible ?? 1,
    bounty_eligible: cve.bounty_eligible ?? null,
    bounty_status: cve.bounty_status,
    bounty_amount: cve.bounty_amount ?? '',
    bounty_paid_date: cve.bounty_paid_date ?? '',
    bounty_url: cve.bounty_url ?? ''
  }
}

export function CVEForm({ open, onOpenChange, swimlaneId, cve }: Props) {
  const { addCVE, updateCVE, getVendorForSwimlane, swimlanes } = useBoardStore()
  const isEdit = !!cve

  const form = useForm<CVEFormValues>({
    resolver: zodResolver(CVEFormValues),
    defaultValues: initialValues(cve, swimlaneId),
    mode: 'onBlur'
  })
  const { handleSubmit, reset, watch, setValue, formState: { isSubmitting } } = form

  // Attachments staged during a new-CVE flow.
  const [pendingAttachments, setPendingAttachments] = useState<string[]>([])
  const [attachmentError, setAttachmentError] = useState<string | null>(null)

  const watchedSwimlaneId = watch('swimlane_id')
  const watchedStage = watch('stage')
  const watchedCveEligible = watch('cve_eligible')

  // Reset whenever the dialog opens or the underlying CVE changes.
  useEffect(() => {
    if (open) {
      reset(initialValues(cve, swimlaneId))
      setPendingAttachments([])
      setAttachmentError(null)
    }
  }, [open, cve, swimlaneId, reset])

  // Auto-fill vendor contact + bounty fields when the swimlane changes in
  // create mode. Edit mode leaves the existing values alone.
  useEffect(() => {
    if (cve || !watchedSwimlaneId) return
    const vendor = getVendorForSwimlane(watchedSwimlaneId)
    setValue('vendor_contact_name', vendor?.security_contact_name ?? '')
    setValue('vendor_contact_email', vendor?.security_contact_email ?? '')
    setValue('vendor_contact_other', vendor?.security_contact_other ?? '')
    const lane = swimlanes.find((s) => s.id === watchedSwimlaneId)
    setValue('bounty_eligible', lane?.bounty_in_scope === 1 ? 1 : null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedSwimlaneId])

  const handleAddAttachments = async () => {
    setAttachmentError(null)
    try {
      const paths = await api.attachment.showPicker()
      if (paths.length > 0) setPendingAttachments((prev) => [...prev, ...paths])
    } catch (e) {
      setAttachmentError(`Failed to pick files: ${e}`)
    }
  }

  const removePendingAttachment = (idx: number) => {
    setPendingAttachments((prev) => prev.filter((_, i) => i !== idx))
  }

  const onSubmit: SubmitHandler<CVEFormValues> = async (values) => {
    if (!isEdit && !values.swimlane_id) {
      form.setError('swimlane_id', { message: 'Pick a vendor and product first' })
      return
    }

    // Compute the effective deadline once, here in the parent. The
    // VendorContactSection shows the auto value as a placeholder but the
    // submit path is the source of truth for what gets persisted.
    const effectiveDeadline = values.disclosure_deadline || calcDeadline(values.date_vendor_notified) || ''

    if (isEdit && cve) {
      const resolvedStage = autoAdvanceStage(
        values.stage,
        cve.date_vendor_notified,
        values.date_vendor_notified,
        cve.cve_id,
        values.cve_id,
        cve.date_disclosed,
        values.date_disclosed
      )

      const data: UpdateCVEInput = {
        title: values.title.trim(),
        severity: values.severity,
        stage: resolvedStage,
        cve_id: values.cve_id.trim() || null,
        description: values.description.trim() || null,
        vendor_contact_name: values.vendor_contact_name.trim() || null,
        vendor_contact_email: values.vendor_contact_email.trim() || null,
        vendor_contact_other: values.vendor_contact_other.trim() || null,
        date_discovered: values.date_discovered || null,
        date_vendor_notified: values.date_vendor_notified || null,
        disclosure_deadline: effectiveDeadline || null,
        date_cve_requested: values.date_cve_requested || null,
        date_disclosed: values.date_disclosed || null,
        affected_component: values.affected_component.trim() || null,
        affected_versions: values.affected_versions.trim() || null,
        cvss_vector: values.cvss_vector.trim() || null,
        cwe_id: values.cwe_id.trim() || null,
        tags: values.tags.trim() || null,
        references_list: values.references_list.trim() || null,
        patch_status: values.patch_status,
        patch_url: values.patch_url.trim() || null,
        escalated_to_vince: values.escalated_to_vince,
        vince_case_id: values.vince_case_id.trim() || null,
        cve_eligible: values.cve_eligible,
        bounty_eligible: values.bounty_eligible,
        bounty_status: values.bounty_status,
        bounty_amount: values.bounty_amount.trim() || null,
        bounty_paid_date: values.bounty_paid_date || null,
        bounty_url: values.bounty_url.trim() || null
      }
      await updateCVE(cve.id, data)
      onOpenChange(false)
      return
    }

    // Create mode
    const data: CreateCVEInput = {
      swimlane_id: values.swimlane_id,
      title: values.title.trim(),
      severity: values.severity,
      stage: values.stage,
      cve_id: values.cve_id.trim() || undefined,
      description: values.description.trim() || undefined,
      vendor_contact_name: values.vendor_contact_name.trim() || undefined,
      vendor_contact_email: values.vendor_contact_email.trim() || undefined,
      vendor_contact_other: values.vendor_contact_other.trim() || undefined,
      date_discovered: values.date_discovered || undefined,
      date_vendor_notified: values.date_vendor_notified || undefined,
      disclosure_deadline: effectiveDeadline || undefined,
      date_cve_requested: values.date_cve_requested || undefined,
      date_disclosed: values.date_disclosed || undefined,
      affected_component: values.affected_component.trim() || undefined,
      affected_versions: values.affected_versions.trim() || undefined,
      cvss_vector: values.cvss_vector.trim() || undefined,
      cwe_id: values.cwe_id.trim() || undefined,
      tags: values.tags.trim() || undefined,
      references_list: values.references_list.trim() || undefined,
      cve_eligible: values.cve_eligible
    }
    const created = await addCVE(data)

    if (pendingAttachments.length > 0) {
      const failures: string[] = []
      for (const path of pendingAttachments) {
        try {
          await api.attachment.import(created.id, path)
        } catch (e) {
          failures.push(`${basename(path)}: ${e}`)
        }
      }
      if (failures.length > 0) {
        setAttachmentError(
          `Vulnerability created, but ${failures.length} attachment(s) failed to import:\n${failures.join('\n')}`
        )
        return
      }
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Vulnerability' : 'New Vulnerability'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the details for this vulnerability.' : 'Add a new vulnerability to track through the disclosure workflow.'}
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5 py-2">
            {!isEdit && !swimlaneId && <VendorProductPicker />}

            <CoreFieldsSection isEdit={isEdit} />

            {stageIdx(watchedStage) >= stageIdx('Vendor Contacted') && <VendorContactSection />}

            {stageIdx(watchedStage) >= stageIdx('Negotiating') && <NegotiationSection />}

            {stageIdx(watchedStage) >= stageIdx('CVE Requested') && watchedCveEligible !== 0 && (
              <CveRequestedSection />
            )}

            {stageIdx(watchedStage) >= stageIdx('Published') && <PublishedSection />}

            {!isEdit && (
              <AttachmentsStaging
                pendingPaths={pendingAttachments}
                onAddClick={handleAddAttachments}
                onRemove={removePendingAttachment}
              />
            )}

            {attachmentError && (
              <div className="text-xs text-destructive whitespace-pre-wrap rounded-md border border-destructive/40 bg-destructive/10 p-2">
                {attachmentError}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Vulnerability'}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
