export default function Sobre() {
  return (
    <div className="min-h-full bg-surface-base px-6 pb-16 pt-8 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-card border border-white/8 bg-surface-container p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-surface-high text-white/35">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4" />
              <path d="M12 16h.01" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white/90">Detalhes do projeto ainda não conectados</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/40">
            Esta tela usava dados mockados e agora foi deixada sem conteúdo estático. Quando a integração real estiver pronta, os dados passam a aparecer aqui.
          </p>
        </div>
      </div>
    </div>
  )
}
