import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import icon from '@/assets/Icon.png'
import { useAuthProfile } from '@/hooks/useAuthProfile'
import { authService } from '@/services/auth.service'
import { useAppStore } from '@/store/useAppStore'
import './Projects.css'

function CreateCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-accent-indigo/30 bg-accent-indigo/[0.04] p-5 text-center transition-[border-color,background-color] duration-200 hover:border-accent-indigo/50 hover:bg-accent-indigo/[0.07]"
      style={{ minHeight: '220px' }}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-btn border border-accent-indigo/25 bg-accent-indigo/10 text-accent-indigo transition-[background-color,border-color] duration-200 group-hover:border-accent-indigo/40 group-hover:bg-accent-indigo/18">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-white/70 group-hover:text-white/90 transition-colors duration-200">
          Novo Projeto
        </p>
        <p className="mt-0.5 text-[10px] tracking-[0.16em] text-accent-indigo/60 uppercase">
          Iniciar registro
        </p>
      </div>
    </button>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function Projects() {
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { logout } = useAppStore()
  const { displayName, email, initials } = useAuthProfile()
  const projects: Array<{ id: string; name: string; description: string; stack: string[] }> = []

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.stack.some((s) => s.toLowerCase().includes(search.toLowerCase())),
  )

  useEffect(() => {
    if (!menuOpen) return

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
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
    <div className="relative isolate min-h-svh overflow-hidden bg-surface-base text-white">
      {/* ── Animated light orbs ─────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div
          className="projects-orb-a absolute top-[-140px] left-[-110px] h-[620px] w-[620px] rounded-full blur-[120px] will-change-transform"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.38) 0%, rgba(99,102,241,0.12) 42%, transparent 72%)',
          }}
        />
        <div
          className="projects-orb-b absolute bottom-[-130px] right-[-100px] h-[560px] w-[560px] rounded-full blur-[115px] will-change-transform"
          style={{
            background: 'radial-gradient(circle, rgba(139,92,246,0.36) 0%, rgba(139,92,246,0.12) 46%, transparent 73%)',
          }}
        />
        <div
          className="projects-orb-c absolute top-[36%] left-[50%] h-[420px] w-[420px] rounded-full blur-[105px] will-change-transform"
          style={{
            background: 'radial-gradient(circle, rgba(99,102,241,0.28) 0%, rgba(99,102,241,0.08) 48%, transparent 74%)',
          }}
        />
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-surface-base/55"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1' fill='rgba(255,255,255,0.025)'/%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative z-10 min-h-svh">

        {/* ── Nav ─────────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-40 border-b border-white/[0.05] bg-surface-base/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
            {/* Logo */}
            <div className="flex items-center gap-2.5 select-none">
              <img src={icon} alt="LogIA" className="h-6 w-auto" />
              <span className="text-lg leading-none text-white/95 font-['Sora']">
                <span className="font-semibold">Log</span>
                <span className="font-bold tracking-[0.04em] text-accent-violet font-['Space_Grotesk']">IA</span>
              </span>
            </div>

            {/* Right nav */}
            <div className="flex items-center gap-3">
              {/* Help */}
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-btn border border-white/8 bg-surface-container text-white/35 transition-[border-color,color,background-color] duration-150 hover:border-white/14 hover:bg-surface-high hover:text-white/60"
                title="Ajuda"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </button>

              {/* User info */}
              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  title={displayName ?? email ?? 'Conta'}
                  onClick={() => setMenuOpen((value) => !value)}
                  className="rounded-btn border border-white/8 bg-surface-container p-1.5 transition-[border-color,background-color] duration-150 hover:border-white/14 hover:bg-surface-high"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-accent-indigo to-accent-violet text-[10px] font-bold text-white">
                    {initials || (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21a8 8 0 0 0-16 0" />
                        <circle cx="12" cy="8" r="4" />
                      </svg>
                    )}
                  </div>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-52 rounded-card border border-white/8 bg-surface-container shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                    <div className="border-b border-white/6 px-3.5 py-3">
                      {(displayName || email) ? (
                        <>
                          {displayName && <p className="truncate text-[13px] font-medium text-white/90">{displayName}</p>}
                          {email && (
                            <p className="mt-0.5 truncate text-[11px] text-white/35">{email}</p>
                          )}
                        </>
                      ) : (
                        <p className="truncate text-[13px] font-medium text-white/90">Minha conta</p>
                      )}
                    </div>

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
          </div>
        </header>

        {/* ── Main content ────────────────────────────────────────────────── */}
        <main className="relative z-10 mx-auto max-w-6xl px-5 pb-24 pt-16 sm:px-8">

          {/* Header */}
          <div className="mb-10 text-center">
            <p className="mb-3 text-[10px] font-semibold tracking-[0.28em] text-accent-indigo/70 uppercase">
              Central de Projetos
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-white/95 sm:text-4xl font-['Space_Grotesk']">
              Seus projetos técnicos
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/40">
              Selecione um projeto para registrar uma sessão de trabalho ou consultar seu histórico via busca semântica.
            </p>
          </div>

          {/* Search */}
          <div className="relative mx-auto mb-10 max-w-xl">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-white/25">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Filtrar por nome, descrição ou tecnologia..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
              w-full rounded-card border border-white/8 bg-surface-container/80 py-3 pl-10 pr-4
              text-sm text-white/80 placeholder:text-white/25 outline-none backdrop-blur-sm
              transition-[border-color,box-shadow,background-color] duration-150
              focus:border-accent-indigo/50 focus:bg-surface-container
              focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]
            "
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-white/25 hover:text-white/50 transition-colors duration-150"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          {/* Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CreateCard onClick={() => navigate('/chat')} />
            {filtered.length > 0
              ? null
              : (
                <div className="col-span-1 flex flex-col items-center justify-center rounded-card border border-white/8 bg-surface-container/65 px-6 py-16 text-center sm:col-span-2 lg:col-span-2">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-surface-high text-white/35">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  {search ? (
                    <>
                      <p className="text-sm text-white/35">Nenhum projeto encontrado para "{search}"</p>
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        className="mt-3 text-xs font-semibold text-accent-indigo/70 underline-offset-2 transition-colors duration-150 hover:underline"
                      >
                        Limpar filtro
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-white/60">Nenhum projeto criado ainda.</p>
                    </>
                  )}
                </div>
              )}
          </div>

        </main>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <footer className="relative z-10 border-t border-white/[0.04] bg-surface-base px-5 py-5 sm:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <p className="text-[10px] tracking-[0.1em] text-white/18">
              © {new Date().getFullYear()} LogIA. Memória técnica para desenvolvedores.
            </p>
            <div className="flex items-center gap-5">
              <span className="text-[10px] tracking-[0.14em] text-white/20 uppercase">
                Documentação
              </span>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-indigo/60 animate-pulse" />
                <span className="text-[10px] tracking-[0.14em] text-white/20 uppercase">Sistema nominal</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
