import { CATEGORY_CHIP_OPTIONS } from '@/pages/Chat/constants'
import type { HoursStats } from '@/pages/Dashboard/hooks/useDashboardData'

export default function DashboardHoursCard({ hours }: { hours: HoursStats }) {
  const topLabel = hours.topCategory
    ? (CATEGORY_CHIP_OPTIONS.find((o) => o.value === hours.topCategory!.category)?.label ?? hours.topCategory.category)
    : null
  const topColorClass = hours.topCategory
    ? (CATEGORY_CHIP_OPTIONS.find((o) => o.value === hours.topCategory!.category)?.colorClass ?? '')
    : ''

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/28">Total de horas</p>
        <p className="mt-3 text-2xl font-semibold tabular-nums text-accent-violet/88">
          {hours.total > 0 ? `${hours.total}h` : '—'}
        </p>
        <p className="mt-1 text-xs text-white/34">registradas nas tasks</p>
      </div>

      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/28">Mais horas em</p>
        {hours.topCategory && topLabel ? (
          <>
            <div className="mt-3">
              <span
                className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${topColorClass}`}
              >
                {topLabel}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-white/34">{hours.topCategory.hours}h nessa categoria</p>
          </>
        ) : (
          <p className="mt-3 text-2xl font-semibold text-white/22">—</p>
        )}
      </div>
    </div>
  )
}
