import { getDb } from '../database'
import { v4 as uuidv4 } from 'uuid'
import { app } from 'electron'
import { join, basename } from 'path'
import { copyFileSync, mkdirSync, rmSync, statSync } from 'fs'

export interface AttachmentRow {
  id: string
  cve_id: string
  filename: string
  filepath: string
  mime_type: string | null
  size_bytes: number | null
  created_at: string
}

export function listAttachments(cveId: string): AttachmentRow[] {
  return getDb()
    .prepare('SELECT * FROM attachments WHERE cve_id = ? ORDER BY created_at ASC')
    .all(cveId) as AttachmentRow[]
}

export function importAttachment(cveId: string, sourcePath: string): AttachmentRow {
  const db = getDb()
  const id = uuidv4()
  const filename = basename(sourcePath)
  const destDir = join(app.getPath('userData'), 'attachments', cveId)
  mkdirSync(destDir, { recursive: true })
  const destPath = join(destDir, `${id}-${filename}`)
  copyFileSync(sourcePath, destPath)

  let sizeBytes: number | null = null
  try { sizeBytes = statSync(destPath).size } catch { /* ignore */ }

  db.prepare(`
    INSERT INTO attachments (id, cve_id, filename, filepath, size_bytes)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, cveId, filename, destPath, sizeBytes)

  return db.prepare('SELECT * FROM attachments WHERE id = ?').get(id) as AttachmentRow
}

export function deleteAttachment(id: string): void {
  const db = getDb()
  const row = db.prepare('SELECT filepath FROM attachments WHERE id = ?').get(id) as { filepath: string } | null
  if (row) {
    try { rmSync(row.filepath) } catch { /* file may already be gone */ }
  }
  db.prepare('DELETE FROM attachments WHERE id = ?').run(id)
}

export function deleteAttachmentsForCVE(cveId: string): void {
  const rows = listAttachments(cveId)
  for (const row of rows) {
    try { rmSync(row.filepath) } catch { /* ignore */ }
  }
  getDb().prepare('DELETE FROM attachments WHERE cve_id = ?').run(cveId)
}
