import type { Stage, ActivityType } from '../types/cve'

export interface StageField {
  key: string
  label: string
  type: 'date' | 'text' | 'email' | 'textarea' | 'days_picker' | 'toggle'
  required: boolean
  placeholder?: string
  hint?: string
}

export interface StageRequirement {
  title: string
  description: string
  fields: StageField[]
  activityType: ActivityType
  activityPrompt: string
}

export const STAGE_REQUIREMENTS: Partial<Record<Stage, StageRequirement>> = {
  'Vendor Contacted': {
    title: 'Vendor Contacted',
    description: 'Record who you reached out to and when. This starts the 90-day disclosure clock.',
    fields: [
      { key: 'date_vendor_notified', label: 'Date Notified', type: 'date', required: true },
      { key: 'vendor_contact_name',  label: 'Contact Name',  type: 'text', required: true, placeholder: 'Security Team / John Smith' },
      { key: 'vendor_contact_email', label: 'Contact Email', type: 'email', required: false, placeholder: 'security@vendor.com' },
      {
        key: 'followup_due_date',
        label: 'Check back in',
        type: 'days_picker',
        required: false,
        hint: 'Set a reminder to follow up if there\'s no response.'
      }
    ],
    activityType: 'Email Sent',
    activityPrompt: 'What did you communicate? Paste a summary of your disclosure email or what you said.'
  },
  'Negotiating': {
    title: 'Negotiating',
    description: 'Vendor acknowledged. Capture the acknowledgement details.',
    fields: [
      {
        key: 'followup_due_date',
        label: 'Check back in',
        type: 'days_picker',
        required: false,
        hint: 'Set a reminder to follow up on the negotiation.'
      }
    ],
    activityType: 'Email Received',
    activityPrompt: 'What did the vendor say? Summarize their response and any proposed timeline.'
  },
  'CVE Requested': {
    title: 'CVE ID Requested',
    description: 'A CVE ID is being sought. If the vendor is a CNA, they can assign one directly. Otherwise, request via MITRE or another CNA.',
    fields: [
      { key: 'date_cve_requested', label: 'Date Requested', type: 'date', required: true },
      { key: 'cve_id', label: 'CVE ID (if already assigned)', type: 'text', required: false, placeholder: 'CVE-2024-XXXXX' },
      {
        key: 'followup_due_date',
        label: 'Check back in',
        type: 'days_picker',
        required: false,
        hint: 'Set a reminder to check on the CVE assignment status.'
      }
    ],
    activityType: 'CVE Requested',
    activityPrompt: 'How was the CVE requested? (Via vendor as CNA, directly from MITRE, via GitHub, etc.)'
  },
  'Published': {
    title: 'Published',
    description: 'The vulnerability is now public. Record the publication details.',
    fields: [
      { key: 'date_disclosed', label: 'Date Published', type: 'date', required: true },
      { key: 'cve_id', label: 'CVE ID', type: 'text', required: false, placeholder: 'CVE-2024-XXXXX' }
    ],
    activityType: 'Note',
    activityPrompt: 'Where was it published? Include advisory URLs, NVD link, vendor bulletin, etc.'
  }
}
