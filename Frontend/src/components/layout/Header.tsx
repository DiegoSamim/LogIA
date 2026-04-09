import { Link, useLocation } from 'react-router-dom'

// ── Breadcrumb map ─────────────────────────────────────────────────────────

const ROUTE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/chat': 'Chat',
  '/tasks': 'Tarefas',
  '/sobre': 'Sobre',
}

// ── Helpers ────────────────────────────────────────────────────────────────

const MOCK_USER = { name: 'Diego Samim', initials: 'DS' }

// ── Component ──────────────────────────────────────────────────────────────

interface HeaderProps {
  isSidebarOpen: boolean
  onOpenSidebar: () => void
}

export default function Header({ isSidebarOpen, onOpenSidebar }: HeaderProps) {
  const { pathname } = useLocation()
  const pageLabel = ROUTE_LABELS[pathname] ?? 'LogIA'

  return (
    <header className="sticky top-0 z-20 flex h-[52px] shrink-0 items-center justify-between border-b border-white/[0.06] bg-surface-base/85 px-3 backdrop-blur-xl sm:px-3">

      {/* ── Left — breadcrumb ─────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 items-center gap-2 text-[13px]">
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

        <Link
          to="/projects"
          className="hidden shrink-0 font-medium text-white/35 transition-colors duration-150 hover:text-white/60 sm:block"
        >
          Projetos
        </Link>

        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hidden text-white/18 sm:block">
          <path d="M9 18l6-6-6-6" />
        </svg>

        <span className="hidden shrink-0 font-semibold text-white/80 sm:block">LogIA-Beta-01</span>

        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="hidden text-white/18 sm:block">
          <path d="M9 18l6-6-6-6" />
        </svg>

        <span className="truncate font-medium text-white/60">{pageLabel}</span>

        {/* Status badge */}
        <span className="ml-1 hidden items-center gap-1.5 rounded-[4px] border border-accent-indigo/22 bg-accent-indigo/8 px-2 py-0.5 text-[10px] font-semibold tracking-[0.16em] text-accent-indigo/80 uppercase lg:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-accent-indigo/70 animate-pulse" />
          Active_Build
        </span>
      </div>

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

        {/* User avatar */}
        <button
          type="button"
          title={MOCK_USER.name}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent-indigo to-accent-violet text-[11px] font-bold text-white shadow-[0_0_0_2px_rgba(139,92,246,0.2)] transition-shadow duration-150 hover:shadow-[0_0_0_2px_rgba(139,92,246,0.4)]"
        >
          {MOCK_USER.initials}
        </button>

      </div>
    </header>
  )
}
