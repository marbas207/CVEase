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
        className="flex items-center gap-2.5 w-full px-3 py-2 bg-muted/40 border-b border-border hover:bg-muted/60 transition-colors text-left"
      >
        {collapsed
          ? <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
        <VendorFavicon url={vendorRecord?.url} size={20} />
        <span className="text-base font-bold text-primary">{vendor}</span>
        {vendorRecord?.is_cna === 1 && (
          <span className="text-[10px] font-bold text-primary bg-primary/10 rounded px-1 py-0.5">CNA</span>
        )}
        {vendorRecord?.has_bounty_program === 1 && (
          <span className="text-[10px] font-bold text-green-500 bg-green-500/10 rounded px-1 py-0.5">Bounty</span>
        )}
        <span className="text-xs text-muted-foreground/50 ml-auto">
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
