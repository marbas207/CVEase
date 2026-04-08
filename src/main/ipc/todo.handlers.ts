import { ipcMain } from 'electron'
import {
  listTodos,
  createTodo,
  createDefaultTodos,
  completeTodo,
  uncompleteTodo,
  deleteTodo
} from '../db/queries/todos'
import { validate } from './_validate'
import {
  CompleteTodoInput,
  TodoListArg,
  TodoCreateDefaultArg,
  TodoCreateArgs,
  TodoIdArg
} from '../../shared/schemas/todo'
import { IdString } from '../../shared/schemas/_common'

function ok<T>(data: T) { return { success: true, data } }
function err(error: unknown) { return { success: false, error: String(error) } }

export function registerTodoHandlers(): void {
  ipcMain.handle('todo:list', (_e, cveId: unknown) => {
    try {
      const parsed = validate(TodoListArg, cveId, 'todo:list')
      return ok(listTodos(parsed))
    } catch (e) { return err(e) }
  })

  ipcMain.handle('todo:createDefault', (_e, cveId: unknown) => {
    try {
      const parsed = validate(TodoCreateDefaultArg, cveId, 'todo:createDefault')
      return ok(createDefaultTodos(parsed))
    } catch (e) { return err(e) }
  })

  ipcMain.handle('todo:create', (_e, cveId: unknown, text: unknown, triggerStage: unknown) => {
    try {
      const [parsedCveId, parsedText, parsedStage] = validate(
        TodoCreateArgs,
        [cveId, text, triggerStage],
        'todo:create'
      )
      return ok(createTodo(parsedCveId, parsedText, parsedStage))
    } catch (e) { return err(e) }
  })

  ipcMain.handle('todo:complete', (_e, id: unknown, input: unknown) => {
    try {
      const parsedId = validate(IdString, id, 'todo:complete.id')
      const parsedInput = validate(CompleteTodoInput, input, 'todo:complete')
      return ok(completeTodo(parsedId, parsedInput))
    } catch (e) { return err(e) }
  })

  ipcMain.handle('todo:uncomplete', (_e, id: unknown) => {
    try {
      const parsed = validate(TodoIdArg, id, 'todo:uncomplete')
      return ok(uncompleteTodo(parsed))
    } catch (e) { return err(e) }
  })

  ipcMain.handle('todo:delete', (_e, id: unknown) => {
    try {
      const parsed = validate(TodoIdArg, id, 'todo:delete')
      deleteTodo(parsed)
      return ok(null)
    } catch (e) { return err(e) }
  })
}
