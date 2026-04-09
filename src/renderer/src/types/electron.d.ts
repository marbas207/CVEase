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
} from './cve'

interface IpcResult<T> {
  success: boolean
  data?: T
  error?: string
}

interface WindowApi {
  cve: {
    list(filters?: CVEFilters): Promise<IpcResult<CVE[]>>
    get(id: string): Promise<IpcResult<CVE | null>>
    create(data: CreateCVEInput): Promise<IpcResult<CVE>>
    update(id: string, data: UpdateCVEInput): Promise<IpcResult<CVE>>
    move(id: string, newStage: Stage, newSwimlaneId: string, sortOrder: number): Promise<IpcResult<CVE>>
    reorder(updates: { id: string; sort_order: number }[]): Promise<IpcResult<null>>
    delete(id: string): Promise<IpcResult<null>>
    listArchived(): Promise<IpcResult<CVE[]>>
    listArchiveEligible(): Promise<IpcResult<CVE[]>>
    archive(id: string): Promise<IpcResult<CVE>>
    backdateStage(id: string, isoTimestamp: string): Promise<IpcResult<null>>
  }
  swimlane: {
    list(): Promise<IpcResult<Swimlane[]>>
    create(data: { software_name: string; vendor: string; version_affected?: string; url?: string }): Promise<IpcResult<Swimlane>>
    update(id: string, data: Partial<Omit<Swimlane, 'id' | 'created_at' | 'updated_at' | 'sort_order' | 'collapsed'>>): Promise<IpcResult<Swimlane>>
    delete(id: string): Promise<IpcResult<null>>
    setCollapsed(id: string, collapsed: boolean): Promise<IpcResult<null>>
  }
  todo: {
    list(cveId: string): Promise<IpcResult<Todo[]>>
    createDefault(cveId: string): Promise<IpcResult<Todo[]>>
    create(cveId: string, text: string, triggerStage?: Stage): Promise<IpcResult<Todo>>
    complete(id: string, input: { completion_note?: string }): Promise<IpcResult<Todo>>
    uncomplete(id: string): Promise<IpcResult<Todo>>
    delete(id: string): Promise<IpcResult<null>>
  }
  followup: {
    list(cveId: string): Promise<IpcResult<FollowUp[]>>
    create(cveId: string, data: { type?: string; note: string; occurred_at?: string }): Promise<IpcResult<FollowUp>>
    delete(id: string): Promise<IpcResult<null>>
  }
  checklistTemplate: {
    list(): Promise<IpcResult<ChecklistTemplateItem[]>>
    create(text: string, sortOrder: number): Promise<IpcResult<ChecklistTemplateItem>>
    update(id: string, text: string): Promise<IpcResult<ChecklistTemplateItem>>
    delete(id: string): Promise<IpcResult<null>>
    reorder(updates: { id: string; sort_order: number }[]): Promise<IpcResult<null>>
  }
  vendor: {
    list(): Promise<IpcResult<Vendor[]>>
    get(id: string): Promise<IpcResult<Vendor | null>>
    create(data: { name: string; security_contact_name?: string; security_contact_email?: string; security_contact_other?: string; is_cna?: boolean; has_bounty_program?: boolean; bounty_program_url?: string; url?: string; notes?: string }): Promise<IpcResult<Vendor>>
    update(id: string, data: Partial<Omit<Vendor, 'id' | 'created_at' | 'updated_at'>>): Promise<IpcResult<Vendor>>
    delete(id: string): Promise<IpcResult<null>>
  }
  db: {
    backup(): Promise<IpcResult<string | null>>
    restore(): Promise<IpcResult<string | null>>
  }
  attachment: {
    list(cveId: string): Promise<IpcResult<Attachment[]>>
    import(cveId: string, sourcePath: string): Promise<IpcResult<Attachment>>
    openPath(filepath: string): Promise<IpcResult<null>>
    delete(id: string): Promise<IpcResult<null>>
    showPicker(): Promise<IpcResult<string[]>>
  }
  events: {
    onOpenCVE(handler: (cveId: string) => void): () => void
  }
}

declare global {
  interface Window {
    api: WindowApi
  }
}
