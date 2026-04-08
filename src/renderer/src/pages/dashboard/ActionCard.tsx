import { ArrowRight } from 'lucide-react'
import { SeverityBadge } from '../../components/cve/SeverityBadge'
import { VendorFavicon } from '../../components/vendor/VendorFavicon'
import { cn } from '../../lib/utils'
import type { CVE, Vendor, Swimlane } from '../../types/cve'

interface Props {
  cve: CVE
  icon: React.ReactNode
  accent: string
  detail: string
  onClick: () => void
  action?: { label: string; onClick: () => void }
  vendor?: Vendor
  swimlane?: Swimlane
}

export function ActionCard({ cve, icon, accent, detail, onClick, action, vendor, swimlane }: Props) {
  return (
    <div
      className={cn(
        'w-full text-left bg-card border border-border rounded-lg p-3 hover:border-primary/40 hover:shadow-md transition-all group cursor-pointer',
        'border-l-4',
        accent
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug line-clamp-1">{cve.title}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <SeverityBadge severity={cve.severity} className="text-[10px] px-1 py-0" />
            {cve.cve_id && <span className="text-[11px] font-mono text-muted-foreground">{cve.cve_id}</span>}
            {cve.affected_versions && <span className="text-[11px] font-mono text-muted-foreground">v{cve.affected_versions}</span>}
          </div>
          {(vendor || swimlane) && (
            <div className="flex items-center gap-1.5 mt-1">
              {vendor && <VendorFavicon url={vendor.url} size={12} />}
              <span className="text-[11px] text-muted-foreground truncate">
                {vendor?.name}{vendor && swimlane ? ' / ' : ''}{swimlane?.software_name}
              </span>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1">{detail}</p>
        </div>
        {action ? (
          <button
            onClick={(e) => { e.stopPropagation(); action.onClick() }}
            className="shrink-0 text-xs font-medium px-2 py-1 rounded border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
          >
            {action.label}
          </button>
        ) : (
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0 mt-1" />
        )}
      </div>
    </div>
  )
}
