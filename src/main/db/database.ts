import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { copyFileSync, rmSync } from 'fs'
import { runMigrations } from './migrations'

let db: Database.Database | null = null

function getDbPath(): string {
  return join(app.getPath('userData'), 'cveorganizer.db')
}

export function initDatabase(): void {
  const dbPath = getDbPath()
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  runMigrations(db)
}

export function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.')
  return db
}

export function backupDatabase(destPath: string): void {
  const currentDb = getDb()
  // Checkpoint WAL to ensure the backup has all data
  currentDb.pragma('wal_checkpoint(TRUNCATE)')
  copyFileSync(getDbPath(), destPath)
}

export function restoreDatabase(sourcePath: string): void {
  if (db) {
    db.close()
    db = null
  }
  copyFileSync(sourcePath, getDbPath())
  initDatabase()
}

/**
 * Wipe every attachment file under userData/attachments. Used by both purge
 * variants — the DB rows go away via FK cascade, but the actual files on
 * disk would otherwise be orphaned.
 */
function wipeAttachmentsDir(): void {
  const dir = join(app.getPath('userData'), 'attachments')
  try {
    rmSync(dir, { recursive: true, force: true })
  } catch {
    // Directory may not exist (no attachments ever imported) — fine.
  }
}

/**
 * Delete all CVEs and their dependents, leaving vendors / swimlanes /
 * checklist template intact. Cascades through followups, todos, and
 * attachments via the schema's ON DELETE CASCADE. Also wipes the on-disk
 * attachment files since the DB rows alone would leave orphans.
 *
 * Runs inside a transaction so a partial failure doesn't leave the DB
 * inconsistent.
 */
export function purgeCVEData(): void {
  const d = getDb()
  const tx = d.transaction(() => {
    d.exec('DELETE FROM cves')
  })
  tx()
  wipeAttachmentsDir()
}

/**
 * Wipe everything user-created — CVEs, swimlanes, vendors. Keeps the
 * checklist template (which the user may have customised) and the
 * schema_version table (so we don't re-run migrations on next launch).
 */
export function purgeAllUserData(): void {
  const d = getDb()
  const tx = d.transaction(() => {
    // cves cascades through followups/todos/attachments; swimlanes cascades
    // through cves; we still issue each delete explicitly so the intent is
    // obvious in a logfile or git blame.
    d.exec('DELETE FROM cves')
    d.exec('DELETE FROM swimlanes')
    d.exec('DELETE FROM vendors')
  })
  tx()
  wipeAttachmentsDir()
}
