import type { TaskDTO, UpdateTaskRequest } from '@/data/dtos'
import {
  CATEGORY_CHIP_OPTIONS,
  PRIORITY_CHIP_OPTIONS,
  STATUS_CHIP_OPTIONS,
} from '@/pages/Chat/constants'
import { TASK_STATUS_META } from '@/components/Tasks/taskStatusMeta'
import { formatAbsoluteDate, formatRelativeDate } from '@/components/Tasks/utils'

interface Props {
  task: TaskDTO
  isEditing: boolean
  saving: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onDelete: () => void
  draft: UpdateTaskRequest
  onDraftChange: (patch: Partial<UpdateTaskRequest>) => void
}

const selectClass =
  'rounded-[8px] border border-white/10 bg-surface-high px-2.5 py-1.5 text-xs text-white/80 focus:border-accent-indigo/50 focus:outline-none focus:ring-1 focus:ring-accent-indigo/20'

export default function TaskDetailHeader({
  task,
  isEditing,
  saving,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  draft,
  onDraftChange,
}: Props) {
  const statusOption = STATUS_CHIP_OPTIONS.find((o) => o.value === (isEditing ? draft.status : task.status))
  const categoryOption = CATEGORY_CHIP_OPTIONS.find((o) => o.value === (isEditing ? draft.category : task.category))
  const priorityOption = PRIORITY_CHIP_OPTIONS.find((o) => o.value === (isEditing ? draft.priority : task.priority))
  const currentStatus = isEditing ? (draft.status ?? task.status) : task.status

  return (
    <div>
      <div className="relative overflow-hidden rounded-[28px] border border-white/7 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.10),transparent_26%),linear-gradient(180deg,rgba(16,18,24,0.98),rgba(10,12,16,1))] px-5 py-6 shadow-[0_18px_60px_rgba(0,0,0,0.24)] sm:px-7 sm:py-7">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/14 to-transparent" />
        <div className="pointer-events-none absolute -right-10 top-0 h-32 w-32 rounded-full bg-accent-violet/10 blur-3xl" />

        <div className="relative flex flex-col gap-5">
          {/* Top row: badges + actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Status dot */}
              <span
                className={`h-2.5 w-2.5 rounded-full ${TASK_STATUS_META[currentStatus].dotClass.split(' ').slice(0, 1).join(' ')}`}
              />

              {/* Feature/ticket */}
              {task.feature_or_ticket ? (
                <span className="rounded-full border border-accent-indigo/18 bg-accent-indigo/8 px-2.5 py-0.5 font-mono text-[10px] text-accent-indigo/78">
                  {task.feature_or_ticket}
                </span>
              ) : null}

              {/* Category badge */}
              {isEditing ? (
                <select
                  value={draft.category ?? task.category}
                  onChange={(e) => onDraftChange({ category: e.target.value as typeof task.category })}
                  className={selectClass}
                >
                  {CATEGORY_CHIP_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : categoryOption ? (
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${categoryOption.colorClass}`}>
                  {categoryOption.label}
                </span>
              ) : null}

              {/* Priority badge */}
              {isEditing ? (
                <select
                  value={draft.priority ?? task.priority ?? ''}
                  onChange={(e) => onDraftChange({ priority: e.target.value as typeof task.priority || null })}
                  className={selectClass}
                >
                  <option value="">Sem prioridade</option>
                  {PRIORITY_CHIP_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : priorityOption ? (
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${priorityOption.colorClass}`}>
                  {priorityOption.label}
                </span>
              ) : null}

              {/* Status badge/select */}
              {isEditing ? (
                <select
                  value={draft.status ?? task.status}
                  onChange={(e) => onDraftChange({ status: e.target.value as typeof task.status })}
                  className={selectClass}
                >
                  {STATUS_CHIP_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : statusOption ? (
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${statusOption.colorClass}`}>
                  {statusOption.label}
                </span>
              ) : null}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={saving}
                    className="rounded-[10px] border border-white/10 bg-surface-high/60 px-4 py-2 text-xs font-medium text-white/52 transition-[border-color,color] duration-150 hover:border-white/18 hover:text-white/76 disabled:opacity-40"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-[10px] bg-linear-to-r from-accent-indigo to-accent-violet px-4 py-2 text-xs font-semibold text-white shadow-[0_6px_20px_rgba(99,102,241,0.22)] transition-[filter] duration-150 hover:brightness-110 disabled:opacity-50"
                  >
                    {saving ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border border-white/20 border-t-white/80" />
                    ) : null}
                    Salvar
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onDelete}
                    className="rounded-[10px] border border-red-400/14 bg-red-400/6 px-3 py-2 text-xs font-medium text-red-300/60 transition-[border-color,color,background-color] duration-150 hover:border-red-400/24 hover:bg-red-400/10 hover:text-red-300/90"
                  >
                    Excluir
                  </button>
                  <button
                    type="button"
                    onClick={onEdit}
                    className="flex items-center gap-1.5 rounded-[10px] border border-white/10 bg-surface-high/60 px-4 py-2 text-xs font-medium text-white/64 transition-[border-color,color,background-color] duration-150 hover:border-white/18 hover:bg-surface-high hover:text-white/88"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M8.5 1.5a1.414 1.414 0 0 1 2 2L3.5 10.5l-2.5.5.5-2.5 7-7Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Editar
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Title */}
          {isEditing ? (
            <input
              type="text"
              value={draft.title ?? task.title}
              onChange={(e) => onDraftChange({ title: e.target.value })}
              className="w-full rounded-[12px] border border-white/10 bg-surface-high/60 px-4 py-3 text-2xl font-semibold tracking-tight text-white/94 placeholder:text-white/24 focus:border-accent-indigo/40 focus:outline-none focus:ring-2 focus:ring-accent-indigo/14 sm:text-3xl"
              placeholder="Título da tarefa"
            />
          ) : (
            <h1 className="text-2xl font-semibold tracking-tight text-white/94 sm:text-3xl">
              {task.title}
            </h1>
          )}

          {/* Dates */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] text-white/32">
            <span>
              Criada em{' '}
              <span className="text-white/54">{formatAbsoluteDate(task.created_at)}</span>
            </span>
            <span className="h-3 w-px bg-white/10" />
            <span>
              Atualizada{' '}
              <span className="text-white/54">{formatRelativeDate(task.updated_at)}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
