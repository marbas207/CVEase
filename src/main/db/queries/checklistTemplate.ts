import { getDb } from '../database'
import { v4 as uuidv4 } from 'uuid'

export interface TemplateItemRow {
  id: string
  text: string
  trigger_stage: string | null
  sort_order: number
}

export function listTemplateItems(): TemplateItemRow[] {
  return getDb()
    .prepare('SELECT * FROM checklist_template ORDER BY sort_order ASC')
    .all() as TemplateItemRow[]
}

export function createTemplateItem(text: string, sortOrder: number): TemplateItemRow {
  const db = getDb()
  const id = uuidv4()
  db.prepare('INSERT INTO checklist_template (id, text, trigger_stage, sort_order) VALUES (?, ?, NULL, ?)')
    .run(id, text, sortOrder)
  return db.prepare('SELECT * FROM checklist_template WHERE id = ?').get(id) as TemplateItemRow
}

export function updateTemplateItem(id: string, text: string): TemplateItemRow {
  const db = getDb()
  db.prepare('UPDATE checklist_template SET text = ? WHERE id = ?').run(text, id)
  return db.prepare('SELECT * FROM checklist_template WHERE id = ?').get(id) as TemplateItemRow
}

export function deleteTemplateItem(id: string): void {
  getDb().prepare('DELETE FROM checklist_template WHERE id = ?').run(id)
}

export function reorderTemplateItems(updates: { id: string; sort_order: number }[]): void {
  const db = getDb()
  const stmt = db.prepare('UPDATE checklist_template SET sort_order = ? WHERE id = ?')
  const batch = db.transaction((items: { id: string; sort_order: number }[]) => {
    for (const item of items) stmt.run(item.sort_order, item.id)
  })
  batch(updates)
}
