import { ipcMain, dialog, app, BrowserWindow } from 'electron'
import { join } from 'path'
import { openSync, readSync, closeSync, existsSync } from 'fs'
import {
  backupDatabase,
  restoreDatabase,
  purgeCVEData,
  purgeAllUserData
} from '../db/database'

// SQLite database files start with this 16-byte magic header.
const SQLITE_MAGIC = 'SQLite format 3\u0000'

function isSqliteFile(path: string): boolean {
  let fd: number | null = null
  try {
    fd = openSync(path, 'r')
    const buf = Buffer.alloc(16)
    const bytes = readSync(fd, buf, 0, 16, 0)
    if (bytes < 16) return false
    return buf.toString('binary') === SQLITE_MAGIC
  } catch {
    return false
  } finally {
    if (fd !== null) {
      try { closeSync(fd) } catch { /* ignore */ }
    }
  }
}

export function registerDbHandlers(): void {
  ipcMain.handle('db:backup', async (event) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender) ?? undefined
      const result = await dialog.showSaveDialog(win!, {
        title: 'Backup Database',
        defaultPath: `cveorganizer-backup-${new Date().toISOString().slice(0, 10)}.db`,
        filters: [{ name: 'SQLite Database', extensions: ['db'] }]
      })
      if (result.canceled || !result.filePath) {
        return { success: true, data: null }
      }
      backupDatabase(result.filePath)
      return { success: true, data: result.filePath }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  ipcMain.handle('db:restore', async (event) => {
    try {
      const win = BrowserWindow.fromWebContents(event.sender) ?? undefined

      const picked = await dialog.showOpenDialog(win!, {
        title: 'Restore Database from Backup',
        filters: [{ name: 'SQLite Database', extensions: ['db'] }],
        properties: ['openFile']
      })
      if (picked.canceled || picked.filePaths.length === 0) {
        return { success: true, data: null }
      }

      const sourcePath = picked.filePaths[0]
      if (!existsSync(sourcePath)) {
        return { success: false, error: 'Selected file does not exist.' }
      }
      if (!isSqliteFile(sourcePath)) {
        return {
          success: false,
          error: 'Selected file is not a valid SQLite database.'
        }
      }

      const confirm = await dialog.showMessageBox(win!, {
        type: 'warning',
        buttons: ['Cancel', 'Restore'],
        defaultId: 0,
        cancelId: 0,
        title: 'Confirm restore',
        message: 'Replace your current database with this backup?',
        detail:
          `Source: ${sourcePath}\n\n` +
          'Your current database will be saved to a safety backup before being replaced. ' +
          'This action cannot be undone from inside the app.'
      })
      if (confirm.response !== 1) {
        return { success: true, data: null }
      }

      // Take a pre-restore safety backup so the user has an undo path.
      const stamp = new Date().toISOString().replace(/[:.]/g, '-')
      const safetyBackup = join(
        app.getPath('userData'),
        `cveorganizer-pre-restore-${stamp}.db`
      )
      try {
        backupDatabase(safetyBackup)
      } catch (e) {
        return {
          success: false,
          error: `Aborted: failed to take safety backup (${String(e)})`
        }
      }

      restoreDatabase(sourcePath)
      return { success: true, data: sourcePath }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })

  // Shared helper for both purge variants. Writes a timestamped safety
  // backup, runs `action`, and returns either the backup path on success
  // or a structured error. The renderer enforces type-to-confirm UX before
  // even getting here, so we don't second-guess the action at the IPC layer.
  const runWithSafetyBackup = (
    label: string,
    action: () => void
  ): { success: true; data: string } | { success: false; error: string } => {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const safetyBackup = join(
      app.getPath('userData'),
      `cveorganizer-pre-${label}-${stamp}.db`
    )
    try {
      backupDatabase(safetyBackup)
    } catch (e) {
      return {
        success: false,
        error: `Aborted: failed to take safety backup (${String(e)})`
      }
    }
    try {
      action()
    } catch (e) {
      return {
        success: false,
        error: `Purge failed (safety backup at ${safetyBackup}): ${String(e)}`
      }
    }
    return { success: true, data: safetyBackup }
  }

  ipcMain.handle('db:purgeCVEData', () => {
    return runWithSafetyBackup('purge-cves', purgeCVEData)
  })

  ipcMain.handle('db:purgeAll', () => {
    return runWithSafetyBackup('purge-all', purgeAllUserData)
  })
}
