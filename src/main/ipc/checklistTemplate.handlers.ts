import { ipcMain } from 'electron'
import {
  listTemplateItems,
  createTemplateItem,
  updateTemplateItem,
  deleteTemplateItem,
  reorderTemplateItems
} from '../db/queries/checklistTemplate'

export function registerChecklistTemplateHandlers(): void {
  ipcMain.handle('checklistTemplate:list', () => {
    try { return { success: true, data: listTemplateItems() } }
    catch (e) { return { success: false, error: String(e) } }
  })

  ipcMain.handle('checklistTemplate:create', (_e, text: string, sortOrder: number) => {
    try { return { success: true, data: createTemplateItem(text, sortOrder) } }
    catch (e) { return { success: false, error: String(e) } }
  })

  ipcMain.handle('checklistTemplate:update', (_e, id: string, text: string) => {
    try { return { success: true, data: updateTemplateItem(id, text) } }
    catch (e) { return { success: false, error: String(e) } }
  })

  ipcMain.handle('checklistTemplate:delete', (_e, id: string) => {
    try { deleteTemplateItem(id); return { success: true, data: null } }
    catch (e) { return { success: false, error: String(e) } }
  })

  ipcMain.handle('checklistTemplate:reorder', (_e, updates: { id: string; sort_order: number }[]) => {
    try { reorderTemplateItems(updates); return { success: true, data: null } }
    catch (e) { return { success: false, error: String(e) } }
  })
}
