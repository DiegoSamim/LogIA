import { useState, type ReactNode } from 'react'
import icon from '@/assets/Icon.png'
import './Projects.css'

// ── Types ──────────────────────────────────────────────────────────────────

interface Project {
  id: string
  name: string
  description: string
  stack: string[]
  status: 'ativo' | 'revisao' | 'pausado'
  lastSession: string
  taskCount: number
  doneCount: number
  iconPath: ReactNode
}

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_USER = { initials: 'DS' }

const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'API de Autenticação',
    description:
      'JWT com refresh tokens, controle de sessão e revogação segura. Implementação de middleware de roles.',
    stack: ['Node.js', 'TypeScript', 'PostgreSQL'],
    status: 'ativo',
    lastSession: '2h atrás',
    taskCount: 14,
    doneCount: 11,
    iconPath: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  {
    id: '2',
    name: 'Painel de Métricas',
    description:
      'Dashboard de latência e throughput de endpoints. Gráficos em tempo real com polling e cache de curta duração.',
    stack: ['React', 'Recharts', 'Redis'],
    status: 'revisao',
    lastSession: '1d atrás',
    taskCount: 9,
    doneCount: 7,
    iconPath: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    id: '3',
    name: 'Pipeline de Ingestão',
    description:
      'Processamento assíncrono de eventos com Dead Letter Queue e retry exponencial. Integração com S3.',
    stack: ['Python', 'RabbitMQ', 'Docker'],
    status: 'ativo',
    lastSession: '15m atrás',
    taskCount: 6,
    doneCount: 3,
    iconPath: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
]

// ── Sub-components ─────────────────────────────────────────────────────────

const statusConfig = {
  ativo: {
    label: 'ATIVO',
    dot: 'bg-accent-indigo',
    badge: 'border-accent-indigo/25 bg-accent-indigo/10 text-accent-indigo',
  },
  revisao: {
    label: 'REVISÃO',
    dot: 'bg-accent-violet',
    badge: 'border-accent-violet/25 bg-accent-violet/10 text-accent-violet',
  },
  pausado: {
    label: 'PAUSADO',
    dot: 'bg-white/25',
    badge: 'border-white/10 bg-white/5 text-white/35',
  },
}

function ProjectCard({ project }: { project: Project }) {
  const cfg = statusConfig[project.status]
  const progress = Math.round((project.doneCount / project.taskCount) * 100)

  return (
    <article
      className="group relative flex flex-col rounded-card border border-white/8 bg-surface-container p-5 transition-[border-color,background-color,box-shadow] duration-200 hover:border-white/14 hover:bg-surface-high hover:shadow-[0_0_0_1px_rgba(99,102,241,0.08),0_8px_32px_rgba(0,0,0,0.3)]"
    >
      {/* Top row: icon + status */}
      <div className="mb-5 flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-btn bg-surface-high text-white/50 transition-colors duration-200 group-hover:text-white/70">
          {project.iconPath}
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-0.5 text-[10px] font-semibold tracking-[0.16em] ${cfg.badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </span>
      </div>

      {/* Name + description */}
      <h3 className="mb-1.5 text-sm font-semibold text-white/90 leading-snug">{project.name}</h3>
      <p className="mb-4 text-xs leading-relaxed text-white/40 line-clamp-2">{project.description}</p>

      {/* Stack tags */}
      <div className="mb-5 flex flex-wrap gap-1.5">
        {project.stack.map((tag) => (
          <span
            key={tag}
            className="rounded-[4px] border border-white/8 bg-surface-base px-2 py-0.5 text-[10px] font-medium tracking-wide text-white/40"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-px w-full rounded-full bg-white/6">
          <div
            className="h-px rounded-full bg-gradient-to-r from-accent-indigo to-accent-violet transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-1.5 text-[10px] text-white/30">
          {project.doneCount}/{project.taskCount} tarefas concluídas
        </p>
      </div>

      {/* Footer row */}
      <div className="mt-auto flex items-center justify-between">
        <span className="text-[10px] tracking-[0.12em] text-white/25 uppercase">
          Última sessão: {project.lastSession}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white/20 transition-[transform,color] duration-200 group-hover:translate-x-0.5 group-hover:text-accent-indigo/60"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </article>
  )
}

function CreateCard() {
  return (
    <button
      type="button"
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

  const filtered = MOCK_PROJECTS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.stack.some((s) => s.toLowerCase().includes(search.toLowerCase())),
  )

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
              <div className="rounded-btn border border-white/8 bg-surface-container p-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-accent-indigo to-accent-violet text-[10px] font-bold text-white">
                  {MOCK_USER.initials}
                </div>
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
            <CreateCard />
            {filtered.length > 0
              ? filtered.map((p) => <ProjectCard key={p.id} project={p} />)
              : search && (
                <div className="col-span-2 flex flex-col items-center justify-center py-16 text-center lg:col-span-2">
                  <p className="text-sm text-white/35">Nenhum projeto encontrado para "{search}"</p>
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="mt-3 text-xs font-semibold text-accent-indigo/70 underline-offset-2 hover:underline transition-colors duration-150"
                  >
                    Limpar filtro
                  </button>
                </div>
              )}
          </div>

          {/* Projects count */}
          {!search && (
            <p className="mt-6 text-center text-[11px] tracking-[0.1em] text-white/20">
              {MOCK_PROJECTS.length} projeto{MOCK_PROJECTS.length !== 1 ? 's' : ''} registrado{MOCK_PROJECTS.length !== 1 ? 's' : ''}
            </p>
          )}
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
