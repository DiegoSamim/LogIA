import type { DashboardStats } from '@/pages/Dashboard/hooks/useDashboardData'

interface StatCardProps {
  label: string
  value: number
  total: number
  accentClass: string
  barClass: string
}

function StatCard({ label, value, total, accentClass, barClass }: StatCardProps) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0

  return (
    <div className="rounded-[10px] border border-white/7 bg-surface-container px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/28">{label}</p>
      <p className={`mt-3 text-2xl font-semibold tabular-nums ${accentClass}`}>{value}</p>
      {total > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-white/28">{pct}%</span>
          </div>
          <div className="h-0.5 w-full rounded-full bg-white/6">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barClass}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default function DashboardStatsRow({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        label="Total de tasks"
        value={stats.total}
        total={stats.total}
        accentClass="text-white/90"
        barClass="bg-white/30"
      />
      <StatCard
        label="Concluídas"
        value={stats.done}
        total={stats.total}
        accentClass="text-emerald-300"
        barClass="bg-emerald-400"
      />
      <StatCard
        label="Em andamento"
        value={stats.in_progress}
        total={stats.total}
        accentClass="text-indigo-300"
        barClass="bg-indigo-400"
      />
      <StatCard
        label="Bloqueadas"
        value={stats.blocked}
        total={stats.total}
        accentClass="text-orange-300"
        barClass="bg-orange-400"
      />
    </div>
  )
}
