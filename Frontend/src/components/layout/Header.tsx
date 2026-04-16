import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, matchPath } from 'react-router-dom'
import type { ChatMode } from '@/data/dtos'
import { useAuthProfile } from '@/hooks/useAuthProfile'
import { authService } from '@/services/auth.service'
import { useAppStore } from '@/store/useAppStore'
import { useChatUiStore } from '@/store/useChatUiStore'

// ── Breadcrumb map ─────────────────────────────────────────────────────────

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/chat': 'Chat',
  '/tasks': 'Tarefas',
  '/sobre': 'Sobre',
}

interface HeaderProps {
  isSidebarOpen: boolean
  onOpenSidebar: () => void
}

export default function Header({ isSidebarOpen, onOpenSidebar }: HeaderProps) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const projectAboutMatch = matchPath('/projects/:projectId/sobre', pathname)
  const taskDetailMatch = matchPath('/tasks/:taskId', pathname)
  const isChatRoute = pathname === '/chat'

  const { logout, currentProject, currentTaskTitle } = useAppStore()
  const { displayName, email, initials } = useAuthProfile()
  const { mode, setMode } = useChatUiStore()

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fecha ao clicar fora
  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  function handleLogout() {
    authService.logoutOptimistic()
    logout()
    setMenuOpen(false)
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-20 flex h-[52px] shrink-0 items-center justify-between border-b border-white/[0.06] bg-surface-base/85 px-3 backdrop-blur-xl sm:px-3">

      {/* ── Left — breadcrumb ─────────────────────────────────────────── */}
      <div className="flex min-w-0 items-center gap-2 text-[13px] ">
        {!isSidebarOpen && (
          <button
            type="button"
            onClick={onOpenSidebar}
            title="Abrir sidebar"
            aria-label="Abrir sidebar"
            className="mr-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-btn border border-white/8 bg-surface-container text-white/45 transition-[border-color,color,background-color] duration-150 hover:border-white/14 hover:bg-surface-high hover:text-white/70 sm:ml-2 sm:mr-3"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}

        {projectAboutMatch ? (
          <>
            <Link
              to="/projects"
              className="hidden shrink-0 font-medium text-white/35 transition-colors duration-150 hover:text-white/60 sm:block"
            >
              Projetos
            </Link>

            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hidden text-white/18 sm:block">
              <path d="M9 18l6-6-6-6" />
            </svg>

            <span className="truncate font-medium text-white/60">
              {currentProject?.name ?? 'Projeto'}
            </span>
          </>
        ) : taskDetailMatch ? (
          <>
            <Link
              to="/projects"
              className="hidden shrink-0 font-medium text-white/35 transition-colors duration-150 hover:text-white/60 sm:block"
            >
              Projetos
            </Link>

            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hidden text-white/18 sm:block">
              <path d="M9 18l6-6-6-6" />
            </svg>

            <span className="truncate font-medium text-white/60">
              <Link
                to="/tasks"
                className="font-medium text-white/35 transition-colors duration-150 hover:text-white/60"
              >
                Tarefas
              </Link>
            </span>

            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hidden text-white/18 sm:block">
              <path d="M9 18l6-6-6-6" />
            </svg>

            <span className="truncate font-medium text-white/60">
              {currentTaskTitle ?? 'Tarefa'}
            </span>
          </>
        ) : (
          <>
            <Link
              to="/projects"
              className="hidden shrink-0 font-medium text-white/35 transition-colors duration-150 hover:text-white/60 sm:block"
            >
              Projetos
            </Link>

            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hidden text-white/18 sm:block">
              <path d="M9 18l6-6-6-6" />
            </svg>

            <span className="truncate font-medium text-white/60">{ROUTE_LABELS[pathname] ?? 'LogIA'}</span>
          </>
        )}
      </div>

      {/* ── Center — chat mode toggle (only in chat route) ─────────────────────────────────────────── */}
      {isChatRoute && (
        <div className="hidden px-4 md:flex md:flex-1 md:justify-center" >
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
                    'rounded-full px-3.5 py-2 text-[10px] font-semibold tracking-[0.2em] uppercase transition-[background-color,color,box-shadow,transform] duration-200',
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
      )}

      {/* ── Right — actions ───────────────────────────────────────────── */}
      <div className="ml-2 flex shrink-0 items-center gap-1.5 sm:gap-2">

        {/* Help */}
        <button
          type="button"
          title="Ajuda"
          className="flex h-8 w-8 items-center justify-center rounded-btn border border-white/8 bg-surface-container text-white/35 transition-[border-color,color,background-color] duration-150 hover:border-white/14 hover:bg-surface-high hover:text-white/65"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>

        {/* Divider */}
        <div className="mx-1 hidden h-5 w-px bg-white/8 sm:block" />

        {/* User avatar + dropdown */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            title={displayName ?? email ?? 'Conta'}
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-accent-indigo to-accent-violet text-[11px] font-bold text-white shadow-[0_0_0_2px_rgba(139,92,246,0.2)] transition-shadow duration-150 hover:shadow-[0_0_0_2px_rgba(139,92,246,0.4)]"
          >
            {initials}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-52 rounded-card border border-white/8 bg-surface-container shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl">
              {/* User info */}
              <div className="border-b border-white/6 px-3.5 py-3">
                {(displayName || email) ? (
                  <>
                    {displayName && <p className="text-[13px] font-medium text-white/90 truncate">{displayName}</p>}
                    {email && (
                      <p className="mt-0.5 text-[11px] text-white/35 truncate">{email}</p>
                    )}
                  </>
                ) : (
                  <p className="text-[13px] font-medium text-white/90 truncate">Minha conta</p>
                )}
              </div>

              {/* Actions */}
              <div className="p-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 rounded-[6px] px-3 py-2 text-[13px] text-white/55 transition-[background-color,color] duration-150 hover:bg-surface-high hover:text-red-400"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}
