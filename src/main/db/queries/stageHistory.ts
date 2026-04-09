import { getDb } from '../database'
import { v4 as uuidv4 } from 'uuid'
import type { Stage } from './cves'

export interface StageHistoryRow {
  id: string
  cve_id: string
  stage: Stage
  changed_at: string
}

/**
 * Append a new stage history row. Called from updateCVE / moveCVE whenever
 * the stage actually changes (not on every save).
 *
 * Uses millisecond precision (`%f`) instead of `datetime('now')`'s second
 * precision so multiple transitions in the same second don't tie. Tied
 * timestamps broke `getLatestStageTransition` and the demo backdate logic
 * because `ORDER BY changed_at DESC LIMIT 1` returned an arbitrary row
 * among the ties.
 */
export function recordStageTransition(cveId: string, stage: Stage): void {
  getDb()
    .prepare("INSERT INTO cve_stage_history (id, cve_id, stage, changed_at) VALUES (?, ?, ?, strftime('%Y-%m-%d %H:%M:%f', 'now'))")
    .run(uuidv4(), cveId, stage)
}

/**
 * Return the most recent stage transition for a CVE, or undefined if none
 * exist (shouldn't happen post-migration, but defensive).
 */
export function getLatestStageTransition(cveId: string): StageHistoryRow | undefined {
  return getDb()
    .prepare(
      'SELECT id, cve_id, stage, changed_at FROM cve_stage_history WHERE cve_id = ? ORDER BY changed_at DESC LIMIT 1'
    )
    .get(cveId) as StageHistoryRow | undefined
}

/**
 * Overwrite the `changed_at` of the most recent transition INTO a CVE's
 * current stage. Used by demo data seeding to give CVEs realistic
 * time-in-stage values without having to fake a multi-month workflow at
 * runtime. Not used by normal application code paths.
 *
 * Looks up the row by current-stage-of-the-CVE rather than by global MAX
 * timestamp because the latter is unreliable when multiple transitions
 * happen with tied timestamps (the demo seeder hits this constantly —
 * three move calls within the same DB tick).
 */
export function backdateLatestStage(cveId: string, isoTimestamp: string): void {
  const db = getDb()
  const cve = db.prepare('SELECT stage FROM cves WHERE id = ?').get(cveId) as { stage: Stage } | undefined
  if (!cve) return
  const row = db
    .prepare(
      'SELECT id FROM cve_stage_history WHERE cve_id = ? AND stage = ? ORDER BY changed_at DESC LIMIT 1'
    )
    .get(cveId, cve.stage) as { id: string } | undefined
  if (!row) return
  db.prepare('UPDATE cve_stage_history SET changed_at = ? WHERE id = ?').run(isoTimestamp, row.id)
}

/**
 * Return all stage transitions for a CVE, oldest first. Used by the detail
 * panel timeline and any future analytics.
 */
export function listStageHistory(cveId: string): StageHistoryRow[] {
  return getDb()
    .prepare(
      'SELECT id, cve_id, stage, changed_at FROM cve_stage_history WHERE cve_id = ? ORDER BY changed_at ASC'
    )
    .all(cveId) as StageHistoryRow[]
}
