import type { TaskCategory } from '@/data/dtos'
import type { CategoryCount } from '@/pages/Dashboard/hooks/useDashboardData'
import { CATEGORY_CHIP_OPTIONS } from '@/pages/Chat/constants'

const CATEGORY_BAR_COLOR: Record<TaskCategory, string> = {
  feature:  'rgba(165,180,252,0.55)',  // indigo-300
  bug_fix:  'rgba(252,165,165,0.55)',  // red-300
  refactor: 'rgba(252,211,77,0.55)',   // amber-300
  test:     'rgba(103,232,249,0.55)',  // cyan-300
  ui_ux:    'rgba(196,181,253,0.55)',  // violet-300
  docs:     'rgba(148,163,184,0.55)',  // slate-400
  infra:    'rgba(253,186,116,0.55)',  // orange-300
  research: 'rgba(94,234,212,0.55)',  // teal-300
}

export default function DashboardCategoryChart({
  distribution,
}: {
  distribution: CategoryCount[]
}) {
  if (distribution.length === 0) {
    return (
      <p className="text-sm text-white/28 italic">Nenhuma task registrada ainda.</p>
    )
  }

  const max = distribution[0].count

  return (
    <div className="space-y-3">
      {distribution.map(({ category, count }) => {
        const option = CATEGORY_CHIP_OPTIONS.find((o) => o.value === category)
        const pct = Math.round((count / max) * 100)
        const textColorClass = option?.colorClass.split(' ')[0] ?? 'text-white/60'
        const barColor = CATEGORY_BAR_COLOR[category] ?? 'rgba(148,163,184,0.5)'

        return (
          <div key={category}>
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-xs font-medium ${textColorClass}`}>
                {option?.label ?? category}
              </span>
              <span className="text-[11px] tabular-nums text-white/36">{count}</span>
            </div>
            <div className="h-1 w-full rounded-full bg-white/5">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, background: barColor }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
