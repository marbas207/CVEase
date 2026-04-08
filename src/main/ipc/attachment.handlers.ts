import { ipcMain, dialog, shell, app } from 'electron'
import { resolve, sep } from 'path'
import {
  listAttachments,
  importAttachment,
  deleteAttachment
} from '../db/queries/attachments'
import { validate } from './_validate'
import {
  AttachmentListArg,
  AttachmentImportArgs,
  AttachmentOpenPathArg,
  AttachmentDeleteArg
} from '../../shared/schemas/attachment'

function ok<T>(data: T) { return { success: true, data } }
function err(error: unknown) { return { success: false, error: String(error) } }

/**
 * Refuse to operate on any path outside of <userData>/attachments.
 * Returns the resolved (absolute, normalized) path on success.
 */
function assertInsideAttachmentsDir(filepath: unknown): string {
  if (typeof filepath !== 'string' || filepath.length === 0) {
    throw new Error('Invalid attachment path')
  }
  const root = resolve(app.getPath('userData'), 'attachments')
  const target = resolve(filepath)
  if (target !== root && !target.startsWith(root + sep)) {
    throw new Error('Refusing to access path outside attachments directory')
  }
  return target
}

export function registerAttachmentHandlers(): void {
  ipcMain.handle('attachment:list', (_e, cveId: unknown) => {
    try {
      const parsed = validate(AttachmentListArg, cveId, 'attachment:list')
      return ok(listAttachments(parsed))
    } catch (e) { return err(e) }
  })

  ipcMain.handle('attachment:import', (_e, cveId: unknown, sourcePath: unknown) => {
    try {
      const [parsedCveId, parsedPath] = validate(
        AttachmentImportArgs,
        [cveId, sourcePath],
        'attachment:import'
      )
      return ok(importAttachment(parsedCveId, parsedPath))
    } catch (e) { return err(e) }
  })

  ipcMain.handle('attachment:openPath', async (_e, filepath: unknown) => {
    try {
      // Schema confirms it's a non-empty string; the path-traversal check
      // below is the actual security boundary.
      const parsed = validate(AttachmentOpenPathArg, filepath, 'attachment:openPath')
      const safe = assertInsideAttachmentsDir(parsed)
      const result = await shell.openPath(safe)
      // shell.openPath returns '' on success and an error string on failure
      if (result) throw new Error(result)
      return ok(null)
    } catch (e) { return err(e) }
  })

  ipcMain.handle('attachment:delete', (_e, id: unknown) => {
    try {
      const parsed = validate(AttachmentDeleteArg, id, 'attachment:delete')
      deleteAttachment(parsed)
      return ok(null)
    } catch (e) { return err(e) }
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
