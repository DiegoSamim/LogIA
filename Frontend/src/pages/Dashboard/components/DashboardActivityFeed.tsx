import type { TaskDTO } from '@/data/dtos'
import { CATEGORY_CHIP_OPTIONS } from '@/pages/Chat/constants'
import { formatRelativeDate } from '@/components/Tasks/utils'

const STATUS_DOT_COLORS: Record<string, string> = {
  done: '#6ee7b7',
  in_progress: '#a5b4fc',
  blocked: '#fdba74',
  todo: '#94a3b8',
  cancelled: '#fda4af',
}

export default function DashboardActivityFeed({ tasks }: { tasks: TaskDTO[] }) {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <span className="text-2xl opacity-30">📋</span>
        <p className="mt-3 text-sm text-white/30">Nenhuma atividade registrada ainda.</p>
      </div>
    )
  }

  return (
    <div>
      {tasks.map((task, idx) => {
        const categoryOption = CATEGORY_CHIP_OPTIONS.find((o) => o.value === task.category)
        const dotColor = STATUS_DOT_COLORS[task.status] ?? '#94a3b8'
        const isLast = idx === tasks.length - 1

        return (
          <div key={task.id} className="flex gap-3">
            {/* Date */}
            <div className="w-18 shrink-0 pt-2.25 text-right">
              <span className="text-[10px] leading-none tabular-nums text-white/28">
                {formatRelativeDate(task.updated_at)}
              </span>
            </div>

            {/* Dot + connector */}
            <div className="flex shrink-0 flex-col items-center">
              <div
                className="mt-2.5 h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: dotColor, boxShadow: `0 0 0 3px ${dotColor}22` }}
              />
              {!isLast && <div className="w-px flex-1 bg-white/7 mt-1" />}
            </div>

            {/* Content */}
            <div className={`min-w-0 flex-1 pt-1.5 ${isLast ? '' : 'pb-4'}`}>
              <p className="text-sm font-medium leading-snug text-white/82 break-words whitespace-normal">
                {task.title}
              </p>
              {categoryOption && (
                <span
                  className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${categoryOption.colorClass}`}
                >
                  {categoryOption.label}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
