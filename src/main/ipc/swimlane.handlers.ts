import { ipcMain } from 'electron'
import {
  listSwimlanes,
  createSwimlane,
  updateSwimlane,
  deleteSwimlane,
  setSwimlaneCollapsed,
  type CreateSwimlaneInput,
  type UpdateSwimlaneInput
} from '../db/queries/swimlanes'

function ok<T>(data: T) { return { success: true, data } }
function err(error: unknown) { return { success: false, error: String(error) } }

export function registerSwimlaneHandlers(): void {
  ipcMain.handle('swimlane:list', () => {
    try { return ok(listSwimlanes()) } catch (e) { return err(e) }
  })

  ipcMain.handle('swimlane:create', (_e, data: CreateSwimlaneInput) => {
    try { return ok(createSwimlane(data)) } catch (e) { return err(e) }
  })

  ipcMain.handle('swimlane:update', (_e, id: string, data: UpdateSwimlaneInput) => {
    try { return ok(updateSwimlane(id, data)) } catch (e) { return err(e) }
  })

  ipcMain.handle('swimlane:delete', (_e, id: string) => {
    try { deleteSwimlane(id); return ok(null) } catch (e) { return err(e) }
  })

  ipcMain.handle('swimlane:setCollapsed', (_e, id: string, collapsed: boolean) => {
    try { setSwimlaneCollapsed(id, collapsed); return ok(null) } catch (e) { return err(e) }
  })
}
