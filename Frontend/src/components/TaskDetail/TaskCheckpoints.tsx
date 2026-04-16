import type { TaskCheckpointDTO } from '@/data/dtos'

interface Props {
  taskId: string
  checkpoints: TaskCheckpointDTO[]
  onToggle: (id: string, isDone: boolean) => void
}

export default function TaskCheckpoints({ checkpoints, onToggle }: Props) {
  const total = checkpoints.length
  const done = checkpoints.filter((c) => c.is_done).length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  if (total === 0) return null

  return (
    <div className="rounded-[22px] border border-white/7 bg-[linear-gradient(180deg,rgba(17,19,26,0.96),rgba(13,15,20,0.98))] px-5 py-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28">
          Checkpoints
        </p>
        <span className="text-[11px] tabular-nums text-white/36">
          {done}/{total}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/6">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent-indigo to-emerald-400 transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* List */}
      <ul className="mt-4 space-y-1">
        {[...checkpoints]
          .sort((a, b) => a.order_index - b.order_index)
          .map((checkpoint) => (
            <li key={checkpoint.id}>
              <button
                type="button"
                onClick={() => onToggle(checkpoint.id, !checkpoint.is_done)}
                className="group flex w-full items-start gap-3 rounded-[10px] px-2 py-2.5 text-left transition-[background-color] duration-150 hover:bg-white/4"
              >
                {/* Custom checkbox */}
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border transition-[border-color,background-color] duration-150 ${
                    checkpoint.is_done
                      ? 'border-emerald-400/50 bg-emerald-400/18'
                      : 'border-white/14 bg-surface-high/60 group-hover:border-white/24'
                  }`}
                >
                  {checkpoint.is_done ? (
                    <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                      <path
                        d="M1.5 4.5L3.5 6.5L7.5 2.5"
                        stroke="#6EE7B7"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : null}
                </span>

                {/* Description */}
                <span
                  className={`text-sm leading-5 transition-[color,text-decoration-color] duration-150 ${
                    checkpoint.is_done
                      ? 'text-white/28 line-through decoration-white/16'
                      : 'text-white/70 group-hover:text-white/86'
                  }`}
                >
                  {checkpoint.description}
                </span>
              </button>
            </li>
          ))}
      </ul>
    </div>
  )
}
