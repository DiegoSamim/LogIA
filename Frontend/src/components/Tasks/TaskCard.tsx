import type { TaskDTO } from '@/data/dtos'
import {
  CATEGORY_CHIP_OPTIONS,
  PRIORITY_CHIP_OPTIONS,
  STATUS_CHIP_OPTIONS,
} from '@/pages/Chat/constants'
import { TASK_STATUS_META } from './taskStatusMeta'
import { formatAbsoluteDate } from './utils'

export default function TaskCard({ task, onClick }: { task: TaskDTO; onClick?: () => void }) {
  const statusOption = STATUS_CHIP_OPTIONS.find((option) => option.value === task.status)
  const categoryOption = CATEGORY_CHIP_OPTIONS.find((option) => option.value === task.category)
  const priorityOption = task.priority
    ? PRIORITY_CHIP_OPTIONS.find((option) => option.value === task.priority)
    : null

  return (
    <article
      onClick={onClick}
      className={`min-w-0 max-w-full rounded-[20px] border border-white/7 bg-[linear-gradient(180deg,rgba(19,22,30,0.94),rgba(16,18,24,0.98))] px-4 py-3.5 shadow-[0_10px_24px_rgba(0,0,0,0.14)] transition-[border-color,background-color] duration-150 hover:border-white/14 hover:bg-surface-container/94 sm:px-5${onClick ? ' cursor-pointer' : ''}`}
    >
      <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="min-w-0 break-words text-base font-semibold tracking-tight text-white/94">
              {task.title}
            </h3>
            {task.feature_or_ticket ? (
              <span className="max-w-full rounded-full border border-accent-indigo/18 bg-accent-indigo/8 px-2.5 py-0.5 font-mono text-[10px] break-all text-accent-indigo/78">
                {task.feature_or_ticket}
              </span>
            ) : null}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {categoryOption ? (
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${categoryOption.colorClass}`}>
                {categoryOption.label}
              </span>
            ) : null}
            {priorityOption ? (
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${priorityOption.colorClass}`}>
                {priorityOption.label}
              </span>
            ) : null}
          </div>

          {task.what_was_done ? (
            <p className="mt-2 line-clamp-2 text-sm leading-5 text-white/54">
              {task.what_was_done}
            </p>
          ) : null}
        </div>

        <aside className="grid grid-cols-2 gap-4 border-t border-white/6 pt-3 sm:max-w-[320px] sm:self-end xl:shrink-0 xl:border-t-0 xl:pt-0">
          <div className="min-w-0 text-left xl:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/24">
              Status
            </p>
            <p className={`mt-1 flex items-center gap-2 text-sm font-semibold xl:justify-end ${TASK_STATUS_META[task.status].subtleClass}`}>
              <span className={`h-2 w-2 rounded-full ${TASK_STATUS_META[task.status].dotClass.split(' ')[0]}`} />
              {statusOption?.label ?? task.status}
            </p>
          </div>

          <div className="min-w-0 text-left xl:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/24">
              Data
            </p>
            <p className="mt-1 break-words text-sm font-semibold text-white/76">
              {formatAbsoluteDate(task.created_at)}
            </p>
          </div>
        </aside>
      </div>
    </article>
  )
}
