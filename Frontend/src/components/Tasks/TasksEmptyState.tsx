interface Props {
  hasProject: boolean
  hasFilters: boolean
  onGoToChat: () => void
  onClearFilters: () => void
}

export default function TasksEmptyState({ hasProject, hasFilters, onGoToChat, onClearFilters }: Props) {
  if (!hasProject) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-card border border-white/8 bg-surface-container/60 px-8 py-14 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-white/8 bg-surface-high">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/30">
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-white/70">Nenhum projeto selecionado</p>
          <p className="mt-1 text-xs leading-5 text-white/36">
            Vá ao Chat para criar ou selecionar um projeto.
          </p>
        </div>
        <button
          type="button"
          onClick={onGoToChat}
          className="mt-1 rounded-[6px] border border-white/10 bg-surface-high px-4 py-2 text-xs font-semibold tracking-[0.14em] text-white/68 uppercase transition-[border-color,color] duration-150 hover:border-white/20 hover:text-white/88"
        >
          Ir para o Chat
        </button>
      </div>
    )
  }

  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-card border border-white/8 bg-surface-container/60 px-8 py-14 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-white/8 bg-surface-high">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/30">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-white/70">Nenhum resultado encontrado</p>
          <p className="mt-1 text-xs leading-5 text-white/36">
            Os filtros ativos não retornaram nenhuma tarefa.
          </p>
        </div>
        <button
          type="button"
          onClick={onClearFilters}
          className="mt-1 text-xs text-white/38 underline-offset-2 transition-colors duration-150 hover:text-white/68 hover:underline"
        >
          Limpar filtros
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-card border border-dashed border-white/8 bg-surface-container/40 px-8 py-14 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-[10px] border border-white/8 bg-surface-high">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/30">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-white/70">Nenhuma tarefa ainda</p>
        <p className="mt-1 text-xs leading-5 text-white/36">
          Registre sua primeira tarefa pelo Chat.
        </p>
      </div>
      <button
        type="button"
        onClick={onGoToChat}
        className="mt-1 rounded-[6px] bg-linear-to-r from-accent-indigo to-indigo-500 px-4 py-2 text-xs font-semibold tracking-[0.14em] text-white uppercase transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98]"
      >
        Registrar Tarefa
      </button>
    </div>
  )
}
