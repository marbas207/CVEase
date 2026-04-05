import { ipcMain } from 'electron'
import {
  listCVEs,
  listArchivedCVEs,
  listArchiveEligible,
  archiveCVE,
  getCVE,
  createCVE,
  updateCVE,
  moveCVE,
  reorderCVEs,
  deleteCVE,
  type CVEFilters,
  type CreateCVEInput,
  type UpdateCVEInput,
  type Stage
} from '../db/queries/cves'
import { deleteAttachmentsForCVE } from '../db/queries/attachments'

function ok<T>(data: T) { return { success: true, data } }
function err(error: unknown) { return { success: false, error: String(error) } }

export function registerCVEHandlers(): void {
  ipcMain.handle('cve:list', (_e, filters?: CVEFilters) => {
    try { return ok(listCVEs(filters)) } catch (e) { return err(e) }
  })

  ipcMain.handle('cve:get', (_e, id: string) => {
    try { return ok(getCVE(id)) } catch (e) { return err(e) }
  })

  ipcMain.handle('cve:create', (_e, data: CreateCVEInput) => {
    try { return ok(createCVE(data)) } catch (e) { return err(e) }
  })

  ipcMain.handle('cve:update', (_e, id: string, data: UpdateCVEInput) => {
    try { return ok(updateCVE(id, data)) } catch (e) { return err(e) }
  })

  ipcMain.handle('cve:move', (_e, id: string, newStage: Stage, newSwimlaneId: string, sortOrder: number) => {
    try { return ok(moveCVE(id, newStage, newSwimlaneId, sortOrder)) } catch (e) { return err(e) }
  })

  ipcMain.handle('cve:reorder', (_e, updates: { id: string; sort_order: number }[]) => {
    try { reorderCVEs(updates); return ok(null) } catch (e) { return err(e) }
  })

  ipcMain.handle('cve:listArchived', () => {
    try { return ok(listArchivedCVEs()) } catch (e) { return err(e) }
  })

  ipcMain.handle('cve:listArchiveEligible', () => {
    try { return ok(listArchiveEligible()) } catch (e) { return err(e) }
  })

  ipcMain.handle('cve:archive', (_e, id: string) => {
    try { return ok(archiveCVE(id)) } catch (e) { return err(e) }
  })

  ipcMain.handle('cve:delete', (_e, id: string) => {
    try {
      deleteAttachmentsForCVE(id)
      deleteCVE(id)
      return ok(null)
    } catch (e) { return err(e) }
  })
}
