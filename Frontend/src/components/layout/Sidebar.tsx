import { useEffect } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import icon from '@/assets/Icon.png'
import { chatService } from '@/services/chat.service'
import { useAppStore } from '@/store/useAppStore'
import { useChatUiStore } from '@/store/useChatUiStore'
import { useQuerySessionsStore } from '@/store/useQuerySessionsStore'
import type { ChatSessionDTO, QueryRunStatus } from '@/data/dtos'

const EMPTY_QUERY_SESSIONS: ChatSessionDTO[] = []

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    label: 'Chat',
    to: '/chat',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    label: 'Tarefas',
    to: '/tasks',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  {
    label: 'Sobre',
    to: '/projects',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

function getQueryStatusPresentation(status: QueryRunStatus | null | undefined) {
  if (status === 'pending') {
    return {
      label: 'Na fila',
      dotClass: 'bg-amber-300 animate-pulse',
      textClass: 'text-amber-300',
      cardClass: 'border-amber-400/20 bg-amber-400/6',
    }
  }
  if (status === 'running') {
    return {
      label: 'Respondendo',
      dotClass: 'bg-indigo-300 animate-pulse',
      textClass: 'text-indigo-300',
      cardClass: 'border-indigo-400/20 bg-indigo-400/8',
    }
  }
  if (status === 'failed') {
    return {
      label: 'Erro',
      dotClass: 'bg-rose-300 animate-pulse',
      textClass: 'text-rose-300',
      cardClass: 'border-rose-400/22 bg-rose-400/8',
    }
  }
  if (status === 'cancelled') {
    return {
      label: 'Cancelada',
      dotClass: 'bg-slate-400',
      textClass: 'text-slate-300',
      cardClass: 'border-white/8 bg-surface-container/60',
    }
  }
  if (status === 'completed') {
    return {
      label: 'Respondida',
      dotClass: 'bg-emerald-300',
      textClass: 'text-emerald-300',
      cardClass: 'border-emerald-400/16 bg-emerald-400/6',
    }
  }
  return {
    label: 'Pronta',
    dotClass: 'bg-white/24',
    textClass: 'text-white/34',
    cardClass: 'border-white/8 bg-surface-container/50',
  }
}

function formatQuerySessionDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Agora'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(date).replace('.', '')
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { currentProject } = useAppStore()
  const setMode = useChatUiStore((state) => state.setMode)
  const activeSessionIdByProject = useQuerySessionsStore((state) => state.activeSessionIdByProject)
  const sessionsByProject = useQuerySessionsStore((state) => state.sessionsByProject)
  const setProjectSessions = useQuerySessionsStore((state) => state.setProjectSessions)
  const setActiveSession = useQuerySessionsStore((state) => state.setActiveSession)
  const resetProjectQuery = useQuerySessionsStore((state) => state.resetProjectQuery)

  const activeSessionId = currentProject ? activeSessionIdByProject[currentProject.id] ?? null : null
  const querySessions = currentProject ? sessionsByProject[currentProject.id] ?? EMPTY_QUERY_SESSIONS : EMPTY_QUERY_SESSIONS

  useEffect(() => {
    let active = true

    async function loadQuerySessions() {
      if (!currentProject?.id) return

      try {
        const { data } = await chatService.listByProject(currentProject.id)
        if (!active) return
        setProjectSessions(currentProject.id, data)
      } catch {
        // Sidebar de consulta é auxiliar; se falhar, não bloqueia a navegação principal.
      }
    }

    void loadQuerySessions()
    return () => {
      active = false
    }
  }, [currentProject?.id, setProjectSessions])

  function handleOpenQuerySession(session: ChatSessionDTO) {
    if (!currentProject) return
    setMode('query')
    setActiveSession(currentProject.id, session.id)
    navigate('/chat')
    onClose()
  }

  function handleNewSessionClick() {
    if (currentProject?.id) {
      resetProjectQuery(currentProject.id)
    }
  }

  return (
    <aside
      className={[
        'fixed inset-y-0 left-0 z-30 flex w-[196px] flex-col border-r border-white/[0.06] bg-surface-low transition-transform duration-200',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}
    >
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-btn bg-surface-high">
          <img src={icon} alt="LogIA" className="h-5 w-5 object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold leading-none text-white/90 font-['Sora']">
            Log<span className="text-accent-violet font-['Space_Grotesk'] font-bold">IA</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar sidebar"
          className="flex h-7 w-7 items-center justify-center rounded-btn border border-white/8 bg-surface-container text-white/45 transition-[border-color,color,background-color] duration-150 hover:border-white/14 hover:bg-surface-high hover:text-white/75"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col p-2 pt-3">
        <div className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((item) => {
            const isAboutItem = item.label === 'Sobre'
            const to = isAboutItem && currentProject?.id ? `/projects/${currentProject.id}/sobre` : item.to
            const isAboutActive = isAboutItem && pathname.startsWith('/projects/') && pathname.endsWith('/sobre')

            return (
              <NavLink
                key={`${item.label}-${to}`}
                to={to}
                className={({ isActive }) =>
                  [
                    'group flex items-center gap-3 rounded-btn px-3 py-2.5 text-sm transition-colors duration-150',
                    isActive || isAboutActive
                      ? 'bg-surface-high text-white/90'
                      : 'text-white/38 hover:bg-surface-container hover:text-white/70',
                  ].join(' ')
                }
              >
                {({ isActive }) => {
                  const active = isActive || isAboutActive
                  return (
                    <>
                      <span
                        className={[
                          'shrink-0 transition-colors duration-150',
                          active ? 'text-accent-indigo' : 'text-white/30 group-hover:text-white/55',
                        ].join(' ')}
                      >
                        {item.icon}
                      </span>
                      <span className="text-[13px] font-medium leading-none">{item.label}</span>
                      {active && (
                        <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-accent-indigo/70" />
                      )}
                    </>
                  )
                }}
              </NavLink>
            )
          })}
        </div>

        {currentProject && (
          <div className="mt-4 min-h-0 flex-1 overflow-hidden border-t border-white/[0.06] pt-3">
            <div className="mb-2 flex items-center justify-between px-2">
              <p className="text-[10px] font-semibold tracking-[0.18em] text-white/26 uppercase">Consultas</p>
              <span className="text-[10px] text-white/22">{querySessions.length}</span>
            </div>

            <div className="chat-scroll flex max-h-full flex-col gap-2 overflow-y-auto px-1 pb-2">
              {querySessions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/8 bg-surface-container/36 px-3 py-3">
                  <p className="text-[11px] leading-5 text-white/34">
                    Nenhuma sessão de consulta ainda.
                  </p>
                </div>
              ) : (
                querySessions.map((session) => {
                  const statusView = getQueryStatusPresentation(session.latest_query_run?.status)
                  const isActive = activeSessionId === session.id && pathname === '/chat'

                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => handleOpenQuerySession(session)}
                      className={[
                        'w-full rounded-xl border px-3 py-3 text-left transition-[border-color,background-color,transform] duration-150 hover:-translate-y-0.5',
                        isActive
                          ? 'border-accent-indigo/30 bg-accent-indigo/10'
                          : statusView.cardClass,
                      ].join(' ')}
                    >
                      <div className="flex items-start gap-2">
                        <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${statusView.dotClass}`} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[12px] font-semibold text-white/86">
                            {session.title ?? 'Consulta sem título'}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className={`text-[10px] font-medium ${statusView.textClass}`}>
                              {statusView.label}
                            </span>
                            <span className="text-[10px] text-white/20">•</span>
                            <span className="text-[10px] text-white/28">
                              {formatQuerySessionDate(session.updated_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </nav>

      <div className="border-t border-white/[0.06] p-3">
        <Link
          to="/chat"
          onClick={handleNewSessionClick}
          className="flex w-full items-center justify-center gap-2 rounded-btn border border-accent-indigo/22 bg-accent-indigo/8 py-2.5 text-[11px] font-semibold tracking-[0.14em] text-accent-indigo/80 uppercase transition-[border-color,background-color,color] duration-150 hover:border-accent-indigo/35 hover:bg-accent-indigo/14 hover:text-accent-indigo"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nova Sessão
        </Link>
      </div>
    </aside>
  )
}
