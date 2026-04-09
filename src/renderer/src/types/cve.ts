// Enum + input types are the single source of truth in src/shared/schemas.
// We re-export them here so existing renderer imports keep working without
// having to know about zod.
export type {
  Severity,
  Stage,
  PatchStatus,
  BountyStatus,
  ActivityType
} from '../../../shared/schemas/_common'
export type { CreateCVEInput, UpdateCVEInput, CVEFilters } from '../../../shared/schemas/cve'
export type { CreateSwimlaneInput, UpdateSwimlaneInput } from '../../../shared/schemas/swimlane'
export type { CreateVendorInput, UpdateVendorInput } from '../../../shared/schemas/vendor'
export type { CreateFollowUpInput } from '../../../shared/schemas/followup'
export type { CompleteTodoInput } from '../../../shared/schemas/todo'

import type { Severity, Stage, PatchStatus, BountyStatus } from '../../../shared/schemas/_common'

export interface Vendor {
  id: string
  name: string
  security_contact_name: string | null
  security_contact_email: string | null
  security_contact_other: string | null
  is_cna: number
  has_bounty_program: number
  bounty_program_url: string | null
  url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Swimlane {
  id: string
  software_name: string
  vendor: string
  vendor_id: string | null
  version_affected: string | null
  url: string | null
  vendor_is_cna: number
  bounty_in_scope: number
  sort_order: number
  collapsed: number
  created_at: string
  updated_at: string
}

export interface CVE {
  id: string
  swimlane_id: string
  title: string
  cve_id: string | null
  severity: Severity
  stage: Stage
  description: string | null
  vendor_contact_name: string | null
  vendor_contact_email: string | null
  vendor_contact_other: string | null
  date_discovered: string | null
  date_vendor_notified: string | null
  disclosure_deadline: string | null
  date_cve_requested: string | null
  date_disclosed: string | null
  affected_component: string | null
  affected_versions: string | null
  cvss_vector: string | null
  cwe_id: string | null
  tags: string | null
  followup_due_date: string | null
  escalated_to_vince: number
  vince_case_id: string | null
  patch_status: PatchStatus
  patch_url: string | null
  cve_eligible: number | null
  bounty_eligible: number | null
  bounty_status: BountyStatus
  bounty_amount: string | null
  bounty_paid_date: string | null
  bounty_url: string | null
  /** Newline-separated list of reference URLs (PoC, advisory, NVD, etc.). */
  references_list: string | null
  archived: number
  archived_at: string | null
  sort_order: number
  created_at: string
  updated_at: string
  /** Latest stage transition timestamp, joined from cve_stage_history. */
  stage_changed_at: string | null
}

export interface FollowUp {
  id: string
  cve_id: string
  type: ActivityType
  note: string
  occurred_at: string
  created_at: string
}

export interface Todo {
  id: string
  cve_id: string
  text: string
  completed: number
  completed_at: string | null
  completion_note: string | null
  trigger_stage: Stage | null
  sort_order: number
  created_at: string
}

export interface ChecklistTemplateItem {
  id: string
  text: string
  trigger_stage: Stage | null
  sort_order: number
}

export interface Attachment {
  id: string
  cve_id: string
  filename: string
  filepath: string
  mime_type: string | null
  size_bytes: number | null
  created_at: string
}

