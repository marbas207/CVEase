import { ipcMain, dialog, shell } from 'electron'
import {
  listAttachments,
  importAttachment,
  deleteAttachment
} from '../db/queries/attachments'

function ok<T>(data: T) { return { success: true, data } }
function err(error: unknown) { return { success: false, error: String(error) } }

export function registerAttachmentHandlers(): void {
  ipcMain.handle('attachment:list', (_e, cveId: string) => {
    try { return ok(listAttachments(cveId)) } catch (e) { return err(e) }
  })

  ipcMain.handle('attachment:import', (_e, cveId: string, sourcePath: string) => {
    try { return ok(importAttachment(cveId, sourcePath)) } catch (e) { return err(e) }
  })

  ipcMain.handle('attachment:open', async (_e, id: string) => {
    try {
      const rows = listAttachments('') // We'll pass filepath directly
      void rows
      // id is actually the filepath in this variant — simpler approach
      await shell.openPath(id)
      return ok(null)
    } catch (e) { return err(e) }
  })

  ipcMain.handle('attachment:openPath', async (_e, filepath: string) => {
    try {
      await shell.openPath(filepath)
      return ok(null)
    } catch (e) { return err(e) }
  })

  ipcMain.handle('attachment:delete', (_e, id: string) => {
    try { deleteAttachment(id); return ok(null) } catch (e) { return err(e) }
  })

  ipcMain.handle('attachment:showPicker', async (event) => {
    const win = event.sender.getOwnerBrowserWindow()
    try {
      const result = await dialog.showOpenDialog(win!, {
        properties: ['openFile', 'multiSelections'],
        title: 'Select files to attach'
      })
      if (result.canceled) return ok([])
      return ok(result.filePaths)
    } catch (e) { return err(e) }
  })
}
