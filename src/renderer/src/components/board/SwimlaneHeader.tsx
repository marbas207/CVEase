import { ChevronDown, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { useBoardStore } from '../../store/boardStore'
import { VendorFavicon } from '../vendor/VendorFavicon'
import type { Swimlane } from '../../types/cve'
import { cn } from '../../lib/utils'

interface Props {
  swimlane: Swimlane
  onAddCVE: () => void
  onEdit: () => void
}

export function SwimlaneHeader({ swimlane, onAddCVE, onEdit }: Props) {
  const { toggleSwimlaneCollapsed, deleteSwimlane, getVendorById } = useBoardStore()
  const vendorRecord = swimlane.vendor_id ? getVendorById(swimlane.vendor_id) : undefined
  const collapsed = swimlane.collapsed === 1

  const handleDelete = async () => {
    if (confirm(`Delete "${swimlane.software_name}" and all its CVEs?`)) {
      await deleteSwimlane(swimlane.id)
    }
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-sidebar border-b border-border sticky left-0 z-10 min-w-[280px]">
      <button
        onClick={() => toggleSwimlaneCollapsed(swimlane.id)}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      <VendorFavicon url={vendorRecord?.url} size={14} className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-snug">{swimlane.software_name}</p>
        {swimlane.bounty_in_scope === 1 && (
          <span className="text-[10px] font-bold text-green-500 bg-green-500/10 rounded px-1 py-0.5">Bounty</span>
        )}
      </div>
      <div className={cn('flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity no-drag')}>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAddCVE} title="Add Vulnerability">
          <Plus className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit} title="Edit">
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={handleDelete} title="Delete">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}
