import { ipcMain } from 'electron'
import {
  listTodos,
  createTodo,
  createDefaultTodos,
  completeTodo,
  uncompleteTodo,
  deleteTodo,
  type CompleteTodoInput
} from '../db/queries/todos'
import type { Stage } from '../db/queries/cves'

function ok<T>(data: T) { return { success: true, data } }
function err(error: unknown) { return { success: false, error: String(error) } }

export function registerTodoHandlers(): void {
  ipcMain.handle('todo:list', (_e, cveId: string) => {
    try { return ok(listTodos(cveId)) } catch (e) { return err(e) }
  })

  ipcMain.handle('todo:createDefault', (_e, cveId: string) => {
    try { return ok(createDefaultTodos(cveId)) } catch (e) { return err(e) }
  })

  ipcMain.handle('todo:create', (_e, cveId: string, text: string, triggerStage?: Stage) => {
    try { return ok(createTodo(cveId, text, triggerStage)) } catch (e) { return err(e) }
  })

  ipcMain.handle('todo:complete', (_e, id: string, input: CompleteTodoInput) => {
    try { return ok(completeTodo(id, input)) } catch (e) { return err(e) }
  })

  ipcMain.handle('todo:uncomplete', (_e, id: string) => {
    try { return ok(uncompleteTodo(id)) } catch (e) { return err(e) }
  })

  ipcMain.handle('todo:delete', (_e, id: string) => {
    try { deleteTodo(id); return ok(null) } catch (e) { return err(e) }
  })
}
