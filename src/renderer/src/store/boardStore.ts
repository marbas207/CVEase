import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CVE, Vendor, Swimlane, Stage, Severity } from '../types/cve'
import { api } from '../lib/ipc'
import { STAGES } from '../lib/constants'

// Only the three keys below survive a window reload — server-derived data
// (vendors / swimlanes / cves / archived / archiveEligible) is reloaded
// from the DB on every launch by `loadBoard()`, so persisting it would
// just risk showing a stale snapshot on the next start.
type PersistedSlice = Pick<BoardState, 'collapsedVendors' | 'severityFilter' | 'hideEmptyLanes'>

interface BoardState {
  demoActive: boolean
  vendors: Vendor[]
  swimlanes: Swimlane[]
  cves: CVE[]
  archivedCVEs: CVE[]
  archiveEligible: CVE[]
  selectedCVEId: string | null
  activeDragId: string | null
  searchQuery: string
  severityFilter: Severity | null
  hideEmptyLanes: boolean
  isLoading: boolean
  error: string | null
  collapsedVendors: Set<string>

  // Derived helpers
  getCVEsForCell: (swimlaneId: string, stage: Stage) => CVE[]
  getCVEById: (id: string) => CVE | undefined
  getVendorById: (id: string) => Vendor | undefined
  getVendorForSwimlane: (swimlaneId: string) => Vendor | undefined

  // Actions
  addVendor: (data: Parameters<typeof api.vendor.create>[0]) => Promise<Vendor>
  updateVendor: (id: string, data: Parameters<typeof api.vendor.update>[1]) => Promise<void>
  deleteVendor: (id: string) => Promise<void>
  setDemoActive: (active: boolean) => void
  toggleVendorCollapsed: (vendor: string) => void
  loadBoard: () => Promise<void>
  archiveCVE: (id: string) => Promise<void>
  archiveAllEligible: () => Promise<void>
  selectCVE: (id: string | null) => void
  setActiveDrag: (id: string | null) => void
  setSearch: (q: string) => void
  setSeverityFilter: (s: Severity | null) => void
  setHideEmptyLanes: (v: boolean) => void

  addSwimlane: (data: { software_name: string; vendor: string; version_affected?: string; url?: string }) => Promise<Swimlane>
  updateSwimlane: (id: string, data: Partial<Pick<Swimlane, 'software_name' | 'vendor' | 'version_affected' | 'url'>>) => Promise<void>
  deleteSwimlane: (id: string) => Promise<void>
  toggleSwimlaneCollapsed: (id: string) => Promise<void>

  addCVE: (data: Parameters<typeof api.cve.create>[0]) => Promise<CVE>
  updateCVE: (id: string, data: Parameters<typeof api.cve.update>[1]) => Promise<CVE>
  deleteCVE: (id: string) => Promise<void>
  moveCVE: (id: string, newStage: Stage, newSwimlaneId: string, targetIndex: number) => Promise<void>

  // Pre-drag snapshot for rollback
  _preDragSnapshot: CVE[] | null
  saveDragSnapshot: () => void
  rollbackDrag: () => void

  // Optimistic move (used during drag)
  optimisticMove: (id: string, newStage: Stage, newSwimlaneId: string, targetIndex: number) => void
}

export const useBoardStore = create<BoardState>()(
  persist(
    (set, get) => ({
  demoActive: (() => { try { return localStorage.getItem('cvease-demo-active') === '1' } catch { return false } })(),
  vendors: [],
  swimlanes: [],
  cves: [],
  archivedCVEs: [],
  archiveEligible: [],
  selectedCVEId: null,
  activeDragId: null,
  searchQuery: '',
  severityFilter: null,
  hideEmptyLanes: true,
  isLoading: false,
  error: null,
  collapsedVendors: new Set<string>(),
  _preDragSnapshot: null,

  toggleVendorCollapsed: (vendor) => set(s => {
    const next = new Set(s.collapsedVendors)
    if (next.has(vendor)) next.delete(vendor)
    else next.add(vendor)
    return { collapsedVendors: next }
  }),

  getCVEsForCell: (swimlaneId, stage) => {
    const { cves, searchQuery, severityFilter } = get()
    return cves
      .filter(c => {
        if (c.swimlane_id !== swimlaneId || c.stage !== stage) return false
        if (severityFilter && c.severity !== severityFilter) return false
        if (searchQuery) {
          const q = searchQuery.toLowerCase()
          return (
            c.title.toLowerCase().includes(q) ||
            (c.cve_id ?? '').toLowerCase().includes(q) ||
            (c.description ?? '').toLowerCase().includes(q)
          )
        }
        return true
      })
      .sort((a, b) => a.sort_order - b.sort_order)
  },

  getCVEById: (id) => get().cves.find(c => c.id === id),

  getVendorById: (id) => get().vendors.find(v => v.id === id),

  getVendorForSwimlane: (swimlaneId) => {
    const lane = get().swimlanes.find(s => s.id === swimlaneId)
    if (!lane?.vendor_id) return undefined
    return get().vendors.find(v => v.id === lane.vendor_id)
  },

  setDemoActive: (active) => {
    try {
      if (active) localStorage.setItem('cvease-demo-active', '1')
      else localStorage.removeItem('cvease-demo-active')
    } catch { /* ignore */ }
    set({ demoActive: active })
  },

  addVendor: async (data) => {
    const vendor = await api.vendor.create(data)
    set(s => ({ vendors: [...s.vendors, vendor] }))
    return vendor
  },

  updateVendor: async (id, data) => {
    const updated = await api.vendor.update(id, data)
    set(s => ({ vendors: s.vendors.map(v => v.id === id ? updated : v) }))
  },

  deleteVendor: async (id) => {
    await api.vendor.delete(id)
    set(s => ({ vendors: s.vendors.filter(v => v.id !== id) }))
  },

  loadBoard: async () => {
    set({ isLoading: true, error: null })
    try {
      const [vendors, swimlanes, cves, archivedCVEs, archiveEligible] = await Promise.all([
        api.vendor.list(),
        api.swimlane.list(),
        api.cve.list(),
        api.cve.listArchived(),
        api.cve.listArchiveEligible()
      ])
      set({ vendors, swimlanes, cves, archivedCVEs, archiveEligible, isLoading: false })
    } catch (e) {
      set({ error: String(e), isLoading: false })
    }
  },

  archiveCVE: async (id) => {
    await api.cve.archive(id)
    set(s => ({
      cves: s.cves.filter(c => c.id !== id),
      archiveEligible: s.archiveEligible.filter(c => c.id !== id),
      selectedCVEId: s.selectedCVEId === id ? null : s.selectedCVEId
    }))
    // Reload archived list
    const archivedCVEs = await api.cve.listArchived()
    set({ archivedCVEs })
  },

  archiveAllEligible: async () => {
    const eligible = get().archiveEligible
    await Promise.all(eligible.map(c => api.cve.archive(c.id)))
    const [cves, archivedCVEs] = await Promise.all([api.cve.list(), api.cve.listArchived()])
    set({ cves, archivedCVEs, archiveEligible: [] })
  },

  selectCVE: (id) => set({ selectedCVEId: id }),
  setActiveDrag: (id) => set({ activeDragId: id }),
  setSearch: (q) => set({ searchQuery: q }),
  setSeverityFilter: (s) => set({ severityFilter: s }),
  setHideEmptyLanes: (v) => set({ hideEmptyLanes: v }),

  addSwimlane: async (data) => {
    const lane = await api.swimlane.create(data)
    set(s => ({ swimlanes: [...s.swimlanes, lane] }))
    return lane
  },

  updateSwimlane: async (id, data) => {
    const updated = await api.swimlane.update(id, data)
    set(s => ({ swimlanes: s.swimlanes.map(sw => sw.id === id ? updated : sw) }))
  },

  deleteSwimlane: async (id) => {
    await api.swimlane.delete(id)
    set(s => ({
      swimlanes: s.swimlanes.filter(sw => sw.id !== id),
      cves: s.cves.filter(c => c.swimlane_id !== id)
    }))
  },

  toggleSwimlaneCollapsed: async (id) => {
    const lane = get().swimlanes.find(s => s.id === id)
    if (!lane) return
    const newCollapsed = lane.collapsed === 0 ? 1 : 0
    await api.swimlane.setCollapsed(id, newCollapsed === 1)
    set(s => ({
      swimlanes: s.swimlanes.map(sw => sw.id === id ? { ...sw, collapsed: newCollapsed } : sw)
    }))
  },

  addCVE: async (data) => {
    const cve = await api.cve.create(data)
    set(s => ({ cves: [...s.cves, cve] }))
    return cve
  },

  updateCVE: async (id, data) => {
    const updated = await api.cve.update(id, data)
    set(s => ({ cves: s.cves.map(c => c.id === id ? updated : c) }))
    return updated
  },

  deleteCVE: async (id) => {
    await api.cve.delete(id)
    set(s => ({
      cves: s.cves.filter(c => c.id !== id),
      selectedCVEId: s.selectedCVEId === id ? null : s.selectedCVEId
    }))
  },

  moveCVE: async (id, newStage, newSwimlaneId, targetIndex) => {
    await api.cve.move(id, newStage, newSwimlaneId, targetIndex)
    // Reload to get authoritative sort_orders
    const cves = await api.cve.list()
    set({ cves })
  },

  saveDragSnapshot: () => set(s => ({ _preDragSnapshot: [...s.cves] })),

  rollbackDrag: () => {
    const snapshot = get()._preDragSnapshot
    if (snapshot) set({ cves: snapshot, _preDragSnapshot: null })
  },

  optimisticMove: (id, newStage, newSwimlaneId, targetIndex) => {
    set(s => {
      const cve = s.cves.find(c => c.id === id)
      if (!cve) return s

      // Get cards in destination cell (excluding the dragged card)
      const destCards = s.cves
        .filter(c => c.id !== id && c.swimlane_id === newSwimlaneId && c.stage === newStage)
        .sort((a, b) => a.sort_order - b.sort_order)

      // Insert at targetIndex
      destCards.splice(targetIndex, 0, { ...cve, swimlane_id: newSwimlaneId, stage: newStage })

      // Reassign sort_orders for destination cell
      const updatedDestCards = destCards.map((c, i) => ({ ...c, sort_order: i }))

      // Merge back
      const otherCves = s.cves.filter(c => !(
        (c.swimlane_id === newSwimlaneId && c.stage === newStage) || c.id === id
      ))

      // Also fix source cell order
      const sourceCves = otherCves
        .filter(c => c.swimlane_id === cve.swimlane_id && c.stage === cve.stage)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((c, i) => ({ ...c, sort_order: i }))

      const rest = otherCves.filter(c => !(c.swimlane_id === cve.swimlane_id && c.stage === cve.stage))

      return { cves: [...rest, ...sourceCves, ...updatedDestCards] }
    })
  }
}),
    {
      name: 'cvease-ui-state',
      // Only the UI prefs survive a reload — see PersistedSlice above.
      partialize: (state): PersistedSlice => ({
        collapsedVendors: state.collapsedVendors,
        severityFilter: state.severityFilter,
        hideEmptyLanes: state.hideEmptyLanes
      }),
      // Set<string> doesn't survive JSON.stringify, so we serialise it as
      // an array on the way out and rehydrate on the way in.
      storage: createJSONStorage(() => localStorage, {
        replacer: (_key, value) => (value instanceof Set ? Array.from(value) : value),
        reviver: (key, value) =>
          key === 'collapsedVendors' && Array.isArray(value)
            ? new Set(value as string[])
            : value
      }),
      // If we ever change the persisted shape, bumping this number will
      // invalidate older snapshots cleanly instead of crashing on rehydrate.
      version: 1,
      // Defensive: if the on-disk shape is malformed (manual edit, future
      // refactor) fall back to defaults rather than throwing during rehydrate.
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          console.warn('Failed to rehydrate UI state, using defaults:', error)
        }
      }
    }
  )
)

// Convenience: get all stages for a swimlane (used in board rendering)
export { STAGES }
