import { useNavigate } from 'react-router-dom'
import type { TaskDTO } from '@/data/dtos'
import { CATEGORY_CHIP_OPTIONS, PRIORITY_CHIP_OPTIONS, STATUS_CHIP_OPTIONS } from '@/pages/Chat/constants'
import { TASK_STATUS_META } from '@/components/Tasks/taskStatusMeta'
import { formatRelativeDate } from '@/components/Tasks/utils'

function RecentTaskRow({ task }: { task: TaskDTO }) {
  const navigate = useNavigate()
  const statusOption = STATUS_CHIP_OPTIONS.find((o) => o.value === task.status)
  const categoryOption = CATEGORY_CHIP_OPTIONS.find((o) => o.value === task.category)
  const priorityOption = task.priority
    ? PRIORITY_CHIP_OPTIONS.find((o) => o.value === task.priority)
    : null

  return (
    <button
      type="button"
      onClick={() => navigate(`/tasks/${task.id}`)}
      className="w-full rounded-[10px] border border-white/6 bg-surface-base/40 px-4 py-3 text-left transition-colors duration-150 hover:border-white/12 hover:bg-surface-container"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white/86">{task.title}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {categoryOption && (
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${categoryOption.colorClass}`}>
                {categoryOption.label}
              </span>
            )}
            {priorityOption && (
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${priorityOption.colorClass}`}>
                {priorityOption.label}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className={`flex items-center justify-end gap-1.5 text-xs font-semibold ${TASK_STATUS_META[task.status].subtleClass}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${TASK_STATUS_META[task.status].dotClass.split(' ')[0]}`} />
            {statusOption?.label ?? task.status}
          </p>
          <p className="mt-1 text-[10px] text-white/28 tabular-nums">
            {formatRelativeDate(task.created_at)}
          </p>
        </div>
      </div>
    </button>
  )
}

export default function DashboardRecentTasks({ tasks }: { tasks: TaskDTO[] }) {
  if (tasks.length === 0) {
    return (
      <p className="text-sm text-white/28 italic">Nenhuma task criada ainda.</p>
    )
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <RecentTaskRow key={task.id} task={task} />
      ))}
    </div>
  )
}
