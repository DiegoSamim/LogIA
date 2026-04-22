import { useEffect, useState } from 'react'
import Timeline from '@mui/lab/Timeline'
import TimelineConnector from '@mui/lab/TimelineConnector'
import TimelineContent from '@mui/lab/TimelineContent'
import TimelineDot from '@mui/lab/TimelineDot'
import TimelineItem from '@mui/lab/TimelineItem'
import TimelineSeparator from '@mui/lab/TimelineSeparator'
import type { TaskDTO, TaskUpdateDTO, UpdateType } from '@/data/dtos'
import AutoResizeTextarea from '@/components/ui/AutoResizeTextarea'
import { STATUS_CHIP_OPTIONS } from '@/pages/Chat/constants'
import { formatRelativeDate } from '@/components/Tasks/utils'
import { taskService } from '@/services/task.service'

interface Props {
  taskId: string
  task: TaskDTO
  updates: TaskUpdateDTO[]
  onNewUpdate: (update: TaskUpdateDTO) => void
  onTaskChange: (task: TaskDTO) => void
}

const UPDATE_TYPE_COLOR: Record<UpdateType, string> = {
  created:       '#6366F1',
  progress:      '#6EE7B7',
  status_change: '#FCD34D',
  completion:    '#34D399',
  blocker:       '#FDBA74',
  edit:          '#94A3B8',
}

const UPDATE_TYPE_GLOW: Record<UpdateType, string> = {
  created:       '0 0 0 4px rgba(99,102,241,0.14)',
  progress:      '0 0 0 4px rgba(110,231,183,0.14)',
  status_change: '0 0 0 4px rgba(252,211,77,0.13)',
  completion:    '0 0 0 4px rgba(52,211,153,0.14)',
  blocker:       '0 0 0 4px rgba(253,186,116,0.14)',
  edit:          '0 0 0 4px rgba(148,163,184,0.10)',
}

const UPDATE_TYPE_LABEL: Record<UpdateType, string> = {
  created:       'Criação',
  progress:      'Progresso',
  status_change: 'Status',
  completion:    'Conclusão',
  blocker:       'Bloqueio',
  edit:          'Edição',
}

const UPDATE_TYPE_COLOR_CLASS: Record<UpdateType, string> = {
  created:       'text-indigo-300 bg-indigo-400/10 border-indigo-400/20',
  progress:      'text-emerald-300 bg-emerald-400/10 border-emerald-400/20',
  status_change: 'text-amber-300 bg-amber-400/10 border-amber-400/20',
  completion:    'text-green-300 bg-green-400/10 border-green-400/20',
  blocker:       'text-orange-300 bg-orange-400/10 border-orange-400/20',
  edit:          'text-slate-300 bg-slate-400/10 border-slate-400/20',
}

const ALL_UPDATE_TYPES: UpdateType[] = [
  'progress',
  'status_change',
  'blocker',
  'completion',
  'edit',
]

export default function TaskUpdateTimeline({ taskId, task, updates, onNewUpdate, onTaskChange }: Props) {
  const [formOpen, setFormOpen] = useState(false)
  const [type, setType] = useState<UpdateType>('progress')
  const [summary, setSummary] = useState('')
  const [details, setDetails] = useState('')
  const [updateTaskSummary, setUpdateTaskSummary] = useState(false)
  const [taskSummary, setTaskSummary] = useState(task.what_was_done ?? '')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setTaskSummary(task.what_was_done ?? '')
  }, [task.what_was_done])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!summary.trim()) return

    setSubmitting(true)
    try {
      if (updateTaskSummary) {
        const { data } = await taskService.update(taskId, {
          what_was_done: taskSummary.trim() || null,
        })
        onTaskChange(data)
      }

      const { data } = await taskService.createUpdate(taskId, {
        update_type: type,
        summary: summary.trim(),
        details: details.trim() || null,
      })
      onNewUpdate(data)
      setSummary('')
      setDetails('')
      setType('progress')
      setUpdateTaskSummary(false)
      setTaskSummary(task.what_was_done ?? '')
      setFormOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-[22px] border border-white/7 bg-[linear-gradient(180deg,rgba(17,19,26,0.96),rgba(13,15,20,0.98))] px-5 py-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28">
          Histórico de atualizações
        </p>
        {!formOpen ? (
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-1.5 rounded-[8px] border border-white/10 bg-surface-high/60 px-3 py-1.5 text-[11px] font-medium text-white/46 transition-[border-color,color,background-color] duration-150 hover:border-white/18 hover:bg-surface-high hover:text-white/72"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Registrar
          </button>
        ) : null}
      </div>

      {/* Add update form */}
      {formOpen ? (
        <form
          onSubmit={(e) => { void handleSubmit(e) }}
          className="mt-4 rounded-[16px] border border-white/8 bg-surface-container/60 p-4 space-y-3"
        >
          {/* Type selector */}
          <div className="flex flex-wrap gap-1.5">
            {ALL_UPDATE_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition-opacity duration-150 ${
                  UPDATE_TYPE_COLOR_CLASS[t]
                } ${type === t ? 'opacity-100' : 'opacity-38 hover:opacity-60'}`}
              >
                {UPDATE_TYPE_LABEL[t]}
              </button>
            ))}
          </div>

          {/* Summary */}
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="O que foi alterado ou atualizado nesta tarefa?"
            required
            className="w-full rounded-[10px] border border-white/10 bg-surface-high/50 px-3.5 py-2.5 text-sm text-white/80 placeholder:text-white/18 focus:border-accent-indigo/40 focus:outline-none focus:ring-2 focus:ring-accent-indigo/14"
          />

          {/* Details */}
          <AutoResizeTextarea
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Detalhes adicionais (opcional)..."
            maxHeight={280}
            className="w-full resize-none rounded-[10px] border border-white/10 bg-surface-high/50 px-3.5 py-2.5 text-sm text-white/80 placeholder:text-white/18 focus:border-accent-indigo/40 focus:outline-none focus:ring-2 focus:ring-accent-indigo/14"
          />

          <label className="flex items-center gap-2 rounded-[12px] border border-white/8 bg-surface-base/44 px-3.5 py-3 text-sm text-white/72">
            <input
              type="checkbox"
              checked={updateTaskSummary}
              onChange={(e) => setUpdateTaskSummary(e.target.checked)}
              className="h-4 w-4 rounded border-white/12 bg-surface-high text-accent-indigo"
            />
            Atualizar resumo da tarefa
          </label>

          {updateTaskSummary ? (
            <AutoResizeTextarea
              rows={3}
              value={taskSummary}
              onChange={(e) => setTaskSummary(e.target.value)}
              placeholder="Atualize o resumo geral e estável da tarefa..."
              maxHeight={280}
              className="w-full resize-none rounded-[10px] border border-white/10 bg-surface-high/50 px-3.5 py-2.5 text-sm text-white/80 placeholder:text-white/18 focus:border-accent-indigo/40 focus:outline-none focus:ring-2 focus:ring-accent-indigo/14"
            />
          ) : null}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setFormOpen(false)
                setSummary('')
                setDetails('')
                setType('progress')
                setUpdateTaskSummary(false)
                setTaskSummary(task.what_was_done ?? '')
              }}
              className="rounded-[8px] border border-white/8 bg-surface-high/40 px-3.5 py-1.5 text-xs font-medium text-white/40 transition-[color,border-color] duration-150 hover:border-white/14 hover:text-white/64"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !summary.trim()}
              className="flex items-center gap-1.5 rounded-[8px] bg-linear-to-r from-accent-indigo to-accent-violet px-4 py-1.5 text-xs font-semibold text-white shadow-[0_4px_14px_rgba(99,102,241,0.18)] transition-[filter,opacity] duration-150 hover:brightness-110 disabled:opacity-40"
            >
              {submitting ? (
                <span className="h-3 w-3 animate-spin rounded-full border border-white/20 border-t-white/80" />
              ) : null}
              Registrar
            </button>
          </div>
        </form>
      ) : null}

      {/* Timeline */}
      {updates.length === 0 ? (
        <p className="mt-4 text-center text-sm text-white/22">Nenhuma atualização registrada</p>
      ) : (
        <Timeline
          sx={{
            mt: formOpen ? 2 : 1,
            mb: 0,
            p: 0,
            [`& .MuiTimelineItem-root:before`]: { display: 'none' },
          }}
        >
          {updates.map((update, index) => (
            <TimelineItem
              key={update.id}
              sx={{ minHeight: 'unset', alignItems: 'flex-start' }}
            >
              <TimelineSeparator>
                <TimelineDot
                  sx={{
                    m: 0,
                    mt: '14px',
                    width: 12,
                    height: 12,
                    p: 0,
                    flexShrink: 0,
                    backgroundColor: UPDATE_TYPE_COLOR[update.update_type],
                    borderColor: UPDATE_TYPE_COLOR[update.update_type],
                    boxShadow: UPDATE_TYPE_GLOW[update.update_type],
                  }}
                />
                {index < updates.length - 1 ? (
                  <TimelineConnector
                    sx={{
                      width: '2px',
                      minHeight: 20,
                      borderRadius: '999px',
                      background: 'linear-gradient(180deg,rgba(99,102,241,0.22),rgba(255,255,255,0.04))',
                    }}
                  />
                ) : null}
              </TimelineSeparator>

              <TimelineContent sx={{ py: 0, pr: 0, pl: 2.5, mb: index < updates.length - 1 ? 1.5 : 0 }}>
                <div className="rounded-[14px] border border-white/6 bg-surface-container/40 px-4 py-3">
                  {/* Top row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${UPDATE_TYPE_COLOR_CLASS[update.update_type]}`}
                    >
                      {UPDATE_TYPE_LABEL[update.update_type]}
                    </span>
                    <span className="text-[11px] text-white/28">
                      {formatRelativeDate(update.created_at)}
                    </span>
                  </div>

                  {/* Summary */}
                  {update.summary ? (
                    <p className="mt-2 text-sm leading-5 text-white/76">{update.summary}</p>
                  ) : null}

                  {/* Status change */}
                  {update.update_type === 'status_change' && update.old_status && update.new_status ? (
                    <div className="mt-2 flex items-center gap-2">
                      {(() => {
                        const oldOpt = STATUS_CHIP_OPTIONS.find((o) => o.value === update.old_status)
                        const newOpt = STATUS_CHIP_OPTIONS.find((o) => o.value === update.new_status)
                        return (
                          <>
                            {oldOpt ? (
                              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${oldOpt.colorClass}`}>
                                {oldOpt.label}
                              </span>
                            ) : <span className="text-[10px] text-white/40">{update.old_status}</span>}
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-white/24">
                              <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {newOpt ? (
                              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${newOpt.colorClass}`}>
                                {newOpt.label}
                              </span>
                            ) : <span className="text-[10px] text-white/40">{update.new_status}</span>}
                          </>
                        )
                      })()}
                    </div>
                  ) : null}

                  {/* Details */}
                  {update.details ? (
                    <p className="mt-2 line-clamp-3 font-mono text-xs leading-5 text-white/36">
                      {update.details}
                    </p>
                  ) : null}
                </div>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      )}
    </div>
  )
}
