import type { Stage, Severity, ActivityType } from '../types/cve'

export const STAGES: Stage[] = [
  'Discovery',
  'Vendor Contacted',
  'Negotiating',
  'CVE Requested',
  'Published'
]

export const STAGE_ORDER: Record<Stage, number> = {
  'Discovery': 0,
  'Vendor Contacted': 1,
  'Negotiating': 2,
  'CVE Requested': 3,
  'Published': 4
}

export const ACTIVITY_TYPES: ActivityType[] = [
  'Email Sent',
  'Email Received',
  'Phone Call',
  'Meeting',
  'CVE Requested',
  'Note'
]

export const ACTIVITY_ICONS: Record<ActivityType, string> = {
  'Email Sent': '📧',
  'Email Received': '📨',
  'Phone Call': '📞',
  'Meeting': '🤝',
  'CVE Requested': '🔖',
  'Note': '📋'
}

export const SEVERITIES: Severity[] = ['Critical', 'High', 'Medium', 'Low']

export const SEVERITY_COLORS: Record<Severity, string> = {
  Critical: 'bg-red-600 text-white',
  High: 'bg-orange-500 text-white',
  Medium: 'bg-yellow-500 text-black',
  Low: 'bg-blue-500 text-white'
}

export const SEVERITY_BORDER: Record<Severity, string> = {
  Critical: 'border-l-red-600',
  High: 'border-l-orange-500',
  Medium: 'border-l-yellow-500',
  Low: 'border-l-blue-500'
}

export const DISCLOSURE_DAYS = 90
export const WARNING_DAYS = 14
