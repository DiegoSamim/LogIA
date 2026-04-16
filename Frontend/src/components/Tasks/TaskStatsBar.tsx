interface TaskStats {
  total: number
  done: number
  in_progress: number
  blocked: number
}

function StatCard({
  label,
  value,
  accentClass,
}: {
  label: string
  value: number
  accentClass: string
}) {
  return (
    <div className="rounded-[18px] border border-white/7 bg-surface-base/58 px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/24">
        {label}
      </p>
      <p className={`mt-2 text-xl font-semibold tabular-nums ${accentClass}`}>{value}</p>
    </div>
  )
}

export default function TaskStatsBar({ stats }: { stats: TaskStats }) {
  return (
    <section className="relative overflow-hidden rounded-[24px] border border-white/7 bg-[linear-gradient(180deg,rgba(17,19,26,0.98),rgba(10,12,16,0.98))] px-4 py-4 shadow-[0_16px_40px_rgba(0,0,0,0.2)] sm:px-5">
      <div className="absolute inset-y-5 left-0 w-1 rounded-r-full bg-gradient-to-b from-accent-violet to-accent-indigo" />

      <div className="ml-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/28">
          Resumo operacional
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total de tasks" value={stats.total} accentClass="text-white/92" />
          <StatCard label="Concluídas" value={stats.done} accentClass="text-emerald-300" />
          <StatCard label="Em andamento" value={stats.in_progress} accentClass="text-amber-300" />
          <StatCard label="Bloqueadas" value={stats.blocked} accentClass="text-orange-300" />
        </div>
      </div>
    </section>
  )
}
