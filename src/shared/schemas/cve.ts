import { z } from 'zod'
import {
  Severity,
  Stage,
  PatchStatus,
  BountyStatus,
  CveIdField,
  CveIdString,
  UrlField,
  EmailField,
  NonEmptyString,
  DateField,
  IdString,
  emptyOr,
  LenientUrl
} from './_common'

// Re-export the enums so callers only need to import from one place per
// domain. Saves a parallel import line everywhere.
export { Severity, Stage, PatchStatus, BountyStatus }

/**
 * Input shape for `cve:create`. Most date / contact fields are optional
 * because the user can fill them in later as the disclosure progresses.
 */
export const CreateCVEInput = z
  .object({
    swimlane_id: IdString,
    title: NonEmptyString,
    severity: Severity,
    stage: Stage.optional(),
    cve_id: CveIdField,
    description: z.string().optional(),
    vendor_contact_name: z.string().optional(),
    vendor_contact_email: EmailField,
    vendor_contact_other: z.string().optional(),
    date_discovered: DateField,
    date_vendor_notified: DateField,
    disclosure_deadline: DateField,
    date_cve_requested: DateField,
    date_disclosed: DateField,
    affected_component: z.string().optional(),
    affected_versions: z.string().optional(),
    cve_eligible: z.number().int().nullable().optional()
  })
  .strict()

export type CreateCVEInput = z.infer<typeof CreateCVEInput>

/**
 * Input shape for `cve:update`. Every field is optional, and most also
 * accept `null` to clear an existing value. The handler distinguishes
 * "key omitted" (no change) from "key present with null" (clear) using
 * the `in` operator, so it's important that zod doesn't strip explicit
 * undefined / null values — `.strict()` enforces unknown-key rejection
 * without disturbing the present-but-nullish keys.
 */
export const UpdateCVEInput = z
  .object({
    title: NonEmptyString.optional(),
    severity: Severity.optional(),
    stage: Stage.optional(),
    cve_id: CveIdField,
    description: z.string().nullable().optional(),
    vendor_contact_name: z.string().nullable().optional(),
    vendor_contact_email: EmailField,
    vendor_contact_other: z.string().nullable().optional(),
    date_discovered: DateField,
    date_vendor_notified: DateField,
    disclosure_deadline: DateField,
    date_cve_requested: DateField,
    date_disclosed: DateField,
    affected_component: z.string().nullable().optional(),
    affected_versions: z.string().nullable().optional(),
    followup_due_date: DateField,
    escalated_to_vince: z.boolean().optional(),
    vince_case_id: z.string().nullable().optional(),
    patch_status: PatchStatus.optional(),
    patch_url: UrlField,
    cve_eligible: z.number().int().nullable().optional(),
    bounty_eligible: z.number().int().nullable().optional(),
    bounty_status: BountyStatus.optional(),
    bounty_amount: z.string().nullable().optional(),
    bounty_paid_date: DateField,
    bounty_url: UrlField
  })
  .strict()

export type UpdateCVEInput = z.infer<typeof UpdateCVEInput>

/**
 * Filters for `cve:list`. All optional — an empty filter returns the
 * full unarchived board.
 */
export const CVEFilters = z
  .object({
    swimlane_id: IdString.optional(),
    stage: Stage.optional(),
    severity: Severity.optional(),
    search: z.string().optional()
  })
  .strict()
  .optional()

export type CVEFilters = z.infer<typeof CVEFilters>

/** Single ID arg, used by `cve:get` / `cve:delete` / `cve:archive`. */
export const CveIdArg = IdString

/** Args tuple for `cve:move`. */
export const MoveCVEArgs = z.tuple([
  IdString, // id
  Stage, // newStage
  IdString, // newSwimlaneId
  z.number().int() // sortOrder
])

/** Args for `cve:reorder`. */
export const ReorderCVEsInput = z.array(
  z.object({ id: IdString, sort_order: z.number().int() }).strict()
)

// ──────────────────────────────────────────────────────────────────────────
// Form schema for CVEForm.tsx (renderer-side, used by react-hook-form).
// ──────────────────────────────────────────────────────────────────────────
//
// Empty-string-or-valid is the recurring renderer trick — see emptyOr in
// _common.ts. Required-ness is intentionally minimal here (just title +
// severity + stage — fields that are always visible). The submit handler
// enforces create-mode extras (swimlane_id) and maps the form values to
// CreateCVEInput / UpdateCVEInput shapes which the IPC schemas then re-
// validate strictly.

export const CVEFormValues = z.object({
  // Always visible
  swimlane_id: z.string(), // empty in some create paths until vendor/product picked
  title: NonEmptyString,
  severity: Severity,
  stage: Stage,
  affected_component: z.string(),
  affected_versions: z.string(),
  description: z.string(),
  date_discovered: z.string(),
  cve_eligible: z.number().nullable(),

  // Vendor Contacted+
  vendor_contact_name: z.string(),
  vendor_contact_email: emptyOr(z.string().email('Must be a valid email address')),
  vendor_contact_other: z.string(),
  date_vendor_notified: z.string(),
  disclosure_deadline: z.string(),
  bounty_eligible: z.number().nullable(),

  // Negotiating+
  patch_status: PatchStatus,
  patch_url: LenientUrl,
  escalated_to_vince: z.boolean(),
  vince_case_id: z.string(),

  // CVE Requested+
  cve_id: emptyOr(CveIdString),
  date_cve_requested: z.string(),

  // Published+
  date_disclosed: z.string(),
  bounty_status: BountyStatus,
  bounty_amount: z.string(),
  bounty_paid_date: z.string(),
  bounty_url: LenientUrl
})

export type CVEFormValues = z.infer<typeof CVEFormValues>

/** Sensible defaults for an empty form (new vulnerability). */
export const CVE_FORM_DEFAULTS: CVEFormValues = {
  swimlane_id: '',
  title: '',
  severity: 'High',
  stage: 'Discovery',
  affected_component: '',
  affected_versions: '',
  description: '',
  date_discovered: '',
  cve_eligible: 1,
  vendor_contact_name: '',
  vendor_contact_email: '',
  vendor_contact_other: '',
  date_vendor_notified: '',
  disclosure_deadline: '',
  bounty_eligible: null,
  patch_status: 'unknown',
  patch_url: '',
  escalated_to_vince: false,
  vince_case_id: '',
  cve_id: '',
  date_cve_requested: '',
  date_disclosed: '',
  bounty_status: 'none',
  bounty_amount: '',
  bounty_paid_date: '',
  bounty_url: ''
}
