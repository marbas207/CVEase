import { ipcMain } from 'electron'
import {
  listTemplateItems,
  createTemplateItem,
  updateTemplateItem,
  deleteTemplateItem,
  reorderTemplateItems
} from '../db/queries/checklistTemplate'
import { validate } from './_validate'
import {
  TemplateCreateArgs,
  TemplateUpdateArgs,
  TemplateDeleteArg,
  TemplateReorderInput
} from '../../shared/schemas/checklistTemplate'

function ok<T>(data: T) { return { success: true, data } }
function err(error: unknown) { return { success: false, error: String(error) } }

export function registerChecklistTemplateHandlers(): void {
  ipcMain.handle('checklistTemplate:list', () => {
    try { return ok(listTemplateItems()) } catch (e) { return err(e) }
  })

  ipcMain.handle('checklistTemplate:create', (_e, text: unknown, sortOrder: unknown) => {
    try {
      const [parsedText, parsedOrder] = validate(
        TemplateCreateArgs,
        [text, sortOrder],
        'checklistTemplate:create'
      )
      return ok(createTemplateItem(parsedText, parsedOrder))
    } catch (e) { return err(e) }
  })

  ipcMain.handle('checklistTemplate:update', (_e, id: unknown, text: unknown) => {
    try {
      const [parsedId, parsedText] = validate(
        TemplateUpdateArgs,
        [id, text],
        'checklistTemplate:update'
      )
      return ok(updateTemplateItem(parsedId, parsedText))
    } catch (e) { return err(e) }
  })

  ipcMain.handle('checklistTemplate:delete', (_e, id: unknown) => {
    try {
      const parsed = validate(TemplateDeleteArg, id, 'checklistTemplate:delete')
      deleteTemplateItem(parsed)
      return ok(null)
    } catch (e) { return err(e) }
  })

  ipcMain.handle('checklistTemplate:reorder', (_e, updates: unknown) => {
    try {
      const parsed = validate(TemplateReorderInput, updates, 'checklistTemplate:reorder')
      reorderTemplateItems(parsed)
      return ok(null)
    } catch (e) { return err(e) }
  })
}
