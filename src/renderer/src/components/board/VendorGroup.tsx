import { ChevronDown, ChevronRight } from 'lucide-react'
import { useBoardStore } from '../../store/boardStore'
import { SwimlaneRow } from './SwimlaneRow'
import { VendorFavicon } from '../vendor/VendorFavicon'
import type { Swimlane } from '../../types/cve'

interface Props {
  vendor: string
  swimlanes: Swimlane[]
}

export function VendorGroup({ vendor, swimlanes }: Props) {
  const { collapsedVendors, toggleVendorCollapsed, getVendorById } = useBoardStore()
  const collapsed = collapsedVendors.has(vendor)

  // Look up the vendor record for the favicon
  const vendorId = swimlanes[0]?.vendor_id
  const vendorRecord = vendorId ? getVendorById(vendorId) : undefined

  return (
    <div>
      {/* Vendor group header */}
      <button
        onClick={() => toggleVendorCollapsed(vendor)}
        className="flex items-center gap-2 w-full px-3 py-1.5 bg-muted/30 border-b border-border hover:bg-muted/50 transition-colors text-left"
      >
        {collapsed
          ? <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
        <VendorFavicon url={vendorRecord?.url} size={14} />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{vendor}</span>
        {vendorRecord?.is_cna === 1 && (
          <span className="text-[9px] font-bold text-primary bg-primary/10 rounded px-1 py-0.5">CNA</span>
        )}
        <span className="text-xs text-muted-foreground/50 ml-1">
          {swimlanes.length} product{swimlanes.length !== 1 ? 's' : ''}
        </span>
      </button>

      {/* Swimlane rows under this vendor */}
      {!collapsed && swimlanes.map(lane => (
        <SwimlaneRow key={lane.id} swimlane={lane} />
      ))}
    </div>
  )
}
