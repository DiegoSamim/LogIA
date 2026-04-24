import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TaskDTO, TaskStatus } from '@/data/dtos'
import { CATEGORY_CHIP_OPTIONS } from '@/pages/Chat/constants'
import { TASK_STATUS_META } from './taskStatusMeta'
import { formatAbsoluteDate } from './utils'

const COLUMNS: {
  status: TaskStatus
  label: string
  headerClass: string
  dropClass: string
  dotClass: string
}[] = [
  {
    status: 'todo',
    label: 'A fazer',
    headerClass: 'text-slate-300',
    dropClass: 'border-slate-300/20 bg-slate-300/[0.04]',
    dotClass: 'bg-slate-300',
  },
  {
    status: 'in_progress',
    label: 'Em andamento',
    headerClass: 'text-amber-300',
    dropClass: 'border-amber-300/20 bg-amber-300/[0.04]',
    dotClass: 'bg-amber-300',
  },
  {
    status: 'done',
    label: 'Concluído',
    headerClass: 'text-emerald-300',
    dropClass: 'border-emerald-300/20 bg-emerald-300/[0.04]',
    dotClass: 'bg-emerald-300',
  },
  {
    status: 'blocked',
    label: 'Bloqueado',
    headerClass: 'text-orange-300',
    dropClass: 'border-orange-300/20 bg-orange-300/[0.04]',
    dotClass: 'bg-orange-300',
  },
  {
    status: 'cancelled',
    label: 'Cancelado',
    headerClass: 'text-rose-300',
    dropClass: 'border-rose-300/20 bg-rose-300/[0.04]',
    dotClass: 'bg-rose-300',
  },
]

function KanbanCard({
  task,
  isDragging,
  isUpdating,
  onDragStart,
  onDragEnd,
  onClick,
  canEdit,
}: {
  task: TaskDTO
  isDragging: boolean
  isUpdating: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onClick: () => void
  canEdit: boolean
}) {
  const categoryOption = CATEGORY_CHIP_OPTIONS.find((o) => o.value === task.category)
  const meta = TASK_STATUS_META[task.status]

  return (
    <article
      draggable={canEdit && !isUpdating}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={[
        'rounded-[14px] border border-white/7 bg-[linear-gradient(180deg,rgba(19,22,30,0.95),rgba(16,18,24,0.98))] px-3.5 py-3 shadow-[0_6px_16px_rgba(0,0,0,0.16)]',
        'transition-[border-color,opacity,transform] duration-150',
        isUpdating
          ? 'cursor-wait opacity-50'
          : isDragging
          ? 'cursor-grabbing opacity-60 scale-[0.98]'
          : canEdit
          ? 'cursor-grab hover:border-white/14'
          : 'cursor-pointer hover:border-white/14',
      ].join(' ')}
    >
      <p className="text-[13px] font-semibold leading-5 text-white/90 break-words">
        {task.title}
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {categoryOption ? (
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${categoryOption.colorClass}`}>
            {categoryOption.label}
          </span>
        ) : null}
        <span className="text-[10px] text-white/28">{formatAbsoluteDate(task.created_at)}</span>
        {isUpdating ? (
          <span className="ml-auto h-3 w-3 animate-spin rounded-full border border-white/12 border-t-white/48" />
        ) : (
          <span className={`ml-auto h-1.5 w-1.5 rounded-full ${meta.dotClass.split(' ')[0]}`} />
        )}
      </div>
    </article>
  )
}

export default function TasksKanban({
  tasks,
  onStatusChange,
  canEdit,
}: {
  tasks: TaskDTO[]
  onStatusChange: (taskId: string, newStatus: TaskStatus) => Promise<void>
  canEdit: boolean
}) {
  const navigate = useNavigate()
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null)
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())
  const dragLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function tasksByStatus(status: TaskStatus) {
    return tasks.filter((t) => t.status === status)
  }

  function handleDragStart(taskId: string) {
    if (!canEdit) return
    setDraggingId(taskId)
  }

  function handleDragEnd() {
    setDraggingId(null)
    setDragOverStatus(null)
  }

  function handleDragOver(e: React.DragEvent, status: TaskStatus) {
    if (!canEdit) return
    e.preventDefault()
    if (dragLeaveTimerRef.current) {
      clearTimeout(dragLeaveTimerRef.current)
      dragLeaveTimerRef.current = null
    }
    setDragOverStatus(status)
  }

  function handleDragLeave() {
    dragLeaveTimerRef.current = setTimeout(() => {
      setDragOverStatus(null)
    }, 80)
  }

  async function handleDrop(e: React.DragEvent, newStatus: TaskStatus) {
    e.preventDefault()
    if (!canEdit) return
    setDragOverStatus(null)

    if (!draggingId) return
    const task = tasks.find((t) => t.id === draggingId)
    if (!task || task.status === newStatus) {
      setDraggingId(null)
      return
    }

    setDraggingId(null)
    setUpdatingIds((prev) => new Set(prev).add(draggingId))

    try {
      await onStatusChange(draggingId, newStatus)
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev)
        next.delete(draggingId)
        return next
      })
    }
  }

  const anyUpdating = updatingIds.size > 0

  return (
    <div className="grid grid-cols-5 gap-3">
      {COLUMNS.map((col) => {
          const colTasks = tasksByStatus(col.status)
          const isOver = dragOverStatus === col.status && draggingId !== null

          return (
            <div
              key={col.status}
              onDragOver={(e) => handleDragOver(e, col.status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => { void handleDrop(e, col.status) }}
              className={[
                'flex min-w-0 flex-col rounded-[18px] border p-3 transition-[border-color,background-color] duration-150',
                isOver ? col.dropClass : 'border-white/7 bg-surface-container/40',
              ].join(' ')}
            >
              <div className="mb-3 flex items-center gap-2 px-1">
                <span className={`h-2 w-2 shrink-0 rounded-full ${col.dotClass}`} />
                <p className={`min-w-0 truncate text-[11px] font-semibold uppercase tracking-[0.18em] ${col.headerClass}`}>
                  {col.label}
                </p>
                <span className="ml-auto shrink-0 rounded-full border border-white/8 bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-white/36">
                  {colTasks.length}
                </span>
              </div>

              <div className="flex max-h-[62vh] flex-col gap-2 overflow-y-auto pr-0.5">
                {colTasks.map((task) => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    isDragging={draggingId === task.id}
                    isUpdating={updatingIds.has(task.id)}
                    canEdit={canEdit}
                    onDragStart={() => {
                      if (!anyUpdating) handleDragStart(task.id)
                    }}
                    onDragEnd={handleDragEnd}
                    onClick={() => {
                      if (!updatingIds.has(task.id)) navigate(`/tasks/${task.id}`)
                    }}
                  />
                ))}

                {colTasks.length === 0 ? (
                  <div className="rounded-[10px] border border-dashed border-white/6 py-6 text-center">
                    <p className="text-[11px] text-white/20">Sem tarefas</p>
                  </div>
                ) : null}
              </div>
            </div>
          )
        })}
    </div>
  )
}
