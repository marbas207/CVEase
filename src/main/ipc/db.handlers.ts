import { ipcMain, dialog } from 'electron'
import { backupDatabase, restoreDatabase } from '../db/database'

export function registerDbHandlers(): void {
  ipcMain.handle('db:backup', async () => {
    try {
      const result = await dialog.showSaveDialog({
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

  ipcMain.handle('db:restore', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Restore Database from Backup',
        filters: [{ name: 'SQLite Database', extensions: ['db'] }],
        properties: ['openFile']
      })
      if (result.canceled || result.filePaths.length === 0) {
        return { success: true, data: null }
      }
      restoreDatabase(result.filePaths[0])
      return { success: true, data: result.filePaths[0] }
    } catch (e) {
      return { success: false, error: String(e) }
    }
  })
}
