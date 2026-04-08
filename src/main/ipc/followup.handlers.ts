import { ipcMain } from 'electron'
import { listFollowUps, createFollowUp, deleteFollowUp } from '../db/queries/followups'
import { validate } from './_validate'
import {
  CreateFollowUpInput,
  FollowUpListArg,
  FollowUpDeleteArg
} from '../../shared/schemas/followup'
import { IdString } from '../../shared/schemas/_common'

function ok<T>(data: T) { return { success: true, data } }
function err(error: unknown) { return { success: false, error: String(error) } }

export function registerFollowUpHandlers(): void {
  ipcMain.handle('followup:list', (_e, cveId: unknown) => {
    try {
      const parsed = validate(FollowUpListArg, cveId, 'followup:list')
      return ok(listFollowUps(parsed))
    } catch (e) { return err(e) }
  })

  ipcMain.handle('followup:create', (_e, cveId: unknown, data: unknown) => {
    try {
      const parsedCveId = validate(IdString, cveId, 'followup:create.cveId')
      const parsedData = validate(CreateFollowUpInput, data, 'followup:create')
      return ok(createFollowUp(parsedCveId, parsedData))
    } catch (e) { return err(e) }
  })

  ipcMain.handle('followup:delete', (_e, id: unknown) => {
    try {
      const parsed = validate(FollowUpDeleteArg, id, 'followup:delete')
      deleteFollowUp(parsed)
      return ok(null)
    } catch (e) { return err(e) }
  })
}
