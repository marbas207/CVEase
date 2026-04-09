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
  deleteCVE
} from '../db/queries/cves'
import { deleteAttachmentsForCVE } from '../db/queries/attachments'
import { backdateLatestStage } from '../db/queries/stageHistory'
import { validate } from './_validate'
import {
  CreateCVEInput,
  UpdateCVEInput,
  CVEFilters,
  CveIdArg,
  MoveCVEArgs,
  ReorderCVEsInput,
  BackdateStageArgs
} from '../../shared/schemas/cve'

function ok<T>(data: T) { return { success: true, data } }
function err(error: unknown) { return { success: false, error: String(error) } }

export function registerCVEHandlers(): void {
  ipcMain.handle('cve:list', (_e, filters?: unknown) => {
    try {
      const parsed = validate(CVEFilters, filters, 'cve:list')
      return ok(listCVEs(parsed))
    } catch (e) { return err(e) }
  })

  ipcMain.handle('cve:get', (_e, id: unknown) => {
    try {
      const parsed = validate(CveIdArg, id, 'cve:get')
      return ok(getCVE(parsed))
    } catch (e) { return err(e) }
  })

  ipcMain.handle('cve:create', (_e, data: unknown) => {
    try {
      const parsed = validate(CreateCVEInput, data, 'cve:create')
      return ok(createCVE(parsed))
    } catch (e) { return err(e) }
  })

  ipcMain.handle('cve:update', (_e, id: unknown, data: unknown) => {
    try {
      const parsedId = validate(CveIdArg, id, 'cve:update.id')
      const parsedData = validate(UpdateCVEInput, data, 'cve:update')
      return ok(updateCVE(parsedId, parsedData))
    } catch (e) { return err(e) }
  })

  ipcMain.handle('cve:move', (_e, id: unknown, newStage: unknown, newSwimlaneId: unknown, sortOrder: unknown) => {
    try {
      const [parsedId, parsedStage, parsedLane, parsedOrder] = validate(
        MoveCVEArgs,
        [id, newStage, newSwimlaneId, sortOrder],
        'cve:move'
      )
      return ok(moveCVE(parsedId, parsedStage, parsedLane, parsedOrder))
    } catch (e) { return err(e) }
  })

  ipcMain.handle('cve:reorder', (_e, updates: unknown) => {
    try {
      const parsed = validate(ReorderCVEsInput, updates, 'cve:reorder')
      reorderCVEs(parsed)
      return ok(null)
    } catch (e) { return err(e) }
  })

  ipcMain.handle('cve:listArchived', () => {
    try { return ok(listArchivedCVEs()) } catch (e) { return err(e) }
  })

  ipcMain.handle('cve:listArchiveEligible', () => {
    try { return ok(listArchiveEligible()) } catch (e) { return err(e) }
  })

  ipcMain.handle('cve:archive', (_e, id: unknown) => {
    try {
      const parsed = validate(CveIdArg, id, 'cve:archive')
      return ok(archiveCVE(parsed))
    } catch (e) { return err(e) }
  })

  // Demo-data helper: rewrite the most recent stage history row's timestamp
  // so seeded CVEs can show realistic time-in-stage values without faking a
  // multi-month workflow at runtime. Validated like every other handler so
  // it can't be abused with garbage input even though it's only called from
  // the demo loader.
  ipcMain.handle('cve:backdateStage', (_e, id: unknown, isoTimestamp: unknown) => {
    try {
      const [parsedId, parsedTs] = validate(BackdateStageArgs, [id, isoTimestamp], 'cve:backdateStage')
      backdateLatestStage(parsedId, parsedTs)
      return ok(null)
    } catch (e) { return err(e) }
  })

  ipcMain.handle('cve:delete', (_e, id: unknown) => {
    try {
      const parsed = validate(CveIdArg, id, 'cve:delete')
      deleteAttachmentsForCVE(parsed)
      deleteCVE(parsed)
      return ok(null)
    } catch (e) { return err(e) }
  })
}
