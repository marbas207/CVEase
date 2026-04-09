import { CheckCircle2 } from 'lucide-react'
import { ActionCard } from './ActionCard'
import { formatDate } from '../../lib/utils'
import type { CVEWithContext } from './ActionItemsGrid'

interface Props {
  items: CVEWithContext[]
  onOpen: (id: string) => void
}

export function RecentlyPublished({ items, onOpen }: Props) {
  if (items.length === 0) return null
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-green-400">
        <CheckCircle2 className="w-4 h-4" />
        Recently Published
      </h3>
      <div className="space-y-2">
        {items.map(({ cve, vendor, swimlane }) => (
          <ActionCard
            key={cve.id}
            cve={cve}
            icon={<CheckCircle2 className="w-4 h-4 text-green-400" />}
            accent="border-l-green-500"
            detail={cve.date_disclosed ? `Published ${formatDate(cve.date_disclosed)}` : 'Published'}
            onClick={() => onOpen(cve.id)}
            vendor={vendor}
            swimlane={swimlane}
          />
        ))}
      </div>
    </div>
  )
}
