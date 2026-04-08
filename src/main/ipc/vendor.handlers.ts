import { ipcMain } from 'electron'
import {
  listVendors,
  getVendor,
  createVendor,
  updateVendor,
  deleteVendor
} from '../db/queries/vendors'
import { validate } from './_validate'
import {
  CreateVendorInput,
  UpdateVendorInput,
  VendorIdArg
} from '../../shared/schemas/vendor'

function ok<T>(data: T) { return { success: true, data } }
function err(error: unknown) { return { success: false, error: String(error) } }

export function registerVendorHandlers(): void {
  ipcMain.handle('vendor:list', () => {
    try { return ok(listVendors()) } catch (e) { return err(e) }
  })

  ipcMain.handle('vendor:get', (_e, id: unknown) => {
    try {
      const parsed = validate(VendorIdArg, id, 'vendor:get')
      return ok(getVendor(parsed))
    } catch (e) { return err(e) }
  })

  ipcMain.handle('vendor:create', (_e, data: unknown) => {
    try {
      const parsed = validate(CreateVendorInput, data, 'vendor:create')
      return ok(createVendor(parsed))
    } catch (e) { return err(e) }
  })

  ipcMain.handle('vendor:update', (_e, id: unknown, data: unknown) => {
    try {
      const parsedId = validate(VendorIdArg, id, 'vendor:update.id')
      const parsedData = validate(UpdateVendorInput, data, 'vendor:update')
      return ok(updateVendor(parsedId, parsedData))
    } catch (e) { return err(e) }
  })

  ipcMain.handle('vendor:delete', (_e, id: unknown) => {
    try {
      const parsed = validate(VendorIdArg, id, 'vendor:delete')
      deleteVendor(parsed)
      return ok(null)
    } catch (e) { return err(e) }
  })
}
