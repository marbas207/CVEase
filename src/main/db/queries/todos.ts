import { getDb } from '../database'
import { v4 as uuidv4 } from 'uuid'
import type { Stage } from './cves'
import { listTemplateItems } from './checklistTemplate'

export interface TodoRow {
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

export interface CompleteTodoInput {
  completion_note?: string
}

export function listTodos(cveId: string): TodoRow[] {
  return getDb()
    .prepare('SELECT * FROM todos WHERE cve_id = ? ORDER BY sort_order ASC')
    .all(cveId) as TodoRow[]
}

export function createDefaultTodos(cveId: string): TodoRow[] {
  const db = getDb()
  const template = listTemplateItems()
  const stmt = db.prepare(`
    INSERT INTO todos (id, cve_id, text, trigger_stage, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `)
  const insertAll = db.transaction(() => {
    template.forEach((t, i) => {
      stmt.run(uuidv4(), cveId, t.text, t.trigger_stage ?? null, i)
    })
  })
  insertAll()
  return listTodos(cveId)
}

export function createTodo(cveId: string, text: string, triggerStage?: Stage): TodoRow {
  const db = getDb()
  const id = uuidv4()
  const maxOrder = (db.prepare('SELECT MAX(sort_order) as m FROM todos WHERE cve_id = ?').get(cveId) as { m: number | null }).m ?? -1
  db.prepare('INSERT INTO todos (id, cve_id, text, trigger_stage, sort_order) VALUES (?, ?, ?, ?, ?)')
    .run(id, cveId, text, triggerStage ?? null, maxOrder + 1)
  return db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as TodoRow
}

export function completeTodo(id: string, input: CompleteTodoInput): TodoRow {
  const db = getDb()
  db.prepare(`
    UPDATE todos SET completed = 1, completed_at = datetime('now'), completion_note = ? WHERE id = ?
  `).run(input.completion_note ?? null, id)
  return db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as TodoRow
}

export function uncompleteTodo(id: string): TodoRow {
  const db = getDb()
  db.prepare('UPDATE todos SET completed = 0, completed_at = NULL, completion_note = NULL WHERE id = ?').run(id)
  return db.prepare('SELECT * FROM todos WHERE id = ?').get(id) as TodoRow
}

export function deleteTodo(id: string): void {
  getDb().prepare('DELETE FROM todos WHERE id = ?').run(id)
}
