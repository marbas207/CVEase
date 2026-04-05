// Typed wrappers that unwrap the IPC envelope and throw on error

import type {
  CVE,
  Vendor,
  Swimlane,
  FollowUp,
  Todo,
  ChecklistTemplateItem,
  Attachment,
  CreateCVEInput,
  UpdateCVEInput,
  CVEFilters,
  Stage
} from '../types/cve'

async function unwrap<T>(promise: Promise<{ success: boolean; data?: T; error?: string }>): Promise<T> {
  const result = await promise
  if (!result.success) throw new Error(result.error ?? 'Unknown error')
  return result.data as T
}

export const api = {
  cve: {
    list: (filters?: CVEFilters) => unwrap<CVE[]>(window.api.cve.list(filters)),
    get: (id: string) => unwrap<CVE | null>(window.api.cve.get(id)),
    create: (data: CreateCVEInput) => unwrap<CVE>(window.api.cve.create(data)),
    update: (id: string, data: UpdateCVEInput) => unwrap<CVE>(window.api.cve.update(id, data)),
    move: (id: string, newStage: Stage, newSwimlaneId: string, sortOrder: number) =>
      unwrap<CVE>(window.api.cve.move(id, newStage, newSwimlaneId, sortOrder)),
    reorder: (updates: { id: string; sort_order: number }[]) =>
      unwrap<null>(window.api.cve.reorder(updates)),
    delete: (id: string) => unwrap<null>(window.api.cve.delete(id)),
    listArchived: () => unwrap<CVE[]>(window.api.cve.listArchived()),
    listArchiveEligible: () => unwrap<CVE[]>(window.api.cve.listArchiveEligible()),
    archive: (id: string) => unwrap<CVE>(window.api.cve.archive(id))
  },
  swimlane: {
    list: () => unwrap<Swimlane[]>(window.api.swimlane.list()),
    create: (data: Parameters<typeof window.api.swimlane.create>[0]) =>
      unwrap<Swimlane>(window.api.swimlane.create(data)),
    update: (id: string, data: Parameters<typeof window.api.swimlane.update>[1]) =>
      unwrap<Swimlane>(window.api.swimlane.update(id, data)),
    delete: (id: string) => unwrap<null>(window.api.swimlane.delete(id)),
    setCollapsed: (id: string, collapsed: boolean) =>
      unwrap<null>(window.api.swimlane.setCollapsed(id, collapsed))
  },
  todo: {
    list: (cveId: string) => unwrap<Todo[]>(window.api.todo.list(cveId)),
    createDefault: (cveId: string) => unwrap<Todo[]>(window.api.todo.createDefault(cveId)),
    create: (cveId: string, text: string, triggerStage?: Stage) =>
      unwrap<Todo>(window.api.todo.create(cveId, text, triggerStage)),
    complete: (id: string, input: { completion_note?: string }) =>
      unwrap<Todo>(window.api.todo.complete(id, input)),
    uncomplete: (id: string) => unwrap<Todo>(window.api.todo.uncomplete(id)),
    delete: (id: string) => unwrap<null>(window.api.todo.delete(id))
  },
  followup: {
    list: (cveId: string) => unwrap<FollowUp[]>(window.api.followup.list(cveId)),
    create: (cveId: string, data: { type?: string; note: string; occurred_at?: string }) =>
      unwrap<FollowUp>(window.api.followup.create(cveId, data)),
    delete: (id: string) => unwrap<null>(window.api.followup.delete(id))
  },
  checklistTemplate: {
    list: () => unwrap<ChecklistTemplateItem[]>(window.api.checklistTemplate.list()),
    create: (text: string, sortOrder: number) => unwrap<ChecklistTemplateItem>(window.api.checklistTemplate.create(text, sortOrder)),
    update: (id: string, text: string) => unwrap<ChecklistTemplateItem>(window.api.checklistTemplate.update(id, text)),
    delete: (id: string) => unwrap<null>(window.api.checklistTemplate.delete(id)),
    reorder: (updates: { id: string; sort_order: number }[]) => unwrap<null>(window.api.checklistTemplate.reorder(updates))
  },
  vendor: {
    list: () => unwrap<Vendor[]>(window.api.vendor.list()),
    get: (id: string) => unwrap<Vendor | null>(window.api.vendor.get(id)),
    create: (data: Parameters<typeof window.api.vendor.create>[0]) =>
      unwrap<Vendor>(window.api.vendor.create(data)),
    update: (id: string, data: Parameters<typeof window.api.vendor.update>[1]) =>
      unwrap<Vendor>(window.api.vendor.update(id, data)),
    delete: (id: string) => unwrap<null>(window.api.vendor.delete(id))
  },
  db: {
    backup: () => unwrap<string | null>(window.api.db.backup()),
    restore: () => unwrap<string | null>(window.api.db.restore())
  },
  attachment: {
    list: (cveId: string) => unwrap<Attachment[]>(window.api.attachment.list(cveId)),
    import: (cveId: string, sourcePath: string) =>
      unwrap<Attachment>(window.api.attachment.import(cveId, sourcePath)),
    openPath: (filepath: string) => unwrap<null>(window.api.attachment.openPath(filepath)),
    delete: (id: string) => unwrap<null>(window.api.attachment.delete(id)),
    showPicker: () => unwrap<string[]>(window.api.attachment.showPicker())
  }
}
