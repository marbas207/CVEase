import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { copyFileSync } from 'fs'
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
