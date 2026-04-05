import { ipcMain } from 'electron'
import {
  listFollowUps,
  createFollowUp,
  deleteFollowUp,
  type CreateFollowUpInput
} from '../db/queries/followups'

function ok<T>(data: T) { return { success: true, data } }
function err(error: unknown) { return { success: false, error: String(error) } }

export function registerFollowUpHandlers(): void {
  ipcMain.handle('followup:list', (_e, cveId: string) => {
    try { return ok(listFollowUps(cveId)) } catch (e) { return err(e) }
  })

  ipcMain.handle('followup:create', (_e, cveId: string, data: CreateFollowUpInput) => {
    try { return ok(createFollowUp(cveId, data)) } catch (e) { return err(e) }
  })

  ipcMain.handle('followup:delete', (_e, id: string) => {
    try { deleteFollowUp(id); return ok(null) } catch (e) { return err(e) }
  })
}
