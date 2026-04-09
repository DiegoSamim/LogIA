import { NavLink, Link } from 'react-router-dom'
import icon from '@/assets/Icon.png'

// ── Nav items ──────────────────────────────────────────────────────────────

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
    to: '/sobre',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
]

// ── Component ──────────────────────────────────────────────────────────────

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <aside
      className={[
        'fixed inset-y-0 left-0 z-30 flex w-[196px] flex-col border-r border-white/[0.06] bg-surface-low transition-transform duration-200',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}
    >

      {/* ── Logo ──────────────────────────────────────────────────────── */}
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

      {/* ── Navigation ────────────────────────────────────────────────── */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2 pt-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [
                'group flex items-center gap-3 rounded-btn px-3 py-2.5 text-sm transition-colors duration-150',
                isActive
                  ? 'bg-surface-high text-white/90'
                  : 'text-white/38 hover:bg-surface-container hover:text-white/70',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={[
                    'shrink-0 transition-colors duration-150',
                    isActive ? 'text-accent-indigo' : 'text-white/30 group-hover:text-white/55',
                  ].join(' ')}
                >
                  {item.icon}
                </span>
                <span className="text-[13px] font-medium leading-none">{item.label}</span>
                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-accent-indigo/70" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Nova Sessão ──────────────────────────────────────────────── */}
      <div className="border-t border-white/[0.06] p-3">
        <Link
          to="/chat"
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
