import type { SidePanelSection } from '@/pages/Chat/types'

export default function SidePanel({
  sections,
  onClose,
  label = 'Contexto da sessão',
}: {
  sections: SidePanelSection[]
  onClose: () => void
  label?: string
}) {
  return (
    <div className="chat-panel-card flex h-full min-h-0 flex-col p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.24em] text-white/28 uppercase">Painel contextual</p>
          <p className="mt-1 text-sm font-semibold text-white/86">{label}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-accent-indigo/18 bg-accent-indigo/10 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-accent-indigo/84 uppercase">
            Preview
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar painel"
            className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-white/8 bg-surface-high text-white/40 transition-[border-color,color] duration-150 hover:border-white/16 hover:text-white/72"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
      <div className="chat-scroll min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {sections.map((section) => (
          <section key={section.title} className="rounded-[3px] border border-white/5 bg-surface-base/72 p-4">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">{section.title}</p>
            <div className="mt-3">{section.content}</div>
          </section>
        ))}
      </div>
    </div>
  )
}
