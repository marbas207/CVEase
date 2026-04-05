import { ipcMain } from 'electron'
import {
  listVendors,
  getVendor,
  createVendor,
  updateVendor,
  deleteVendor,
  type CreateVendorInput,
  type UpdateVendorInput
} from '../db/queries/vendors'

export function registerVendorHandlers(): void {
  ipcMain.handle('vendor:list', () => {
    try { return { success: true, data: listVendors() } }
    catch (e) { return { success: false, error: String(e) } }
  })

  ipcMain.handle('vendor:get', (_e, id: string) => {
    try { return { success: true, data: getVendor(id) } }
    catch (e) { return { success: false, error: String(e) } }
  })

  ipcMain.handle('vendor:create', (_e, data: CreateVendorInput) => {
    try { return { success: true, data: createVendor(data) } }
    catch (e) { return { success: false, error: String(e) } }
  })

  ipcMain.handle('vendor:update', (_e, id: string, data: UpdateVendorInput) => {
    try { return { success: true, data: updateVendor(id, data) } }
    catch (e) { return { success: false, error: String(e) } }
  })

  ipcMain.handle('vendor:delete', (_e, id: string) => {
    try { deleteVendor(id); return { success: true, data: null } }
    catch (e) { return { success: false, error: String(e) } }
  })
}
