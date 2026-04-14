import type { TaskSummaryViewModel } from '@/pages/Chat/types'
import LogoAvatar from './LogoAvatar'

export default function TaskSummaryCard({
  summary,
  onConfirm,
  onEdit,
  saving,
}: {
  summary: TaskSummaryViewModel
  onConfirm: () => void
  onEdit: () => void
  saving: boolean
}) {
  return (
    <div className="chat-card-enter flex items-start gap-4">
      <LogoAvatar />
      <div className="flex-1 max-w-3xl space-y-4">
        <article className="chat-message-glow rounded-[22px] border border-white/8 bg-surface-container/92 px-5 py-4 sm:px-6">
          <p className="text-[15px] leading-8 text-white/82">Aqui está o resumo do registro. Tudo certo para salvar?</p>
        </article>

        <div className="chat-message-glow rounded-[22px] border border-accent-indigo/20 bg-[linear-gradient(180deg,rgba(19,22,36,0.96),rgba(13,15,22,0.96))] px-5 py-5 sm:px-6">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">Ação</p>
              <p className="mt-1.5 text-sm font-semibold text-white/90">{summary.actionLabel}</p>
            </div>
            {summary.taskName && (
              <div>
                <p className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">Tarefa</p>
                <p className="mt-1.5 text-sm text-white/74">{summary.taskName}</p>
              </div>
            )}
            <div>
              <p className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">{summary.title}</p>
              <p className="mt-1.5 text-sm font-semibold text-white/90">{summary.taskName ?? 'Nova tarefa'}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">Status</p>
              <p className="mt-1.5 text-sm text-white/74">{summary.statusLabel}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">{summary.summaryLabel}</p>
              <p className="mt-1.5 text-sm leading-6 text-white/70">{summary.summaryValue}</p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2.5 border-t border-white/6 pt-5">
            <button
              type="button"
              onClick={onConfirm}
              disabled={saving}
              className="flex items-center gap-2 rounded-[14px] bg-linear-to-r from-accent-indigo to-accent-violet px-5 py-2.5 text-xs font-semibold tracking-[0.18em] text-white uppercase transition-[filter,transform,opacity] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
            >
              {saving && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
              {saving ? 'Salvando...' : 'Confirmar e salvar'}
            </button>
            <button
              type="button"
              onClick={onEdit}
              disabled={saving}
              className="rounded-[14px] border border-white/10 bg-surface-high px-5 py-2.5 text-xs font-medium text-white/48 transition-[border-color,color] duration-150 hover:border-white/20 hover:text-white/72 disabled:opacity-50"
            >
              Editar respostas
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
