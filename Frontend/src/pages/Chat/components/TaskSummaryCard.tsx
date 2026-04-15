import type { TaskSummaryViewModel } from '@/pages/Chat/types'
import LogoAvatar from './LogoAvatar'

function SummaryField({
  label,
  value,
  compact = false,
  multiline = false,
  tone = 'default',
  kind = 'text',
}: TaskSummaryViewModel['topFields'][number]) {
  const toneClass =
    tone === 'strong' ? 'text-white/90 font-semibold' : tone === 'muted' ? 'text-white/48' : 'text-white/72'

  return (
    <div
      className={[
        'rounded-[16px] border border-white/6 bg-surface-base/58 px-4 py-3',
        compact ? '' : 'md:col-span-2',
      ].join(' ')}
    >
      <p className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">{label}</p>
      {kind === 'tags' && Array.isArray(value) ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="rounded-[999px] border border-accent-indigo/18 bg-accent-indigo/8 px-2.5 py-1 text-[11px] font-medium text-accent-indigo/80"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : (
        <p className={['mt-2 text-sm', multiline ? 'whitespace-pre-line leading-6' : '', toneClass].join(' ')}>
          {Array.isArray(value) ? value.join(', ') : value}
        </p>
      )}
    </div>
  )
}

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
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {summary.topFields.map((field) => (
                <SummaryField key={field.label} {...field} />
              ))}
            </div>

            {summary.detailFields.length > 0 && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {summary.detailFields.map((field) => (
                  <SummaryField key={field.label} {...field} />
                ))}
              </div>
            )}

            {summary.skippedFields.length > 0 && (
              <div className="rounded-[16px] border border-dashed border-white/10 bg-surface-base/42 px-4 py-4">
                <p className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">Campos pulados</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {summary.skippedFields.map((field) => (
                    <span
                      key={field}
                      className="rounded-[999px] border border-white/10 bg-white/4 px-2.5 py-1 text-[11px] text-white/42"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}
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
