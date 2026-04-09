import { registerCVEHandlers } from './cve.handlers'
import { registerSwimlaneHandlers } from './swimlane.handlers'
import { registerFollowUpHandlers } from './followup.handlers'
import { registerAttachmentHandlers } from './attachment.handlers'
import { registerTodoHandlers } from './todo.handlers'
import { registerDbHandlers } from './db.handlers'
import { registerVendorHandlers } from './vendor.handlers'
import { registerChecklistTemplateHandlers } from './checklistTemplate.handlers'

export function registerAllHandlers(): void {
  registerCVEHandlers()
  registerSwimlaneHandlers()
  registerFollowUpHandlers()
  registerAttachmentHandlers()
  registerTodoHandlers()
  registerDbHandlers()
  registerVendorHandlers()
  registerChecklistTemplateHandlers()
}
