import { getDb } from '../database'
import { v4 as uuidv4 } from 'uuid'

export type ActivityType =
  | 'Email Sent'
  | 'Email Received'
  | 'Phone Call'
  | 'Meeting'
  | 'CVE Requested'
  | 'Note'

export interface FollowUpRow {
  id: string
  cve_id: string
  type: ActivityType
  note: string
  occurred_at: string
  created_at: string
}

export interface CreateFollowUpInput {
  type?: ActivityType
  note: string
  occurred_at?: string
}

export function listFollowUps(cveId: string): FollowUpRow[] {
  return getDb()
    .prepare('SELECT * FROM followups WHERE cve_id = ? ORDER BY occurred_at DESC')
    .all(cveId) as FollowUpRow[]
}

export function createFollowUp(cveId: string, input: CreateFollowUpInput): FollowUpRow {
  const db = getDb()
  const id = uuidv4()
  const occurredAt = input.occurred_at ?? new Date().toISOString()
  const type = input.type ?? 'Note'
  db.prepare('INSERT INTO followups (id, cve_id, type, note, occurred_at) VALUES (?, ?, ?, ?, ?)')
    .run(id, cveId, type, input.note, occurredAt)
  return db.prepare('SELECT * FROM followups WHERE id = ?').get(id) as FollowUpRow
}

export function deleteFollowUp(id: string): void {
  getDb().prepare('DELETE FROM followups WHERE id = ?').run(id)
}
