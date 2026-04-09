import { Link } from 'react-router-dom'
import { MOCK_PROJECT_DETAIL } from '@/data/mocks'
import type { ProjectDetailDTO, ProjectMemberDTO, ProjectProfileDTO } from '@/data/dtos'

// ── Helpers ────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

function formatProjectId(id: string): string {
  return id.toUpperCase().replace(/-/g, '-')
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[10px] font-semibold tracking-[0.22em] text-white/35 uppercase">
      {children}
    </p>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-card border border-white/8 bg-surface-container p-5 ${className}`}>
      {children}
    </div>
  )
}

// ── Project Header ─────────────────────────────────────────────────────────

function ProjectHeader({ project }: { project: ProjectDetailDTO }) {
  return (
    <div className="mb-8">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          {/* Project identifier */}
          <p className="mb-2 text-[10px] font-semibold tracking-[0.22em] text-accent-indigo/70 uppercase">
            Project Identifier: {formatProjectId(project.id)}
          </p>

          {/* Title */}
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-white/95 font-['Space_Grotesk']">
            {project.name}
          </h1>

          {/* Description */}
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50">
            {project.description}
          </p>
        </div>

        {/* Edit button */}
        <Link
          to={`/projects/${project.id}/edit`}
          className="shrink-0 flex items-center gap-2 rounded-btn border border-white/12 bg-surface-container px-4 py-2 text-xs font-semibold tracking-[0.12em] text-white/55 uppercase transition-[border-color,color,background-color] duration-150 hover:border-white/20 hover:bg-surface-high hover:text-white/80"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Editar Projeto
        </Link>
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-accent-indigo/22 bg-accent-indigo/8 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-accent-indigo/80 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-indigo/70 animate-pulse" />
            {project.status}
          </span>
        </div>
        <span className="text-[11px] text-white/30">
          {project.done_count}/{project.task_count} tarefas concluídas
        </span>
        <span className="text-[11px] text-white/30">
          {project.members.length} membro{project.members.length !== 1 ? 's' : ''}
        </span>
        {project.profile?.default_language && (
          <span className="rounded-[4px] border border-white/8 bg-surface-high px-2 py-0.5 text-[10px] font-medium text-white/35">
            {project.profile.default_language}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Summary Card ───────────────────────────────────────────────────────────

function SummaryCard({ profile }: { profile: ProjectProfileDTO }) {
  return (
    <Card>
      <div className="mb-1 flex items-center gap-2">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="text-accent-indigo/70">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <h2 className="text-sm font-semibold text-white/85">Project Summary</h2>
      </div>

      <div className="my-4 h-px bg-white/6" />

      {profile.summary && (
        <p className="mb-5 text-sm leading-relaxed text-white/55">{profile.summary}</p>
      )}

      {profile.goal && (
        <div className="rounded-btn border-l-2 border-accent-indigo/50 bg-accent-indigo/[0.06] p-4">
          <p className="mb-2 text-[10px] font-semibold tracking-[0.2em] text-accent-indigo/70 uppercase">
            Primary Objective
          </p>
          <p className="text-sm leading-relaxed text-white/70">{profile.goal}</p>
        </div>
      )}

      {profile.scope && (
        <div className="mt-4">
          <p className="mb-1.5 text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">Escopo</p>
          <p className="text-sm leading-relaxed text-white/45">{profile.scope}</p>
        </div>
      )}
    </Card>
  )
}

// ── Architecture Card ──────────────────────────────────────────────────────

const ARCH_LAYERS = [
  {
    label: 'Frontend',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8m-4-4v4" />
      </svg>
    ),
    description: 'React + TypeScript. Chat dual-mode com Tailwind e Zustand para estado global.',
  },
  {
    label: 'Backend API',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
      </svg>
    ),
    description: 'FastAPI com endpoints REST. Autenticação JWT, pipeline assíncrono de embeddings.',
  },
  {
    label: 'RAG Engine',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
    description: 'pgvector para busca semântica. OpenAI Embeddings + LLM para geração de resposta contextual.',
  },
]

function ArchitectureCard({ profile }: { profile: ProjectProfileDTO }) {
  return (
    <Card className="mt-4">
      <div className="mb-1 flex items-center gap-2">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="text-accent-violet/70">
          <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
        </svg>
        <h2 className="text-sm font-semibold text-white/85">System Architecture</h2>
      </div>

      {profile.architecture_summary && (
        <>
          <div className="my-4 h-px bg-white/6" />
          <p className="mb-5 text-sm leading-relaxed text-white/45">{profile.architecture_summary}</p>
        </>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        {ARCH_LAYERS.map((layer, i) => (
          <div
            key={layer.label}
            className="rounded-btn border border-white/8 bg-surface-high p-4 transition-[border-color,background-color] duration-150 hover:border-white/14"
          >
            <div className={`mb-3 ${i % 2 === 0 ? 'text-accent-indigo/70' : 'text-accent-violet/70'}`}>
              {layer.icon}
            </div>
            <p className="mb-1.5 text-xs font-semibold text-white/80">{layer.label}</p>
            <p className="text-xs leading-relaxed text-white/40">{layer.description}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Stack Card ─────────────────────────────────────────────────────────────

const STACK_COLORS = [
  'bg-accent-indigo/70',
  'bg-accent-violet/70',
  'bg-emerald-400/60',
  'bg-sky-400/60',
  'bg-amber-400/60',
  'bg-rose-400/60',
]

function StackCard({ stack }: { stack: string[] }) {
  return (
    <Card>
      <SectionLabel>Main Stack</SectionLabel>
      <div className="flex flex-wrap gap-2">
        {stack.map((tech, i) => (
          <span
            key={tech}
            className="inline-flex items-center gap-1.5 rounded-[4px] border border-white/8 bg-surface-high px-2.5 py-1.5 text-[11px] font-medium text-white/65"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${STACK_COLORS[i % STACK_COLORS.length]}`} />
            {tech}
          </span>
        ))}
      </div>
    </Card>
  )
}

// ── Links Card ─────────────────────────────────────────────────────────────

interface LinkItem {
  label: string
  url: string | null
  icon: React.ReactNode
}

function LinksCard({ profile }: { profile: ProjectProfileDTO }) {
  const links: LinkItem[] = [
    {
      label: 'GitHub Repository',
      url: profile.documentation_url,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
        </svg>
      ),
    },
    {
      label: 'Figma Design File',
      url: profile.figma_url,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H12v7H8.5A3.5 3.5 0 0 1 5 5.5z" />
          <path d="M12 2h3.5a3.5 3.5 0 1 1 0 7H12V2z" />
          <path d="M12 12.5a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z" />
          <path d="M5 19.5A3.5 3.5 0 0 1 8.5 16H12v3.5a3.5 3.5 0 0 1-7 0z" />
          <path d="M5 12.5A3.5 3.5 0 0 1 8.5 9H12v7H8.5A3.5 3.5 0 0 1 5 12.5z" />
        </svg>
      ),
    },
    {
      label: 'API Documentation',
      url: profile.api_base_url,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      label: 'Board',
      url: profile.board_url,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
        </svg>
      ),
    },
  ]

  const activeLinks = links.filter((l) => l.url)

  if (activeLinks.length === 0) return null

  return (
    <Card className="mt-4">
      <SectionLabel>Useful Links</SectionLabel>
      <div className="flex flex-col gap-1">
        {activeLinks.map((link) => (
          <a
            key={link.label}
            href={link.url!}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center justify-between rounded-btn px-3 py-2.5 transition-[background-color] duration-150 hover:bg-surface-high"
          >
            <div className="flex items-center gap-2.5 text-white/55 group-hover:text-white/80 transition-colors duration-150">
              <span className="text-white/30 group-hover:text-accent-indigo/70 transition-colors duration-150">
                {link.icon}
              </span>
              <span className="text-xs font-medium">{link.label}</span>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/20 group-hover:text-accent-indigo/50 transition-colors duration-150">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        ))}
      </div>
    </Card>
  )
}

// ── Team Card ──────────────────────────────────────────────────────────────

function TeamCard({ members }: { members: ProjectMemberDTO[] }) {
  return (
    <Card className="mt-4">
      <SectionLabel>Development Team</SectionLabel>
      <div className="flex flex-col gap-2">
        {members.map((member) => (
          <div
            key={member.id}
            className="flex items-center gap-3 rounded-btn px-2 py-2 transition-[background-color] duration-150 hover:bg-surface-high"
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent-indigo to-accent-violet text-[10px] font-bold text-white">
                {getInitials(member.user.name)}
              </div>
              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border border-surface-container bg-emerald-400/80" />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white/80">{member.user.name}</p>
              <p className="text-[10px] text-white/35">{member.role}</p>
            </div>
          </div>
        ))}

        {/* Pending invite slot */}
        <div className="mt-1 flex items-center gap-3 rounded-btn border border-dashed border-white/8 px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-surface-high">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/25">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <p className="text-xs text-white/25 italic">Pending invite...</p>
        </div>
      </div>
    </Card>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function Sobre() {
  const project = MOCK_PROJECT_DETAIL
  const profile = project.profile

  return (
    <div className="min-h-full bg-surface-base px-6 pb-16 pt-8 sm:px-8">
      <div className="mx-auto max-w-5xl">

        <ProjectHeader project={project} />

        {/* Two-column layout */}
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">

          {/* ── Left column ─────────────────────────────────────────────── */}
          <div className="flex flex-col gap-0">
            {profile && <SummaryCard profile={profile} />}
            {profile && <ArchitectureCard profile={profile} />}
          </div>

          {/* ── Right column ────────────────────────────────────────────── */}
          <div className="flex flex-col gap-0">
            <StackCard stack={project.stack} />
            {profile && <LinksCard profile={profile} />}
            <TeamCard members={project.members} />
          </div>

        </div>
      </div>
    </div>
  )
}
