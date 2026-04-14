import { useRef, useState } from 'react'
import type { RegularChatFlowProps, SidePanelSection } from '@/pages/Chat/types'
import { QUERY_COPY } from '@/pages/Chat/constants'
import ChatMessage from '@/pages/Chat/components/ChatMessage'
import SidePanel from '@/pages/Chat/components/SidePanel'

export default function RegularChatFlow({
  userInitials,
  isPanelOpen,
  onTogglePanel,
}: RegularChatFlowProps) {
  const [draft, setDraft] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setDraft(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }

  function handleRegularSubmit(event: React.FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    setDraft('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const panelSections: SidePanelSection[] = QUERY_COPY.panelSections

  return (
    <>
      <section className="chat-card-enter relative flex h-full min-h-0 flex-1 flex-col rounded-[5px] border border-white/7 bg-[linear-gradient(180deg,rgba(19,22,30,0.88),rgba(13,15,20,0.88))] backdrop-blur-xl">
        <div className="chat-scroll flex-1 min-h-0 space-y-6 overflow-y-auto px-4 py-5 sm:px-5">
          {QUERY_COPY.messages.map((message) => (
            <ChatMessage key={message.id} message={message} userInitials={userInitials} />
          ))}
          <div className="chat-card-enter">
            <p className="mb-3 text-[10px] font-semibold tracking-[0.18em] text-white/28 uppercase">Perguntas frequentes</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {QUERY_COPY.fixedQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  className="rounded-[6px] border border-white/8 bg-surface-container/54 px-4 py-3 text-left text-[13px] text-white/56 transition-[border-color,background-color,color] duration-150 hover:border-accent-violet/26 hover:bg-surface-high/40 hover:text-white/82"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-auto border-t border-white/6 px-3 py-3 sm:px-4">
          <form onSubmit={handleRegularSubmit} className="rounded-3xl border border-white/8 bg-surface-container/86 p-3 shadow-[0_16px_42px_rgba(0,0,0,0.24)]">
            <div className="flex items-end gap-3">
              <textarea
                ref={textareaRef}
                rows={1}
                value={draft}
                onChange={handleTextareaChange}
                placeholder="Descreva o que você avançou hoje, quais decisões tomou e o que ainda ficou pendente..."
                className="min-h-11 flex-1 resize-none overflow-hidden rounded-[18px] border border-white/7 bg-surface-base/88 px-4 py-3 text-sm leading-6 text-white/86 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-white/24 focus:border-accent-indigo/38 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
              />
              <button
                type="submit"
                className="h-11 min-w-34 shrink-0 rounded-[18px] bg-linear-to-r from-accent-indigo to-accent-violet px-4 text-xs font-semibold tracking-[0.18em] text-white uppercase transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98]"
              >
                Registrar
              </button>
            </div>
          </form>
        </div>
      </section>

      <div
        className={[
          'chat-card-enter-delay hidden xl:flex h-full min-h-0 shrink-0 flex-col overflow-hidden rounded-[5px] border border-white/8 bg-surface-container/86 backdrop-blur-xl',
          'transition-[width] duration-[220ms] ease-in-out',
          isPanelOpen ? 'w-[288px]' : 'w-10',
        ].join(' ')}
      >
        {isPanelOpen ? (
          <SidePanel sections={panelSections} onClose={() => onTogglePanel(false)} label="Contexto da sessão" />
        ) : (
          <button
            type="button"
            onClick={() => onTogglePanel(true)}
            aria-label="Abrir painel contextual"
            className="flex flex-1 items-center justify-center text-white/36 transition-colors duration-150 hover:text-white/68"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
      </div>
    </>
  )
}
