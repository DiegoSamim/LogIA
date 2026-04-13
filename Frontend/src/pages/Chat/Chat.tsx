import { useRef, useState } from 'react'
import type { ChatMode } from '@/data/dtos'
import icon from '@/assets/Icon.png'
import { useAuthProfile } from '@/hooks/useAuthProfile'
import { useChatUiStore } from '@/store/useChatUiStore'
import './Chat.css'

interface ChatMessageViewModel {
  id: string
  sender: 'assistant' | 'user'
  content: string
  tone: 'standard' | 'highlight'
  suggestions?: string[]
  references?: string[]
  orderedItems?: string[]
}

interface SidePanelSection {
  title: string
  content: React.ReactNode
}

const CHAT_COPY: Record<
  ChatMode,
  {
    messages: ChatMessageViewModel[]
    fixedQuestions?: string[]
    panelSections: SidePanelSection[]
  }
> = {
  register: {
    messages: [
      {
        id: 'register-1',
        sender: 'assistant',
        tone: 'standard',
        content:
          'Vamos registrar sua sessão de trabalho. Me conte o que você desenvolveu, em qual parte do projeto atuou e se houve alguma decisão técnica importante.',
      },
      {
        id: 'register-2',
        sender: 'user',
        tone: 'highlight',
        content:
          'Hoje estruturei a base do fluxo de chat do LogIA, definindo os estados de registro e consulta e organizando a interface inicial para orientar o preenchimento das tarefas.',
      },
      {
        id: 'register-3',
        sender: 'assistant',
        tone: 'standard',
        content:
          'Ótimo. Para transformar isso em um registro útil, podemos detalhar o resultado entregue, a abordagem adotada e o que precisa ser continuado na próxima sessão.',
        suggestions: [
          'Quais componentes foram criados?',
          'Houve alguma decisão de UX importante?',
          'Existe algo bloqueando a continuação?',
        ],
      },
    ],
    panelSections: [
      {
        title: 'Preview do registro',
        content: (
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">Título sugerido</p>
              <p className="mt-2 text-sm font-semibold text-white/88">Base visual da experiência de chat</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs text-white/52">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Status</p>
                <p className="mt-2 text-amber-300">Em andamento</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Categoria</p>
                <p className="mt-2 text-white/74">ui_ux</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Stack principal</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {['React', 'TypeScript', 'Tailwind'].map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-accent-indigo/18 bg-accent-indigo/8 px-2.5 py-1 text-[11px] text-accent-indigo/88"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ),
      },
      {
        title: 'Atividade recente',
        content: (
          <div className="space-y-3">
            {[
              ['Estrutura inicial da tela de projetos', '2h atrás'],
              ['Ajustes no header autenticado', '58 min atrás'],
              ['Fluxo de logout otimista', '21 min atrás'],
            ].map(([title, time]) => (
              <div key={title} className="flex gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-violet/70" />
                <div>
                  <p className="text-xs text-white/72">{title}</p>
                  <p className="mt-1 text-[11px] text-white/28">{time}</p>
                </div>
              </div>
            ))}
          </div>
        ),
      },
    ],
  },
  query: {
    messages: [
      {
        id: 'query-1',
        sender: 'assistant',
        tone: 'standard',
        content:
          'Com base no histórico disponível, o time já consolidou uma direção visual para a experiência de chat e separou claramente a fase de interface da fase de integração com backend.',
        orderedItems: [
          'Definir uma tela dual-mode com alternância entre registro e consulta.',
          'Manter um painel contextual à direita para apoiar leitura da sessão.',
          'Reutilizar o shell atual do app sem mudar o header global.',
        ],
        references: ['chat_sessions', 'chat_messages', 'tasks', 'project_profiles'],
      },
    ],
    fixedQuestions: [
      'O que fiz essa semana?',
      'Quais bloqueios já registrei?',
      'Resumo técnico do projeto',
      'Tarefas ainda em aberto',
    ],
    panelSections: [
      {
        title: 'Contexto da consulta',
        content: (
          <div className="space-y-4 text-xs text-white/56">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Fonte principal</p>
              <p className="mt-2 text-white/78">Histórico técnico do LogIA</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Escopo sugerido</p>
              <p className="mt-2 leading-relaxed">
                Conversas de registro, updates de tarefa e decisões sobre experiência visual do frontend.
              </p>
            </div>
          </div>
        ),
      },
      {
        title: 'Atalhos de filtro',
        content: (
          <div className="flex flex-wrap gap-2">
            {['Frontend', 'UI/UX', 'Integração', 'Arquitetura'].map((item) => (
              <button
                key={item}
                type="button"
                className="rounded-full border border-white/10 bg-surface-high px-3 py-1.5 text-[11px] text-white/52 transition-colors duration-150 hover:border-accent-indigo/26 hover:text-white/82"
              >
                {item}
              </button>
            ))}
          </div>
        ),
      },
    ],
  },
}

function LogoAvatar() {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-accent-indigo/18 bg-linear-to-br from-accent-indigo/20 via-accent-indigo/12 to-accent-violet/18 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
      <img src={icon} alt="LogIA" className="h-5 w-5 object-contain" />
    </div>
  )
}

function UserAvatar({ initials }: { initials: string }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-surface-high text-xs font-bold tracking-[0.14em] text-white/88 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
      {initials}
    </div>
  )
}

function ChatMessage({
  message,
  userInitials,
}: {
  message: ChatMessageViewModel
  userInitials: string
}) {
  const isAssistant = message.sender === 'assistant'

  return (
    <div className={['chat-card-enter flex items-start gap-4', isAssistant ? '' : 'justify-end'].join(' ')}>
      {isAssistant && <LogoAvatar />}

      <article
        className={[
          'chat-message-glow max-w-3xl rounded-[22px] border px-5 py-4 sm:px-6',
          isAssistant
            ? 'border-white/8 bg-surface-container/92 text-white/82'
            : 'border-accent-indigo/24 bg-[linear-gradient(180deg,rgba(22,24,40,0.98),rgba(19,22,30,0.96))] text-white/90',
          message.tone === 'highlight' && isAssistant ? 'border-accent-indigo/18' : '',
        ].join(' ')}
      >
        <p className="text-[15px] leading-8">{message.content}</p>

        {message.orderedItems && (
          <ol className="mt-5 space-y-3">
            {message.orderedItems.map((item, index) => (
              <li key={item} className="flex gap-3">
                <span className="text-sm font-semibold text-accent-violet/88">
                  {String(index + 1).padStart(2, '0')}.
                </span>
                <span className="text-[15px] leading-7 text-white/70">{item}</span>
              </li>
            ))}
          </ol>
        )}

        {message.suggestions && (
          <div className="mt-5 flex flex-wrap gap-2.5">
            {message.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="rounded-full border border-white/9 bg-surface-high px-3.5 py-2 text-[11px] font-medium text-white/48 transition-[border-color,color,transform] duration-150 hover:border-accent-indigo/26 hover:text-white/76 hover:-translate-y-0.5"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {message.references && (
          <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px] tracking-[0.14em] text-white/30 uppercase">
            <span className="text-accent-indigo/70">Fonte</span>
            {message.references.map((reference) => (
              <span key={reference} className="rounded-full border border-accent-indigo/14 bg-accent-indigo/7 px-2.5 py-1 text-accent-indigo/82">
                {reference}
              </span>
            ))}
          </div>
        )}
      </article>

      {!isAssistant && <UserAvatar initials={userInitials} />}
    </div>
  )
}

function SidePanel({ sections, onClose }: { sections: SidePanelSection[]; onClose: () => void }) {
  return (
    <div className="chat-panel-card flex h-full min-h-0 flex-col p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.24em] text-white/28 uppercase">Painel contextual</p>
          <p className="mt-1 text-sm font-semibold text-white/86">Contexto da sessão</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-accent-indigo/18 bg-accent-indigo/10 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-accent-indigo/84 uppercase">
            Preview
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar painel contextual"
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

export default function Chat() {
  const [draft, setDraft] = useState('')
  const [isPanelOpen, setIsPanelOpen] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { initials } = useAuthProfile()
  const { mode, setMode } = useChatUiStore()
  const content = CHAT_COPY[mode]
  const userInitials = initials || 'U'

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setDraft('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setDraft(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }

  return (
    <div className="chat-shell relative h-full overflow-hidden bg-surface-base">
      <div className="relative z-10 flex h-full min-h-0 flex-col px-2 pb-2 pt-2 sm:px-3 sm:pb-3 sm:pt-3">
        <div className="mx-auto flex h-full min-h-0 w-full max-w-[1520px] flex-col gap-3">
          <div className="chat-card-enter flex justify-center md:hidden">
            <div className="chat-toggle-pill inline-flex rounded-full border border-white/8 bg-surface-container/72 p-1">
              {([
                ['register', 'Registro'],
                ['query', 'Consulta'],
              ] as Array<[ChatMode, string]>).map(([value, label]) => {
                const active = mode === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMode(value)}
                    className={[
                      'rounded-full px-3.5 py-2 text-[10px] font-semibold tracking-[0.2em] uppercase transition-[background-color,color,box-shadow,transform] duration-200 sm:px-4',
                      active
                        ? 'chat-toggle-active bg-linear-to-r from-accent-indigo to-accent-violet text-white'
                        : 'text-white/40 hover:text-white/72',
                    ].join(' ')}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex min-h-0 flex-1 gap-3">
            {/* Chat area */}
            <section className="chat-card-enter flex h-full min-h-0 flex-1 flex-col rounded-[5px] border border-white/7 bg-[linear-gradient(180deg,rgba(19,22,30,0.88),rgba(13,15,20,0.88))] backdrop-blur-xl">
              <div className="chat-scroll flex-1 min-h-0 space-y-6 overflow-y-auto px-4 py-5 sm:px-5">
                {content.messages.map((message) => (
                  <ChatMessage key={message.id} message={message} userInitials={userInitials} />
                ))}

                {mode === 'query' && content.fixedQuestions && (
                  <div className="chat-card-enter">
                    <p className="mb-3 text-[10px] font-semibold tracking-[0.18em] text-white/28 uppercase">Perguntas frequentes</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {content.fixedQuestions.map((question) => (
                        <button
                          key={question}
                          type="button"
                          className="rounded-[6px] border border-white/8 bg-surface-container/54 px-4 py-3 text-left text-[13px] text-white/56 transition-[border-color,background-color,color] duration-150 hover:border-accent-violet/26 hover:bg-surface-high/40 hover:text-white/82"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {mode === 'register' && (
                <div className="mt-auto border-t border-white/6 px-3 py-3 sm:px-4">
                  <form onSubmit={handleSubmit} className="rounded-3xl border border-white/8 bg-surface-container/86 p-3 shadow-[0_16px_42px_rgba(0,0,0,0.24)]">
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
              )}
            </section>

            {/* Context panel — collapses to slim strip */}
            <div
              className={[
                'chat-card-enter-delay hidden xl:flex h-full min-h-0 shrink-0 flex-col overflow-hidden rounded-[5px] border border-white/8 bg-surface-container/86 backdrop-blur-xl',
                'transition-[width] duration-220 ease-in-out',
                isPanelOpen ? 'w-[288px]' : 'w-10',
              ].join(' ')}
            >
              {isPanelOpen ? (
                <SidePanel sections={content.panelSections} onClose={() => setIsPanelOpen(false)} />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsPanelOpen(true)}
                  aria-label="Abrir painel contextual"
                  className="flex flex-1 items-center justify-center text-white/36 transition-colors duration-150 hover:text-white/68"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
