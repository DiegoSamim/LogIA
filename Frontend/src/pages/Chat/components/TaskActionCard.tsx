import LogoAvatar from './LogoAvatar'

export default function TaskActionCard({
  onSelect,
  disableUpdate,
  disabled = false,
}: {
  onSelect: (action: 'create' | 'update') => void
  disableUpdate: boolean
  disabled?: boolean
}) {
  return (
    <div className="chat-card-enter flex items-start gap-4">
      <LogoAvatar />
      <div className="grid max-w-3xl flex-1 grid-cols-1 gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={() => onSelect('create')}
          disabled={disabled}
          className="rounded-[22px] border border-accent-indigo/18 bg-[linear-gradient(180deg,rgba(22,24,40,0.96),rgba(16,18,29,0.96))] p-5 text-left transition-[border-color,transform,opacity] duration-150 hover:-translate-y-0.5 hover:border-accent-indigo/34 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <p className="text-sm font-semibold text-white/88">Criar nova tarefa</p>
          <p className="mt-2 text-xs leading-5 text-white/54">Registrar uma tarefa nova com o mínimo de campos obrigatórios.</p>
        </button>
        <button
          type="button"
          onClick={() => onSelect('update')}
          disabled={disableUpdate || disabled}
          className="rounded-[22px] border border-white/10 bg-surface-container/88 p-5 text-left transition-[border-color,transform,opacity] duration-150 hover:-translate-y-0.5 hover:border-white/18 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <p className="text-sm font-semibold text-white/88">Atualizar tarefa existente</p>
          <p className="mt-2 text-xs leading-5 text-white/54">
            {disableUpdate
              ? 'Ainda não existem tarefas neste projeto.'
              : 'Selecionar uma tarefa existente e registrar um update simples.'}
          </p>
        </button>
      </div>
    </div>
  )
}
