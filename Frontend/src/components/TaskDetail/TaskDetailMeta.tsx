import type { TaskDTO, UpdateTaskRequest } from '@/data/dtos'
import {
  CATEGORY_CHIP_OPTIONS,
  PRIORITY_CHIP_OPTIONS,
  STATUS_CHIP_OPTIONS,
} from '@/pages/Chat/constants'
import { TASK_STATUS_META } from '@/components/Tasks/taskStatusMeta'
import { formatAbsoluteDate } from '@/components/Tasks/utils'
import StackAutocomplete from '@/components/ui/StackAutocomplete'
import StackBadge from '@/components/ui/StackBadge'

interface Props {
  task: TaskDTO
  isEditing: boolean
  draft: UpdateTaskRequest
  onDraftChange: (patch: Partial<UpdateTaskRequest>) => void
  onEdit: () => void
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/5 py-3 last:border-0">
      <span className="shrink-0 pt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/24">
        {label}
      </span>
      <div className="min-w-0 text-right text-sm text-white/76">{children}</div>
    </div>
  )
}

function EmptyCta({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-1.5 rounded-card border border-dashed border-white/8 py-2 text-[11px] text-white/22 transition-colors duration-150 hover:border-accent-indigo/26 hover:text-accent-indigo/52"
    >
      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
        <path d="M4.5 1v7M1 4.5h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {label}
    </button>
  )
}

const selectClass =
  'rounded-[8px] border border-white/10 bg-surface-high px-2.5 py-1.5 text-xs text-white/80 focus:border-accent-indigo/50 focus:outline-none focus:ring-1 focus:ring-accent-indigo/20 w-full'

const dateInputClass =
  'rounded-[8px] border border-white/10 bg-surface-high px-2.5 py-1.5 text-xs text-white/80 focus:border-accent-indigo/50 focus:outline-none focus:ring-1 focus:ring-accent-indigo/20 w-full [color-scheme:dark]'

const numberInputClass =
  'rounded-[8px] border border-white/10 bg-surface-high px-2.5 py-1.5 text-xs text-white/80 focus:border-accent-indigo/50 focus:outline-none focus:ring-1 focus:ring-accent-indigo/20 w-full'

function formatHours(hours: number | null | undefined) {
  if (hours === null || hours === undefined) return '—'
  if (Number.isInteger(hours)) return `${hours}h`
  return `${hours.toFixed(1).replace('.', ',')}h`
}

export default function TaskDetailMeta({ task, isEditing, draft, onDraftChange, onEdit }: Props) {
  const statusOption = STATUS_CHIP_OPTIONS.find(
    (o) => o.value === (isEditing ? (draft.status ?? task.status) : task.status),
  )
  const priorityOption = PRIORITY_CHIP_OPTIONS.find(
    (o) => o.value === (isEditing ? (draft.priority ?? task.priority) : task.priority),
  )
  const categoryOption = CATEGORY_CHIP_OPTIONS.find(
    (o) => o.value === (isEditing ? (draft.category ?? task.category) : task.category),
  )

  const currentStatus = isEditing ? (draft.status ?? task.status) : task.status
  const currentTags = isEditing ? (draft.tags ?? task.tags) : task.tags
  const currentPeople = isEditing ? (draft.people_involved ?? task.people_involved) : task.people_involved
  const currentHours = isEditing ? (draft.hours_worked ?? task.hours_worked) : task.hours_worked

  const people = currentPeople
    ? currentPeople.split(',').map((p) => p.trim()).filter(Boolean)
    : []

  return (
    <div className="rounded-[22px] border border-white/7 bg-[linear-gradient(180deg,rgba(17,19,26,0.96),rgba(13,15,20,0.98))] px-4 py-2">
      {/* Status */}
      <MetaRow label="Status">
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
        ) : (
          <span className={`flex items-center justify-end gap-1.5 font-medium ${TASK_STATUS_META[currentStatus].subtleClass}`}>
            <span className={`h-2 w-2 rounded-full ${TASK_STATUS_META[currentStatus].dotClass.split(' ')[0]}`} />
            {statusOption?.label ?? task.status}
          </span>
        )}
      </MetaRow>

      {/* Prioridade */}
      <MetaRow label="Prioridade">
        {isEditing ? (
          <select
            value={draft.priority ?? task.priority ?? ''}
            onChange={(e) => onDraftChange({ priority: (e.target.value as typeof task.priority) || null })}
            className={selectClass}
          >
            <option value="">—</option>
            {PRIORITY_CHIP_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ) : priorityOption ? (
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${priorityOption.colorClass}`}>
            {priorityOption.label}
          </span>
        ) : (
          <span className="text-white/24">—</span>
        )}
      </MetaRow>

      {/* Categoria */}
      <MetaRow label="Categoria">
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
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${categoryOption.colorClass}`}>
            {categoryOption.label}
          </span>
        ) : (
          <span className="text-white/24">—</span>
        )}
      </MetaRow>

      <div className="my-1 h-px bg-white/4" />

      {/* Horas */}
      <MetaRow label="Horas">
        {isEditing ? (
          <input
            type="number"
            min="0"
            value={currentHours ?? ''}
            onChange={(e) => onDraftChange({ hours_worked: e.target.value ? Number(e.target.value) : null })}
            placeholder="0"
            className={numberInputClass}
          />
        ) : currentHours !== null && currentHours !== undefined ? (
          <span>{formatHours(currentHours)}</span>
        ) : (
          <span className="text-white/24">—</span>
        )}
      </MetaRow>

      {/* Iniciado */}
      <MetaRow label="Iniciado">
        {isEditing ? (
          <input
            type="date"
            value={draft.started_at ? draft.started_at.split('T')[0] : (task.started_at ? task.started_at.split('T')[0] : '')}
            onChange={(e) => onDraftChange({ started_at: e.target.value ? `${e.target.value}T00:00:00` : null })}
            className={dateInputClass}
          />
        ) : task.started_at ? (
          <span>{formatAbsoluteDate(task.started_at)}</span>
        ) : (
          <span className="text-white/24">—</span>
        )}
      </MetaRow>

      {/* Concluído */}
      <MetaRow label="Concluído">
        {isEditing ? (
          <input
            type="date"
            value={draft.completed_at ? draft.completed_at.split('T')[0] : (task.completed_at ? task.completed_at.split('T')[0] : '')}
            onChange={(e) => onDraftChange({ completed_at: e.target.value ? `${e.target.value}T23:59:59` : null })}
            className={dateInputClass}
          />
        ) : task.completed_at ? (
          <span>{formatAbsoluteDate(task.completed_at)}</span>
        ) : (
          <span className="text-white/24">—</span>
        )}
      </MetaRow>

      {/* Criado em */}
      <MetaRow label="Criado em">
        <span>{formatAbsoluteDate(task.created_at)}</span>
      </MetaRow>

      <div className="my-1 h-px bg-white/4" />

      {/* Stacks */}
      <div className="border-b border-white/5 py-3">
        <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/24">Stacks</p>
        {isEditing ? (
          <StackAutocomplete
            value={draft.tags ?? task.tags}
            onChange={(tags) => onDraftChange({ tags })}
            placeholder="Adicionar tecnologia..."
          />
        ) : currentTags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {currentTags.map((tag) => (
              <StackBadge key={tag} value={tag} compact />
            ))}
          </div>
        ) : (
          <EmptyCta label="Adicionar stacks" onClick={onEdit} />
        )}
      </div>

      {/* Envolvidos */}
      <div className="py-3">
        <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/24">Envolvidos</p>
        {isEditing ? (
          <input
            type="text"
            value={draft.people_involved ?? task.people_involved ?? ''}
            onChange={(e) => onDraftChange({ people_involved: e.target.value || null })}
            placeholder="Ex: Diego, Maria, João"
            className="w-full rounded-lg border border-white/10 bg-surface-high px-2.5 py-1.5 text-xs text-white/80 placeholder:text-white/22 focus:border-accent-indigo/50 focus:outline-none focus:ring-1 focus:ring-accent-indigo/20"
          />
        ) : people.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {people.map((person) => (
              <span
                key={person}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-surface-high/50 px-2.5 py-1 text-[11px] font-medium text-white/60"
              >
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-indigo/20 text-[9px] font-semibold uppercase text-accent-indigo/80">
                  {person.charAt(0)}
                </span>
                {person}
              </span>
            ))}
          </div>
        ) : (
          <EmptyCta label="Adicionar envolvidos" onClick={onEdit} />
        )}
      </div>
    </div>
  )
}
