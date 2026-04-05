export type Stage =
  | 'Discovery'
  | 'Vendor Contacted'
  | 'Negotiating'
  | 'CVE Requested'
  | 'Published'

export type ActivityType =
  | 'Email Sent'
  | 'Email Received'
  | 'Phone Call'
  | 'Meeting'
  | 'CVE Requested'
  | 'Note'

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low'

export type PatchStatus = 'unknown' | 'no_patch' | 'patch_available' | 'wont_fix'

export interface Vendor {
  id: string
  name: string
  security_contact_name: string | null
  security_contact_email: string | null
  security_contact_other: string | null
  is_cna: number
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
  followup_due_date: string | null
  escalated_to_vince: number
  vince_case_id: string | null
  patch_status: PatchStatus
  patch_url: string | null
  archived: number
  archived_at: string | null
  sort_order: number
  created_at: string
  updated_at: string
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

export interface CreateCVEInput {
  swimlane_id: string
  title: string
  severity: Severity
  stage?: Stage
  cve_id?: string
  description?: string
  vendor_contact_name?: string
  vendor_contact_email?: string
  vendor_contact_other?: string
  date_discovered?: string
  date_vendor_notified?: string
  disclosure_deadline?: string
  date_cve_requested?: string
  date_disclosed?: string
  affected_component?: string
  affected_versions?: string
}

export interface UpdateCVEInput {
  title?: string
  severity?: Severity
  stage?: Stage
  cve_id?: string | null
  description?: string | null
  vendor_contact_name?: string | null
  vendor_contact_email?: string | null
  vendor_contact_other?: string | null
  date_discovered?: string | null
  date_vendor_notified?: string | null
  disclosure_deadline?: string | null
  date_cve_requested?: string | null
  date_disclosed?: string | null
  affected_component?: string | null
  affected_versions?: string | null
  followup_due_date?: string | null
  escalated_to_vince?: boolean
  vince_case_id?: string | null
  patch_status?: PatchStatus
  patch_url?: string | null
}

export interface CVEFilters {
  swimlane_id?: string
  stage?: Stage
  severity?: Severity
  search?: string
}
