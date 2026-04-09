import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  cve: {
    list: (filters?: unknown) => ipcRenderer.invoke('cve:list', filters),
    get: (id: string) => ipcRenderer.invoke('cve:get', id),
    create: (data: unknown) => ipcRenderer.invoke('cve:create', data),
    update: (id: string, data: unknown) => ipcRenderer.invoke('cve:update', id, data),
    move: (id: string, newStage: string, newSwimlaneId: string, sortOrder: number) =>
      ipcRenderer.invoke('cve:move', id, newStage, newSwimlaneId, sortOrder),
    reorder: (updates: { id: string; sort_order: number }[]) =>
      ipcRenderer.invoke('cve:reorder', updates),
    delete: (id: string) => ipcRenderer.invoke('cve:delete', id),
    listArchived: () => ipcRenderer.invoke('cve:listArchived'),
    listArchiveEligible: () => ipcRenderer.invoke('cve:listArchiveEligible'),
    archive: (id: string) => ipcRenderer.invoke('cve:archive', id),
    backdateStage: (id: string, isoTimestamp: string) =>
      ipcRenderer.invoke('cve:backdateStage', id, isoTimestamp)
  },
  swimlane: {
    list: () => ipcRenderer.invoke('swimlane:list'),
    create: (data: unknown) => ipcRenderer.invoke('swimlane:create', data),
    update: (id: string, data: unknown) => ipcRenderer.invoke('swimlane:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('swimlane:delete', id),
    setCollapsed: (id: string, collapsed: boolean) =>
      ipcRenderer.invoke('swimlane:setCollapsed', id, collapsed)
  },
  followup: {
    list: (cveId: string) => ipcRenderer.invoke('followup:list', cveId),
    create: (cveId: string, data: unknown) => ipcRenderer.invoke('followup:create', cveId, data),
    delete: (id: string) => ipcRenderer.invoke('followup:delete', id)
  },
  todo: {
    list: (cveId: string) => ipcRenderer.invoke('todo:list', cveId),
    createDefault: (cveId: string) => ipcRenderer.invoke('todo:createDefault', cveId),
    create: (cveId: string, text: string, triggerStage?: string) =>
      ipcRenderer.invoke('todo:create', cveId, text, triggerStage),
    complete: (id: string, input: { completion_note?: string }) =>
      ipcRenderer.invoke('todo:complete', id, input),
    uncomplete: (id: string) => ipcRenderer.invoke('todo:uncomplete', id),
    delete: (id: string) => ipcRenderer.invoke('todo:delete', id)
  },
  checklistTemplate: {
    list: () => ipcRenderer.invoke('checklistTemplate:list'),
    create: (text: string, sortOrder: number) => ipcRenderer.invoke('checklistTemplate:create', text, sortOrder),
    update: (id: string, text: string) => ipcRenderer.invoke('checklistTemplate:update', id, text),
    delete: (id: string) => ipcRenderer.invoke('checklistTemplate:delete', id),
    reorder: (updates: { id: string; sort_order: number }[]) => ipcRenderer.invoke('checklistTemplate:reorder', updates)
  },
  vendor: {
    list: () => ipcRenderer.invoke('vendor:list'),
    get: (id: string) => ipcRenderer.invoke('vendor:get', id),
    create: (data: unknown) => ipcRenderer.invoke('vendor:create', data),
    update: (id: string, data: unknown) => ipcRenderer.invoke('vendor:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('vendor:delete', id)
  },
  db: {
    backup: () => ipcRenderer.invoke('db:backup'),
    restore: () => ipcRenderer.invoke('db:restore'),
    purgeCVEData: () => ipcRenderer.invoke('db:purgeCVEData'),
    purgeAll: () => ipcRenderer.invoke('db:purgeAll')
  },
  attachment: {
    list: (cveId: string) => ipcRenderer.invoke('attachment:list', cveId),
    import: (cveId: string, sourcePath: string) =>
      ipcRenderer.invoke('attachment:import', cveId, sourcePath),
    openPath: (filepath: string) => ipcRenderer.invoke('attachment:openPath', filepath),
    delete: (id: string) => ipcRenderer.invoke('attachment:delete', id),
    showPicker: () => ipcRenderer.invoke('attachment:showPicker')
  },
  events: {
    // Subscribe to follow-up notification clicks. The main process pushes
    // the CVE id when the user clicks an OS notification — the renderer
    // uses it to open that CVE's detail panel. Returns an unsubscribe fn.
    onOpenCVE: (handler: (cveId: string) => void) => {
      const listener = (_: unknown, cveId: string): void => handler(cveId)
      ipcRenderer.on('notification:openCVE', listener)
      return () => ipcRenderer.removeListener('notification:openCVE', listener)
    }
  }
})
