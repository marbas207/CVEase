import { getDb } from '../database'
import { v4 as uuidv4 } from 'uuid'
import { createDefaultTodos } from './todos'
import { recordStageTransition } from './stageHistory'

export type Stage =
  | 'Discovery'
  | 'Vendor Contacted'
  | 'Negotiating'
  | 'CVE Requested'
  | 'Published'

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low'

export interface CVERow {
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
  patch_status: string
  patch_url: string | null
  cve_eligible: number | null
  bounty_eligible: number | null
  bounty_status: string
  bounty_amount: string | null
  bounty_paid_date: string | null
  bounty_url: string | null
  references_list: string | null
  archived: number
  archived_at: string | null
  sort_order: number
  created_at: string
  updated_at: string
  /**
   * Timestamp of the latest stage transition for this CVE, joined in from
   * `cve_stage_history`. Always populated post-migration v16 (the migration
   * seeds initial rows for pre-existing CVEs).
   */
  stage_changed_at: string | null
}

/**
 * Shared SELECT clause that enriches every CVE row with the timestamp of
 * when it last entered its CURRENT stage. Used everywhere we read CVE rows
 * so the field is uniformly available without each call site having to know
 * about the history table.
 *
 * Note the `AND stage = cves.stage` filter — without it, MAX(changed_at)
 * returns the latest history row regardless of stage, which gives wrong
 * answers in two cases: (a) demo seeding that backdates history rows can
 * push the "current stage" row earlier than older rows, and (b) a CVE that
 * regresses from Negotiating back to Vendor Contacted should report time
 * since the regression, not since the original Vendor Contacted entry.
 */
const SELECT_CVE = `
  SELECT cves.*, (
    SELECT MAX(changed_at)
    FROM cve_stage_history
    WHERE cve_id = cves.id AND stage = cves.stage
  ) AS stage_changed_at
  FROM cves
`

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
  cvss_vector?: string
  cwe_id?: string
  tags?: string
  references_list?: string
  cve_eligible?: number | null
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
  date_cve_requested?: string | null
  date_disclosed?: string | null
  affected_component?: string | null
  affected_versions?: string | null
  cvss_vector?: string | null
  cwe_id?: string | null
  tags?: string | null
  followup_due_date?: string | null
  escalated_to_vince?: boolean
  vince_case_id?: string | null
  patch_status?: string
  patch_url?: string | null
  cve_eligible?: number | null
  bounty_eligible?: number | null
  bounty_status?: string
  bounty_amount?: string | null
  bounty_paid_date?: string | null
  bounty_url?: string | null
  references_list?: string | null
}

export interface CVEFilters {
  swimlane_id?: string
  stage?: Stage
  severity?: Severity
  search?: string
}

function calcDeadline(vendorNotified: string | null | undefined): string | null {
  if (!vendorNotified) return null
  const d = new Date(vendorNotified)
  if (isNaN(d.getTime())) return null
  d.setDate(d.getDate() + 90)
  return d.toISOString().slice(0, 10)
}

export function listCVEs(filters?: CVEFilters): CVERow[] {
  const db = getDb()
  const conditions: string[] = ['archived = 0']
  const values: unknown[] = []

  if (filters?.swimlane_id) { conditions.push('swimlane_id = ?'); values.push(filters.swimlane_id) }
  if (filters?.stage) { conditions.push('stage = ?'); values.push(filters.stage) }
  if (filters?.severity) { conditions.push('severity = ?'); values.push(filters.severity) }
  if (filters?.search) {
    conditions.push('(title LIKE ? OR cve_id LIKE ? OR description LIKE ?)')
    const q = `%${filters.search}%`
    values.push(q, q, q)
  }

  const where = `WHERE ${conditions.join(' AND ')}`
  return db.prepare(`${SELECT_CVE} ${where} ORDER BY swimlane_id, stage, sort_order ASC`).all(...values) as CVERow[]
}

export function listArchivedCVEs(): CVERow[] {
  return getDb()
    .prepare(`${SELECT_CVE} WHERE archived = 1 ORDER BY archived_at DESC`)
    .all() as CVERow[]
}

export function listArchiveEligible(): CVERow[] {
  // Published CVEs where date_disclosed was 30+ days ago
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  const cutoffStr = cutoff.toISOString().slice(0, 10)
  return getDb()
    .prepare(`${SELECT_CVE} WHERE archived = 0 AND stage = 'Published' AND date_disclosed IS NOT NULL AND date_disclosed <= ?`)
    .all(cutoffStr) as CVERow[]
}

export function archiveCVE(id: string): CVERow {
  const db = getDb()
  db.prepare(`UPDATE cves SET archived = 1, archived_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`)
    .run(id)
  return db.prepare(`${SELECT_CVE} WHERE id = ?`).get(id) as CVERow
}

export function getCVE(id: string): CVERow | null {
  return getDb().prepare(`${SELECT_CVE} WHERE id = ?`).get(id) as CVERow | null
}

export function createCVE(input: CreateCVEInput): CVERow {
  const db = getDb()
  const id = uuidv4()
  const stage: Stage = input.stage ?? 'Discovery'
  const deadline = input.disclosure_deadline ?? calcDeadline(input.date_vendor_notified)
  const maxOrder = (db.prepare(
    'SELECT MAX(sort_order) as m FROM cves WHERE swimlane_id = ? AND stage = ?'
  ).get(input.swimlane_id, stage) as { m: number | null }).m ?? -1

  db.prepare(`
    INSERT INTO cves (
      id, swimlane_id, title, cve_id, severity, stage, description,
      vendor_contact_name, vendor_contact_email, vendor_contact_other,
      date_discovered, date_vendor_notified, disclosure_deadline,
      date_cve_requested, date_disclosed, affected_component, affected_versions,
      cvss_vector, cwe_id, tags, references_list, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, input.swimlane_id, input.title,
    input.cve_id ?? null, input.severity, stage,
    input.description ?? null,
    input.vendor_contact_name ?? null,
    input.vendor_contact_email ?? null,
    input.vendor_contact_other ?? null,
    input.date_discovered ?? null,
    input.date_vendor_notified ?? null,
    deadline,
    input.date_cve_requested ?? null,
    input.date_disclosed ?? null,
    input.affected_component ?? null,
    input.affected_versions ?? null,
    input.cvss_vector ?? null,
    input.cwe_id ?? null,
    input.tags ?? null,
    input.references_list ?? null,
    maxOrder + 1
  )
  // Seed an initial stage history row so time-in-stage and stale-CVE
  // detection work for brand-new CVEs.
  recordStageTransition(id, stage)
  // Seed default disclosure workflow todos
  createDefaultTodos(id)

  // Auto-complete vendor-related todos if info already provided
  if (input.vendor_contact_name || input.vendor_contact_email) {
    const contactTodo = db.prepare(
      "SELECT id FROM todos WHERE cve_id = ? AND text LIKE '%Find vendor security contact%' AND completed = 0"
    ).get(id) as { id: string } | undefined
    if (contactTodo) {
      db.prepare("UPDATE todos SET completed = 1, completed_at = datetime('now'), completion_note = ? WHERE id = ?")
        .run('Pre-filled from vendor record', contactTodo.id)
    }
  }

  // Auto-complete CNA todo if vendor's CNA status is known
  const lane = db.prepare('SELECT vendor_id, vendor_is_cna FROM swimlanes WHERE id = ?').get(input.swimlane_id) as { vendor_id: string | null; vendor_is_cna: number } | undefined
  if (lane) {
    const cnaTodo = db.prepare(
      "SELECT id FROM todos WHERE cve_id = ? AND text LIKE '%Determine if vendor is a CNA%' AND completed = 0"
    ).get(id) as { id: string } | undefined
    if (cnaTodo && lane.vendor_id) {
      const vendor = db.prepare('SELECT is_cna, name FROM vendors WHERE id = ?').get(lane.vendor_id) as { is_cna: number; name: string } | undefined
      if (vendor) {
        db.prepare("UPDATE todos SET completed = 1, completed_at = datetime('now'), completion_note = ? WHERE id = ?")
          .run(vendor.is_cna ? `${vendor.name} is a CNA` : `${vendor.name} is not a CNA`, cnaTodo.id)
      }
    }
  }

  // Auto-complete CVE request todo if not CVE eligible
  if (input.cve_eligible === 0) {
    const cveTodo = db.prepare(
      "SELECT id FROM todos WHERE cve_id = ? AND text LIKE '%Request CVE ID%' AND completed = 0"
    ).get(id) as { id: string } | undefined
    if (cveTodo) {
      db.prepare("UPDATE todos SET completed = 1, completed_at = datetime('now'), completion_note = ? WHERE id = ?")
        .run('N/A, not CVE eligible', cveTodo.id)
    }
  }

  return db.prepare(`${SELECT_CVE} WHERE id = ?`).get(id) as CVERow
}

export function updateCVE(id: string, input: UpdateCVEInput): CVERow {
  const db = getDb()
  const fields: string[] = []
  const values: unknown[] = []

  const setField = (col: string, val: unknown) => { fields.push(`${col} = ?`); values.push(val) }

  // If the stage is changing, record a history row. We compare against the
  // current row's stage so a save with the same stage doesn't pollute the
  // history with no-op transitions.
  let stageChangedTo: Stage | null = null
  if (input.stage !== undefined) {
    const current = db.prepare('SELECT stage FROM cves WHERE id = ?').get(id) as { stage: Stage } | undefined
    if (current && current.stage !== input.stage) {
      stageChangedTo = input.stage
    }
  }

  if (input.title !== undefined) setField('title', input.title)
  if (input.severity !== undefined) setField('severity', input.severity)
  if (input.stage !== undefined) setField('stage', input.stage)
  if ('cve_id' in input) setField('cve_id', input.cve_id ?? null)
  if ('description' in input) setField('description', input.description ?? null)
  if ('vendor_contact_name' in input) setField('vendor_contact_name', input.vendor_contact_name ?? null)
  if ('vendor_contact_email' in input) setField('vendor_contact_email', input.vendor_contact_email ?? null)
  if ('vendor_contact_other' in input) setField('vendor_contact_other', input.vendor_contact_other ?? null)
  if ('date_discovered' in input) setField('date_discovered', input.date_discovered ?? null)
  if ('date_vendor_notified' in input) {
    setField('date_vendor_notified', input.date_vendor_notified ?? null)
    // Only auto-calc deadline if not explicitly provided
    if (!('disclosure_deadline' in input)) {
      setField('disclosure_deadline', calcDeadline(input.date_vendor_notified ?? null))
    }
  }
  if ('disclosure_deadline' in input) setField('disclosure_deadline', input.disclosure_deadline ?? null)
  if ('date_cve_requested' in input) setField('date_cve_requested', input.date_cve_requested ?? null)
  if ('date_disclosed' in input) setField('date_disclosed', input.date_disclosed ?? null)
  if ('affected_component' in input) setField('affected_component', input.affected_component ?? null)
  if ('affected_versions' in input) setField('affected_versions', input.affected_versions ?? null)
  if ('cvss_vector' in input) setField('cvss_vector', input.cvss_vector ?? null)
  if ('cwe_id' in input) setField('cwe_id', input.cwe_id ?? null)
  if ('tags' in input) setField('tags', input.tags ?? null)
  if ('followup_due_date' in input) setField('followup_due_date', input.followup_due_date ?? null)
  if (input.escalated_to_vince !== undefined) setField('escalated_to_vince', input.escalated_to_vince ? 1 : 0)
  if ('vince_case_id' in input) setField('vince_case_id', input.vince_case_id ?? null)
  if (input.patch_status !== undefined) setField('patch_status', input.patch_status)
  if ('patch_url' in input) setField('patch_url', input.patch_url ?? null)
  if ('cve_eligible' in input) setField('cve_eligible', input.cve_eligible)
  if ('bounty_eligible' in input) setField('bounty_eligible', input.bounty_eligible)
  if (input.bounty_status !== undefined) setField('bounty_status', input.bounty_status)
  if ('bounty_amount' in input) setField('bounty_amount', input.bounty_amount ?? null)
  if ('bounty_paid_date' in input) setField('bounty_paid_date', input.bounty_paid_date ?? null)
  if ('bounty_url' in input) setField('bounty_url', input.bounty_url ?? null)
  if ('references_list' in input) setField('references_list', input.references_list ?? null)

  fields.push("updated_at = datetime('now')")
  values.push(id)

  db.prepare(`UPDATE cves SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  if (stageChangedTo) recordStageTransition(id, stageChangedTo)
  return db.prepare(`${SELECT_CVE} WHERE id = ?`).get(id) as CVERow
}

export function moveCVE(id: string, newStage: Stage, newSwimlaneId: string, sortOrder: number): CVERow {
  const db = getDb()
  // Same stage-change check as updateCVE: only write a history row if the
  // stage actually changes (drag-to-reorder within the same stage shouldn't
  // pollute history).
  const current = db.prepare('SELECT stage FROM cves WHERE id = ?').get(id) as { stage: Stage } | undefined
  const stageChanged = current && current.stage !== newStage

  db.prepare(`
    UPDATE cves SET stage = ?, swimlane_id = ?, sort_order = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(newStage, newSwimlaneId, sortOrder, id)
  if (stageChanged) recordStageTransition(id, newStage)
  return db.prepare(`${SELECT_CVE} WHERE id = ?`).get(id) as CVERow
}

export function reorderCVEs(updates: { id: string; sort_order: number }[]): void {
  const db = getDb()
  const stmt = db.prepare("UPDATE cves SET sort_order = ?, updated_at = datetime('now') WHERE id = ?")
  const batch = db.transaction((items: { id: string; sort_order: number }[]) => {
    for (const item of items) stmt.run(item.sort_order, item.id)
  })
  batch(updates)
}

export function deleteCVE(id: string): void {
  getDb().prepare('DELETE FROM cves WHERE id = ?').run(id)
}
