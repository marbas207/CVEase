import { getDb } from '../database'
import { v4 as uuidv4 } from 'uuid'

export interface SwimlaneRow {
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

export interface CreateSwimlaneInput {
  software_name: string
  vendor: string
  vendor_id?: string
  version_affected?: string
  url?: string
  vendor_is_cna?: boolean
}

export interface UpdateSwimlaneInput {
  software_name?: string
  vendor?: string
  vendor_id?: string
  version_affected?: string | null
  url?: string | null
  vendor_is_cna?: boolean
}

export function listSwimlanes(): SwimlaneRow[] {
  const db = getDb()
  return db.prepare('SELECT * FROM swimlanes ORDER BY sort_order ASC, created_at ASC').all() as SwimlaneRow[]
}

export function createSwimlane(input: CreateSwimlaneInput): SwimlaneRow {
  const db = getDb()
  const id = uuidv4()
  const maxOrder = (db.prepare('SELECT MAX(sort_order) as m FROM swimlanes').get() as { m: number | null }).m ?? -1
  db.prepare(`
    INSERT INTO swimlanes (id, software_name, vendor, vendor_id, version_affected, url, vendor_is_cna, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, input.software_name, input.vendor, input.vendor_id ?? null, input.version_affected ?? null, input.url ?? null, input.vendor_is_cna ? 1 : 0, maxOrder + 1)
  return db.prepare('SELECT * FROM swimlanes WHERE id = ?').get(id) as SwimlaneRow
}

export function updateSwimlane(id: string, input: UpdateSwimlaneInput): SwimlaneRow {
  const db = getDb()
  const fields: string[] = []
  const values: unknown[] = []

  if (input.software_name !== undefined) { fields.push('software_name = ?'); values.push(input.software_name) }
  if (input.vendor !== undefined) { fields.push('vendor = ?'); values.push(input.vendor) }
  if (input.vendor_id !== undefined) { fields.push('vendor_id = ?'); values.push(input.vendor_id) }
  if ('version_affected' in input) { fields.push('version_affected = ?'); values.push(input.version_affected ?? null) }
  if ('url' in input) { fields.push('url = ?'); values.push(input.url ?? null) }
  if (input.vendor_is_cna !== undefined) { fields.push('vendor_is_cna = ?'); values.push(input.vendor_is_cna ? 1 : 0) }

  fields.push("updated_at = datetime('now')")
  values.push(id)

  db.prepare(`UPDATE swimlanes SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  return db.prepare('SELECT * FROM swimlanes WHERE id = ?').get(id) as SwimlaneRow
}

export function deleteSwimlane(id: string): void {
  getDb().prepare('DELETE FROM swimlanes WHERE id = ?').run(id)
}

export function setSwimlaneCollapsed(id: string, collapsed: boolean): void {
  getDb().prepare("UPDATE swimlanes SET collapsed = ?, updated_at = datetime('now') WHERE id = ?")
    .run(collapsed ? 1 : 0, id)
}
