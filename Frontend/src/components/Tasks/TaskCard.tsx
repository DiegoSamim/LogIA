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

  const visibleTags = task.tags.slice(0, 2)
  const overflowTags = task.tags.length - visibleTags.length

  return (
    <article
      onClick={onClick}
      className={`rounded-[20px] border border-white/7 bg-[linear-gradient(180deg,rgba(19,22,30,0.94),rgba(16,18,24,0.98))] px-4 py-3.5 shadow-[0_10px_24px_rgba(0,0,0,0.14)] transition-[border-color,background-color] duration-150 hover:border-white/14 hover:bg-surface-container/94 sm:px-5${onClick ? ' cursor-pointer' : ''}`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-semibold tracking-tight text-white/94">
              {task.title}
            </h3>
            {task.feature_or_ticket ? (
              <span className="rounded-full border border-accent-indigo/18 bg-accent-indigo/8 px-2.5 py-0.5 font-mono text-[10px] text-accent-indigo/78">
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
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/8 bg-surface-base/56 px-2.5 py-0.5 text-[10px] text-white/52"
              >
                {tag}
              </span>
            ))}
            {overflowTags > 0 ? (
              <span className="rounded-full border border-white/8 bg-surface-base/56 px-2.5 py-0.5 text-[10px] text-white/32">
                +{overflowTags}
              </span>
            ) : null}
          </div>

          {task.what_was_done ? (
            <p className="mt-2 line-clamp-2 text-sm leading-5 text-white/54">
              {task.what_was_done}
            </p>
          ) : null}
        </div>

        <aside className="flex shrink-0 items-center gap-5 lg:min-w-[228px] lg:justify-end">
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/24">
              Status
            </p>
            <p className={`mt-1 flex items-center justify-end gap-2 text-sm font-semibold ${TASK_STATUS_META[task.status].subtleClass}`}>
              <span className={`h-2 w-2 rounded-full ${TASK_STATUS_META[task.status].dotClass.split(' ')[0]}`} />
              {statusOption?.label ?? task.status}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/24">
              Data
            </p>
            <p className="mt-1 text-sm font-semibold text-white/76">
              {formatAbsoluteDate(task.created_at)}
            </p>
          </div>
        </aside>
      </div>
    </article>
  )
}
