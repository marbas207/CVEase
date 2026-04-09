import { ShieldAlert, AlertCircle, Mail, Trophy, DollarSign } from 'lucide-react'
import { cn } from '../../lib/utils'

interface StatCardProps {
  label: string
  value: number | string
  subtitle?: string
  icon: React.ReactNode
  color?: string
}

function StatCard({ label, value, subtitle, icon, color }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 flex items-center gap-3">
      <div className={cn('p-2 rounded-md', color ?? 'bg-muted')}>{icon}</div>
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        {subtitle && <p className="text-[11px] text-muted-foreground/70">{subtitle}</p>}
      </div>
    </div>
  )
}

interface Props {
  totalActive: number
  urgentCount: number
  waitingOnVendors: number
  publishedTotal: number
  paidBountyCount: number
  totalBountyValue: number
}

export function StatsRow({
  totalActive,
  urgentCount,
  waitingOnVendors,
  publishedTotal,
  paidBountyCount,
  totalBountyValue
}: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <StatCard
        label="Active Vulns"
        value={totalActive}
        icon={<ShieldAlert className="w-5 h-5 text-primary" />}
        color="bg-primary/10"
      />
      <StatCard
        label="Needs Action"
        value={urgentCount}
        icon={<AlertCircle className="w-5 h-5 text-red-400" />}
        color="bg-red-500/10"
      />
      <StatCard
        label="Waiting on Vendors"
        value={waitingOnVendors}
        icon={<Mail className="w-5 h-5 text-sky-400" />}
        color="bg-sky-500/10"
      />
      <StatCard
        label="Published"
        value={publishedTotal}
        icon={<Trophy className="w-5 h-5 text-yellow-400" />}
        color="bg-yellow-500/10"
      />
      <StatCard
        label="Bounties Earned"
        value={paidBountyCount}
        subtitle={totalBountyValue > 0 ? `$${totalBountyValue.toLocaleString()}` : undefined}
        icon={<DollarSign className="w-5 h-5 text-green-400" />}
        color="bg-green-500/10"
      />
    </div>
  )
}
