import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import icon from '@/assets/Icon.png'
import StackBadge from '@/components/ui/StackBadge'
import { useAuthProfile } from '@/hooks/useAuthProfile'
import { authService } from '@/services/auth.service'
import { projectService } from '@/services/project.service'
import { useAppStore } from '@/store/useAppStore'
import type { ProjectDTO } from '@/data/dtos'
import './Projects.css'

// ── Project card ───────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  paused: 'Pausado',
  archived: 'Arquivado',
}

function formatStatus(status: string): string {
  return STATUS_LABELS[status] ?? status
}

function alphaColor(color: string, opacityPercent: number): string {
  return `color-mix(in srgb, ${color} ${opacityPercent}%, transparent)`
}

function ProjectCard({ project, onSelect }: { project: ProjectDTO; onSelect: () => void }) {
  const statusColor: Record<string, string> = {
    active: 'text-emerald-400',
    paused: 'text-amber-400',
    archived: 'text-white/30',
  }
  const accentColor = project.color ?? '#6366F1'

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative flex flex-col gap-4 overflow-hidden rounded-card border border-white/8 bg-surface-container/80 p-5 text-left transition-[border-color,background-color,transform,box-shadow] duration-200 hover:bg-surface-container hover:-translate-y-0.5"
      style={{
        minHeight: '220px',
        borderColor: alphaColor(accentColor, 28),
        boxShadow: `0 0 0 1px ${alphaColor(accentColor, 12)}, 0 0 16px ${alphaColor(accentColor, 10)}, 0 12px 30px rgba(0,0,0,0.18)`,
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-card opacity-100 transition-opacity duration-200"
        style={{
          boxShadow: `inset 0 0 0 1px ${alphaColor(accentColor, 16)}, inset 0 0 16px ${alphaColor(accentColor, 5)}, 0 0 22px ${alphaColor(accentColor, 8)}`,
        }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-4 top-0 h-12 rounded-full blur-2xl"
        style={{ background: `radial-gradient(circle, ${alphaColor(accentColor, 12)} 0%, transparent 72%)` }}
      />

      {/* Color dot + name */}
      <div className="relative z-10 flex items-center gap-2.5">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: project.color ?? '#6366F1' }}
        />
        <p className="truncate text-sm font-semibold text-white/88 group-hover:text-white transition-colors duration-150">
          {project.name}
        </p>
      </div>

      {/* Description */}
      {project.description && (
        <p className="relative z-10 line-clamp-2 flex-1 text-xs leading-5 text-white/40">
          {project.description}
        </p>
      )}

      {/* Stack chips */}
      {project.stack.length > 0 && (
        <div className="relative z-10 flex flex-wrap gap-1.5">
          {project.stack.slice(0, 4).map((tech) => (
            <StackBadge key={tech} value={tech} compact />
          ))}
          {project.stack.length > 4 && (
            <span className="rounded-full border border-white/8 px-2 py-0.5 text-[10px] text-white/30">
              +{project.stack.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="relative z-10 flex items-center justify-between border-t border-white/5 pt-3">
        <span className={`text-[10px] font-semibold tracking-[0.14em] uppercase ${statusColor[project.status] ?? 'text-white/30'}`}>
          {formatStatus(project.status)}
        </span>
        <span className="text-[10px] text-white/24">
          {project.task_count} {project.task_count === 1 ? 'tarefa' : 'tarefas'}
        </span>
      </div>

      {/* Hover arrow */}
      <span className="absolute right-4 top-4 z-10 text-white/20 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </span>
    </button>
  )
}

function CreateCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex flex-col items-center justify-center gap-3 rounded-card border border-dashed border-accent-indigo/30 bg-accent-indigo/4 p-5 text-center transition-[border-color,background-color] duration-200 hover:border-accent-indigo/50 hover:bg-accent-indigo/7"
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
  const [projects, setProjects] = useState<ProjectDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { logout, setCurrentProject } = useAppStore()
  const { displayName, email, initials } = useAuthProfile()

  useEffect(() => {
    projectService
      .list()
      .then(({ data }) => setProjects(data))
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false))
  }, [])

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
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

  function handleSelectProject(project: ProjectDTO) {
    setCurrentProject({ id: project.id, name: project.name })
    navigate(`/projects/${project.id}/sobre`)
  }

  return (
    <div className="relative isolate min-h-svh overflow-hidden bg-surface-base text-white">
      {/* ── Animated light orbs ─────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div
          className="projects-orb-a absolute -top-35 -left-27.5 h-155 w-155 rounded-full blur-[120px] will-change-transform"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.38) 0%, rgba(99,102,241,0.12) 42%, transparent 72%)' }}
        />
        <div
          className="projects-orb-b absolute -bottom-32.5 -right-25 h-140 w-140 rounded-full blur-[115px] will-change-transform"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.36) 0%, rgba(139,92,246,0.12) 46%, transparent 73%)' }}
        />
        <div
          className="projects-orb-c absolute top-[36%] left-[50%] h-105 w-105 rounded-full blur-[105px] will-change-transform"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.28) 0%, rgba(99,102,241,0.08) 48%, transparent 74%)' }}
        />
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-surface-base/55"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='1' cy='1' r='1' fill='rgba(255,255,255,0.025)'/%3E%3C/svg%3E")` }}
      />
      <div className="relative z-10 min-h-svh">

        {/* ── Nav ─────────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-40 border-b border-white/5 bg-surface-base/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
            <div className="flex items-center gap-2.5 select-none">
              <img src={icon} alt="LogIA" className="h-6 w-auto" />
              <span className="text-lg leading-none text-white/95 font-['Sora']">
                <span className="font-semibold">Log</span>
                <span className="font-bold tracking-[0.04em] text-accent-violet font-['Space_Grotesk']">IA</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-btn border border-white/8 bg-surface-container text-white/35 transition-[border-color,color,background-color] duration-150 hover:border-white/14 hover:bg-surface-high hover:text-white/60"
                title="Ajuda"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </button>

              <div ref={menuRef} className="relative">
                <button
                  type="button"
                  title={displayName ?? email ?? 'Conta'}
                  onClick={() => setMenuOpen((v) => !v)}
                  className="rounded-btn border border-white/8 bg-surface-container p-1.5 transition-[border-color,background-color] duration-150 hover:border-white/14 hover:bg-surface-high"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-linear-to-br from-accent-indigo to-accent-violet text-[10px] font-bold text-white">
                    {initials || (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="8" r="4" />
                      </svg>
                    )}
                  </div>
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-20 w-52 rounded-card border border-white/8 bg-surface-container shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                    <div className="border-b border-white/6 px-3.5 py-3">
                      {displayName && <p className="truncate text-[13px] font-medium text-white/90">{displayName}</p>}
                      {email && <p className="mt-0.5 truncate text-[11px] text-white/35">{email}</p>}
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
              className="w-full rounded-card border border-white/8 bg-surface-container/80 py-3 pl-10 pr-4 text-sm text-white/80 placeholder:text-white/25 outline-none backdrop-blur-sm transition-[border-color,box-shadow,background-color] duration-150 focus:border-accent-indigo/50 focus:bg-surface-container focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
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

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <CreateCard onClick={() => navigate('/chat?intent=new-project')} />

            {loading ? (
              <div className="col-span-1 flex items-center justify-center rounded-card border border-white/6 bg-surface-container/50 py-16 sm:col-span-1 lg:col-span-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/10 border-t-accent-indigo/60" />
              </div>
            ) : fetchError ? (
              <div className="col-span-1 flex flex-col items-center justify-center rounded-card border border-rose-400/14 bg-rose-400/6 px-6 py-16 text-center sm:col-span-1 lg:col-span-2">
                <p className="text-sm font-medium text-rose-300/80">Não foi possível carregar os projetos.</p>
                <p className="mt-1 text-xs text-white/36">Verifique sua conexão e tente novamente.</p>
                <button
                  type="button"
                  onClick={() => { setFetchError(false); setLoading(true); projectService.list().then(({ data }) => setProjects(data)).catch(() => setFetchError(true)).finally(() => setLoading(false)) }}
                  className="mt-4 rounded-[6px] border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:border-white/20 hover:text-white/84"
                >
                  Tentar novamente
                </button>
              </div>
            ) : filtered.length > 0 ? (
              filtered.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onSelect={() => handleSelectProject(project)}
                />
              ))
            ) : (
              <div className="col-span-1 flex flex-col items-center justify-center rounded-card border border-white/8 bg-surface-container/65 px-6 py-16 text-center sm:col-span-1 lg:col-span-2">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-surface-high text-white/35">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <line x1="8" y1="2" x2="8" y2="6" /><line x1="16" y1="2" x2="16" y2="6" />
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
                  <p className="text-sm font-medium text-white/60">Nenhum projeto criado ainda.</p>
                )}
              </div>
            )}
          </div>
        </main>

        <footer className="relative z-10 border-t border-white/4 bg-surface-base px-5 py-5 sm:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <p className="text-[10px] tracking-widest text-white/18">
              © {new Date().getFullYear()} LogIA. Memória técnica para desenvolvedores.
            </p>
            <div className="flex items-center gap-5">
              <span className="text-[10px] tracking-[0.14em] text-white/20 uppercase">Documentação</span>
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
