import { getDb } from '../database'
import { v4 as uuidv4 } from 'uuid'

export interface VendorRow {
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

export interface CreateVendorInput {
  name: string
  security_contact_name?: string
  security_contact_email?: string
  security_contact_other?: string
  is_cna?: boolean
  has_bounty_program?: boolean
  bounty_program_url?: string
  url?: string
  notes?: string
}

export interface UpdateVendorInput {
  name?: string
  security_contact_name?: string | null
  security_contact_email?: string | null
  security_contact_other?: string | null
  is_cna?: boolean
  has_bounty_program?: boolean
  bounty_program_url?: string | null
  url?: string | null
  notes?: string | null
}

export function listVendors(): VendorRow[] {
  return getDb()
    .prepare('SELECT * FROM vendors ORDER BY name ASC')
    .all() as VendorRow[]
}

export function getVendor(id: string): VendorRow | null {
  return getDb().prepare('SELECT * FROM vendors WHERE id = ?').get(id) as VendorRow | null
}

export function createVendor(input: CreateVendorInput): VendorRow {
  const db = getDb()
  const id = uuidv4()
  db.prepare(`
    INSERT INTO vendors (id, name, security_contact_name, security_contact_email, security_contact_other, is_cna, has_bounty_program, bounty_program_url, url, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    input.name,
    input.security_contact_name ?? null,
    input.security_contact_email ?? null,
    input.security_contact_other ?? null,
    input.is_cna ? 1 : 0,
    input.has_bounty_program ? 1 : 0,
    input.bounty_program_url ?? null,
    input.url ?? null,
    input.notes ?? null
  )
  return db.prepare('SELECT * FROM vendors WHERE id = ?').get(id) as VendorRow
}

export function updateVendor(id: string, input: UpdateVendorInput): VendorRow {
  const db = getDb()
  const fields: string[] = []
  const values: unknown[] = []

  if (input.name !== undefined) { fields.push('name = ?'); values.push(input.name) }
  if ('security_contact_name' in input) { fields.push('security_contact_name = ?'); values.push(input.security_contact_name ?? null) }
  if ('security_contact_email' in input) { fields.push('security_contact_email = ?'); values.push(input.security_contact_email ?? null) }
  if ('security_contact_other' in input) { fields.push('security_contact_other = ?'); values.push(input.security_contact_other ?? null) }
  if (input.is_cna !== undefined) { fields.push('is_cna = ?'); values.push(input.is_cna ? 1 : 0) }
  if (input.has_bounty_program !== undefined) { fields.push('has_bounty_program = ?'); values.push(input.has_bounty_program ? 1 : 0) }
  if ('bounty_program_url' in input) { fields.push('bounty_program_url = ?'); values.push(input.bounty_program_url ?? null) }
  if ('url' in input) { fields.push('url = ?'); values.push(input.url ?? null) }
  if ('notes' in input) { fields.push('notes = ?'); values.push(input.notes ?? null) }

  fields.push("updated_at = datetime('now')")
  values.push(id)

  db.prepare(`UPDATE vendors SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  return db.prepare('SELECT * FROM vendors WHERE id = ?').get(id) as VendorRow
}

export function deleteVendor(id: string): void {
  getDb().prepare('DELETE FROM vendors WHERE id = ?').run(id)
}
