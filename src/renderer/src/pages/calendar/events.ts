import {
  AlertCircle,
  BellRing,
  CheckCircle2,
  Mail,
  Search,
  FileText
} from 'lucide-react'
import type { CVE, Swimlane, Vendor } from '../../types/cve'

// ──────────────────────────────────────────────────────────────────────────
// Event kinds
// ──────────────────────────────────────────────────────────────────────────
//
// Six kinds total. Four map directly to kanban stage dates (discovery,
// notified, requested, published) so the colors match the stage palette
// used elsewhere in the app. Two are derived deadlines (the disclosure
// countdown and the user-set follow-up reminder) — actionable items that
// don't correspond to a stage but matter on a calendar.
//
// "Negotiating" has no associated date field in the schema, so it doesn't
// produce events. If we ever start logging stage transitions, that's the
// place to wire it up.

export type EventKind =
  | 'discovery'
  | 'notified'
  | 'requested'
  | 'published'
  | 'deadline'
  | 'followup'

export interface CalendarEvent {
  date: string // yyyy-mm-dd
  kind: EventKind
  cve: CVE
  label: string
  /** Pre-resolved vendor name for the popover/list — undefined if no vendor wired up. */
  vendorName?: string
  /** Pre-resolved software/product name from the CVE's swimlane. */
  softwareName?: string
}

interface KindMeta {
  label: string
  // Tailwind classes — colors map to the existing stage palette in
  // lib/constants for kanban consistency.
  text: string
  bg: string
  ring: string
  // Hex-ish solid color used for the year-view dots where Tailwind classes
  // would mean a CSS conditional explosion.
  solid: string
  Icon: typeof AlertCircle
}

export const KIND_META: Record<EventKind, KindMeta> = {
  discovery: {
    label: 'Discovery',
    text: 'text-slate-300',
    bg: 'bg-slate-500/15',
    ring: 'ring-slate-500/30',
    solid: '#64748b',
    Icon: Search
  },
  notified: {
    label: 'Vendor Contacted',
    text: 'text-blue-300',
    bg: 'bg-blue-500/15',
    ring: 'ring-blue-500/30',
    solid: '#3b82f6',
    Icon: Mail
  },
  requested: {
    label: 'CVE Requested',
    text: 'text-amber-300',
    bg: 'bg-amber-500/15',
    ring: 'ring-amber-500/30',
    solid: '#f59e0b',
    Icon: FileText
  },
  published: {
    label: 'Published',
    text: 'text-green-300',
    bg: 'bg-green-500/15',
    ring: 'ring-green-500/30',
    solid: '#22c55e',
    Icon: CheckCircle2
  },
  deadline: {
    label: 'Deadline',
    text: 'text-red-300',
    bg: 'bg-red-500/15',
    ring: 'ring-red-500/30',
    solid: '#ef4444',
    Icon: AlertCircle
  },
  followup: {
    label: 'Follow-up',
    text: 'text-sky-300',
    bg: 'bg-sky-500/15',
    ring: 'ring-sky-500/30',
    solid: '#0ea5e9',
    Icon: BellRing
  }
}

/**
 * Display order, also used as priority for "which color wins" in the
 * year view's single-dot-per-day rendering. Actionable kinds (deadline,
 * followup) sort first because they're what the user is most likely to
 * be looking for.
 */
export const KIND_ORDER: EventKind[] = [
  'deadline',
  'followup',
  'discovery',
  'notified',
  'requested',
  'published'
]

/**
 * Walk every CVE and produce a flat list of calendar events, then bucket
 * them by yyyy-mm-dd so day cells just have to do a Map lookup.
 *
 * `enabledKinds` filters at derivation time — passing a smaller set is
 * cheaper than rendering everything and then hiding it.
 *
 * Vendor + swimlane lookups happen here once per CVE, so downstream
 * components (popover, list view) stay pure renderers and don't need
 * access to the full vendor/swimlane arrays.
 */
export function deriveEvents(
  cves: CVE[],
  enabledKinds: ReadonlySet<EventKind>,
  swimlanes: Swimlane[],
  vendors: Vendor[]
): Map<string, CalendarEvent[]> {
  // Build lookup tables once. Maps are O(1) per CVE; the alternative
  // (Array.find inside the loop) would be O(n*m) per derivation.
  const swimlaneById = new Map(swimlanes.map((s) => [s.id, s] as const))
  const vendorById = new Map(vendors.map((v) => [v.id, v] as const))

  const byDate = new Map<string, CalendarEvent[]>()
  const push = (
    date: string | null | undefined,
    kind: EventKind,
    cve: CVE,
    vendorName: string | undefined,
    softwareName: string | undefined
  ) => {
    if (!date) return
    if (!enabledKinds.has(kind)) return
    const key = date.slice(0, 10)
    if (!byDate.has(key)) byDate.set(key, [])
    byDate.get(key)!.push({
      date: key,
      kind,
      cve,
      label: cve.title,
      vendorName,
      softwareName
    })
  }

  for (const cve of cves) {
    const lane = swimlaneById.get(cve.swimlane_id)
    const vendor = lane?.vendor_id ? vendorById.get(lane.vendor_id) : undefined
    const vendorName = vendor?.name
    const softwareName = lane?.software_name

    push(cve.date_discovered,      'discovery', cve, vendorName, softwareName)
    push(cve.date_vendor_notified, 'notified',  cve, vendorName, softwareName)
    push(cve.date_cve_requested,   'requested', cve, vendorName, softwareName)
    push(cve.date_disclosed,       'published', cve, vendorName, softwareName)
    // Deadline + follow-up only matter while the CVE is still in flight.
    if (cve.stage !== 'Published') {
      push(cve.disclosure_deadline, 'deadline', cve, vendorName, softwareName)
      push(cve.followup_due_date,   'followup', cve, vendorName, softwareName)
    }
  }

  // Within a day, sort by kind priority so the most actionable surface first.
  for (const [, list] of byDate) {
    list.sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind))
  }
  return byDate
}

/** Flatten the by-date map back into a single sorted array (for List view). */
export function flattenEvents(byDate: Map<string, CalendarEvent[]>): CalendarEvent[] {
  const out: CalendarEvent[] = []
  for (const [, list] of byDate) out.push(...list)
  // Most recent first.
  out.sort((a, b) => b.date.localeCompare(a.date) || KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind))
  return out
}
