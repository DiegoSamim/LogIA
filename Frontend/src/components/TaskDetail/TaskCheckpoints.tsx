import { useState } from 'react'
import type { TaskCheckpointDTO } from '@/data/dtos'
import { taskService } from '@/services/task.service'

interface Props {
  taskId: string
  checkpoints: TaskCheckpointDTO[]
  onNewCheckpoint: (checkpoint: TaskCheckpointDTO) => void
  onToggle: (id: string, isDone: boolean) => void
}

export default function TaskCheckpoints({ taskId, checkpoints, onNewCheckpoint, onToggle }: Props) {
  const total = checkpoints.length
  const done = checkpoints.filter((c) => c.is_done).length
  const pct = total > 0 ? Math.round((done / total) * 100) : 0
  const [formOpen, setFormOpen] = useState(total === 0)
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedDescription = description.trim()
    if (!trimmedDescription) return

    setSubmitting(true)
    try {
      const nextOrderIndex = checkpoints.length > 0
        ? Math.max(...checkpoints.map((checkpoint) => checkpoint.order_index)) + 1
        : 0
      const { data } = await taskService.createCheckpoint(taskId, {
        description: trimmedDescription,
        order_index: nextOrderIndex,
      })
      onNewCheckpoint(data)
      setDescription('')
      setFormOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-[22px] border border-white/7 bg-[linear-gradient(180deg,rgba(17,19,26,0.96),rgba(13,15,20,0.98))] px-5 py-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/28">
          Checkpoints
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[11px] tabular-nums text-white/36">
            {done}/{total}
          </span>
          {!formOpen ? (
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-1.5 rounded-[8px] border border-white/10 bg-surface-high/60 px-3 py-1.5 text-[11px] font-medium text-white/46 transition-[border-color,color,background-color] duration-150 hover:border-white/18 hover:bg-surface-high hover:text-white/72"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              Adicionar
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/6">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent-indigo to-emerald-400 transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {formOpen ? (
        <form
          onSubmit={(e) => { void handleSubmit(e) }}
          className="mt-4 space-y-3 rounded-[16px] border border-white/8 bg-surface-container/60 p-4"
        >
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o novo checkpoint..."
            required
            className="w-full rounded-[10px] border border-white/10 bg-surface-high/50 px-3.5 py-2.5 text-sm text-white/80 placeholder:text-white/18 focus:border-accent-indigo/40 focus:outline-none focus:ring-2 focus:ring-accent-indigo/14"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setFormOpen(false)
                setDescription('')
              }}
              className="rounded-[8px] border border-white/8 bg-surface-high/40 px-3.5 py-1.5 text-xs font-medium text-white/40 transition-[color,border-color] duration-150 hover:border-white/14 hover:text-white/64"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || !description.trim()}
              className="flex items-center gap-1.5 rounded-[8px] bg-linear-to-r from-accent-indigo to-accent-violet px-4 py-1.5 text-xs font-semibold text-white shadow-[0_4px_14px_rgba(99,102,241,0.18)] transition-[filter,opacity] duration-150 hover:brightness-110 disabled:opacity-40"
            >
              {submitting ? (
                <span className="h-3 w-3 animate-spin rounded-full border border-white/20 border-t-white/80" />
              ) : null}
              Salvar checkpoint
            </button>
          </div>
        </form>
      ) : null}

      {total > 0 ? (
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
      ) : (
        <p className="mt-4 text-center text-sm text-white/22">
          Nenhum checkpoint registrado
        </p>
      )}
    </div>
  )
}
