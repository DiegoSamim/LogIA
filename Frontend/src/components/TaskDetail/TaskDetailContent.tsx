import type { TaskDTO, UpdateTaskRequest } from '@/data/dtos'
import AutoResizeTextarea from '@/components/ui/AutoResizeTextarea'

interface Props {
  task: TaskDTO
  isEditing: boolean
  draft: UpdateTaskRequest
  onDraftChange: (patch: Partial<UpdateTaskRequest>) => void
  onEdit: () => void
}

function Section({
  label,
  children,
  accent,
}: {
  label: string
  children: React.ReactNode
  accent?: string
}) {
  return (
    <div className="rounded-[20px] border border-white/7 bg-[linear-gradient(180deg,rgba(17,19,26,0.96),rgba(13,15,20,0.98))] px-5 py-4">
      <p className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${accent ?? 'text-white/28'}`}>
        {label}
      </p>
      <div className="mt-3">{children}</div>
    </div>
  )
}

function EmptyCta({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-white/10 py-4 text-xs text-white/26 transition-colors duration-150 hover:border-accent-indigo/28 hover:text-accent-indigo/58"
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      {label}
    </button>
  )
}

const textareaClass =
  'w-full rounded-[10px] border border-white/10 bg-surface-high/50 px-3.5 py-3 text-sm leading-6 text-white/80 placeholder:text-white/18 focus:border-accent-indigo/40 focus:outline-none focus:ring-2 focus:ring-accent-indigo/14 resize-none'

const textClass = 'text-sm leading-6 text-white/76 whitespace-pre-wrap'

export default function TaskDetailContent({ task, isEditing, draft, onDraftChange, onEdit }: Props) {
  const showBlocked = task.status === 'blocked' || isEditing

  return (
    <div className="space-y-3">
      <Section label="Resumo da tarefa">
        {isEditing ? (
          <AutoResizeTextarea
            rows={4}
            value={draft.what_was_done ?? ''}
            onChange={(e) => onDraftChange({ what_was_done: e.target.value })}
            placeholder="Descreva de forma geral e estável o objetivo ou entrega principal da tarefa..."
            maxHeight={280}
            className={textareaClass}
          />
        ) : task.what_was_done ? (
          <p className={textClass}>{task.what_was_done}</p>
        ) : (
          <EmptyCta label="Adicionar resumo da tarefa" onClick={onEdit} />
        )}
      </Section>

      {/* Abordagem técnica */}
      <Section label="Abordagem técnica">
        {isEditing ? (
          <AutoResizeTextarea
            rows={4}
            value={draft.technical_approach ?? ''}
            onChange={(e) => onDraftChange({ technical_approach: e.target.value })}
            placeholder="Como foi implementado, decisões técnicas, padrões utilizados..."
            maxHeight={280}
            className={textareaClass}
          />
        ) : task.technical_approach ? (
          <p className={textClass}>{task.technical_approach}</p>
        ) : (
          <EmptyCta label="Adicionar abordagem técnica" onClick={onEdit} />
        )}
      </Section>

      {/* Próximos passos */}
      <Section label="Próximos passos">
        {isEditing ? (
          <AutoResizeTextarea
            rows={3}
            value={draft.next_steps ?? ''}
            onChange={(e) => onDraftChange({ next_steps: e.target.value })}
            placeholder="O que deve ser feito a seguir..."
            maxHeight={280}
            className={textareaClass}
          />
        ) : task.next_steps ? (
          <p className={textClass}>{task.next_steps}</p>
        ) : (
          <EmptyCta label="Adicionar próximos passos" onClick={onEdit} />
        )}
      </Section>

      {/* Motivo do bloqueio */}
      {showBlocked ? (
        <Section label="Motivo do bloqueio" accent="text-orange-300/60">
          {isEditing ? (
            <AutoResizeTextarea
              rows={3}
              value={draft.blocked_reason ?? ''}
              onChange={(e) => onDraftChange({ blocked_reason: e.target.value })}
              placeholder="Descreva o que está impedindo o progresso..."
              maxHeight={280}
              className={`${textareaClass} border-orange-400/14 focus:border-orange-400/30 focus:ring-orange-400/10`}
            />
          ) : task.blocked_reason ? (
            <p className="text-sm leading-6 text-orange-200/70 whitespace-pre-wrap">{task.blocked_reason}</p>
          ) : (
            <EmptyCta label="Adicionar motivo do bloqueio" onClick={onEdit} />
          )}
        </Section>
      ) : null}
    </div>
  )
}
