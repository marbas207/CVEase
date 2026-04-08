import { ipcMain } from 'electron'
import {
  listSwimlanes,
  createSwimlane,
  updateSwimlane,
  deleteSwimlane,
  setSwimlaneCollapsed
} from '../db/queries/swimlanes'
import { validate } from './_validate'
import {
  CreateSwimlaneInput,
  UpdateSwimlaneInput,
  SwimlaneIdArg,
  SetCollapsedArgs
} from '../../shared/schemas/swimlane'

function ok<T>(data: T) { return { success: true, data } }
function err(error: unknown) { return { success: false, error: String(error) } }

export function registerSwimlaneHandlers(): void {
  ipcMain.handle('swimlane:list', () => {
    try { return ok(listSwimlanes()) } catch (e) { return err(e) }
  })

  ipcMain.handle('swimlane:create', (_e, data: unknown) => {
    try {
      const parsed = validate(CreateSwimlaneInput, data, 'swimlane:create')
      return ok(createSwimlane(parsed))
    } catch (e) { return err(e) }
  })

  ipcMain.handle('swimlane:update', (_e, id: unknown, data: unknown) => {
    try {
      const parsedId = validate(SwimlaneIdArg, id, 'swimlane:update.id')
      const parsedData = validate(UpdateSwimlaneInput, data, 'swimlane:update')
      return ok(updateSwimlane(parsedId, parsedData))
    } catch (e) { return err(e) }
  })

  ipcMain.handle('swimlane:delete', (_e, id: unknown) => {
    try {
      const parsed = validate(SwimlaneIdArg, id, 'swimlane:delete')
      deleteSwimlane(parsed)
      return ok(null)
    } catch (e) { return err(e) }
  })

  ipcMain.handle('swimlane:setCollapsed', (_e, id: unknown, collapsed: unknown) => {
    try {
      const [parsedId, parsedCollapsed] = validate(
        SetCollapsedArgs,
        [id, collapsed],
        'swimlane:setCollapsed'
      )
      setSwimlaneCollapsed(parsedId, parsedCollapsed)
      return ok(null)
    } catch (e) { return err(e) }
  })
}
