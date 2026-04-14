import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import StackAutocomplete from '@/components/ui/StackAutocomplete'
import StackBadge from '@/components/ui/StackBadge'
import type { ProjectDetailDTO, ProjectMemberDTO } from '@/data/dtos'
import Modal from '@/components/ui/Modal'
import {
  projectService,
  type UpdateProfileRequest,
  type UpdateProjectRequest,
} from '@/services/project.service'
import { useAppStore } from '@/store/useAppStore'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProjectFormState {
  name: string
  description: string
  repository_url: string
  color: string
  status: string
  summary: string
  goal: string
  scope: string
  main_stack: string
  architecture_summary: string
  product_context: string
  business_rules: string
  team_context: string
  default_language: string
  documentation_url: string
  figma_url: string
  board_url: string
  api_base_url: string
  deployment_url: string
}

interface DisplayValue {
  value: string
  mocked: boolean
}

interface ArchitectureCardModel {
  title: string
  description: string
  icon: 'frontend' | 'backend' | 'storage' | 'orchestration'
  mocked?: boolean
}

// ── Config ────────────────────────────────────────────────────────────────────

const ENABLE_SOBRE_PREVIEW_MOCKS = false

const MOCK_PROJECT_MEMBERS: ProjectMemberDTO[] = [
  {
    id: 'mock-owner',
    user_id: 'mock-owner-user',
    project_id: 'mock-project',
    role: 'owner',
    created_at: '',
    user: { id: 'mock-owner-user', name: 'Diego Silva', email: 'diego@logia.dev', avatar_url: null, is_active: true, created_at: '' },
  },
  {
    id: 'mock-dev',
    user_id: 'mock-dev-user',
    project_id: 'mock-project',
    role: 'member',
    created_at: '',
    user: { id: 'mock-dev-user', name: 'Ana Costa', email: 'ana@logia.dev', avatar_url: null, is_active: true, created_at: '' },
  },
  {
    id: 'mock-pm',
    user_id: 'mock-pm-user',
    project_id: 'mock-project',
    role: 'member',
    created_at: '',
    user: { id: 'mock-pm-user', name: 'Lucas Martins', email: 'lucas@logia.dev', avatar_url: null, is_active: true, created_at: '' },
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  paused: 'Pausado',
  archived: 'Arquivado',
}

function formatStatus(s: string): string {
  return STATUS_LABELS[s] ?? s
}

function resolveDisplayValue(actual: string | null | undefined, fallback: string): DisplayValue {
  const trimmed = actual?.trim()
  if (trimmed) return { value: trimmed, mocked: false }
  if (!ENABLE_SOBRE_PREVIEW_MOCKS) return { value: '', mocked: false }
  return { value: fallback, mocked: true }
}

function toFormState(project: ProjectDetailDTO): ProjectFormState {
  return {
    name: project.name ?? '',
    description: project.description ?? '',
    repository_url: project.repository_url ?? '',
    color: project.color ?? '#6366F1',
    status: project.status ?? 'active',
    summary: project.profile?.summary ?? '',
    goal: project.profile?.goal ?? '',
    scope: project.profile?.scope ?? '',
    main_stack: project.profile?.main_stack.join(', ') ?? '',
    architecture_summary: project.profile?.architecture_summary ?? '',
    product_context: project.profile?.product_context ?? '',
    business_rules: project.profile?.business_rules ?? '',
    team_context: project.profile?.team_context ?? '',
    default_language: project.profile?.default_language ?? '',
    documentation_url: project.profile?.documentation_url ?? '',
    figma_url: project.profile?.figma_url ?? '',
    board_url: project.profile?.board_url ?? '',
    api_base_url: project.profile?.api_base_url ?? '',
    deployment_url: project.profile?.deployment_url ?? '',
  }
}

function normalizeNullable(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeStack(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

const AVATAR_PALETTE = ['#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B']

function avatarColor(userId: string): string {
  let hash = 0
  for (const ch of userId) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const EXPAND_THRESHOLD = 200

// ── Icons ─────────────────────────────────────────────────────────────────────

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  )
}

function FigmaIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 24c2.2 0 4-1.8 4-4v-4H8c-2.2 0-4 1.8-4 4s1.8 4 4 4z" />
      <path d="M4 12c0-2.2 1.8-4 4-4h4v8H8c-2.2 0-4-1.8-4-4z" />
      <path d="M4 4c0-2.2 1.8-4 4-4h4v8H8C5.8 8 4 6.2 4 4z" />
      <path d="M12 0h4c2.2 0 4 1.8 4 4s-1.8 4-4 4h-4V0z" />
      <path d="M20 12c0 2.2-1.8 4-4 4s-4-1.8-4-4 1.8-4 4-4 4 1.8 4 4z" />
    </svg>
  )
}

function BookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  )
}

function GridIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}

function TerminalIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function ArchitectureIcon({ kind }: { kind: ArchitectureCardModel['icon'] }) {
  const props = { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  if (kind === 'frontend') return <svg {...props}><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M8 20h8" /><path d="M12 18v2" /></svg>
  if (kind === 'backend') return <svg {...props}><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" /><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" /></svg>
  if (kind === 'storage') return <svg {...props}><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" /><path d="M12 12l8-4.5" /><path d="M12 12V21" /><path d="M12 12L4 7.5" /></svg>
  return <svg {...props}><path d="M8 8h8v8H8z" /><path d="M3 10V6a3 3 0 0 1 3-3h4" /><path d="M21 14v4a3 3 0 0 1-3 3h-4" /><path d="M14 3h4a3 3 0 0 1 3 3v4" /><path d="M10 21H6a3 3 0 0 1-3-3v-4" /></svg>
}

type LinkType = 'github' | 'figma' | 'book' | 'grid' | 'terminal' | 'globe'

const LINK_ICON_MAP: Record<string, LinkType> = {
  'GitHub Repository': 'github',
  'Product Documentation': 'book',
  'Figma Design File': 'figma',
  'Project Board': 'grid',
  'API Base URL': 'terminal',
  'Deployment URL': 'globe',
}

function LinkTypeIcon({ type }: { type: LinkType }) {
  if (type === 'github') return <GitHubIcon />
  if (type === 'figma') return <FigmaIcon />
  if (type === 'book') return <BookIcon />
  if (type === 'grid') return <GridIcon />
  if (type === 'terminal') return <TerminalIcon />
  return <GlobeIcon />
}

// ── UI Components ─────────────────────────────────────────────────────────────

function PreviewPill({ children = 'Preview visual' }: { children?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-accent-indigo/18 bg-accent-indigo/8 px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] text-accent-indigo/78 uppercase">
      <span className="h-1.5 w-1.5 rounded-full bg-accent-violet/85" />
      {children}
    </span>
  )
}

function LinkRow({ label, url, mocked }: { label: string; url: string; mocked: boolean }) {
  const iconType = LINK_ICON_MAP[label] ?? 'globe'
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group flex items-center gap-3 rounded-[16px] border border-white/7 bg-surface-high/54 px-4 py-3.5 text-sm text-white/58 transition-[border-color,background-color,color,transform] duration-150 hover:-translate-y-0.5 hover:border-accent-indigo/22 hover:bg-surface-high hover:text-white/84"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border border-white/8 bg-surface-base/78 text-accent-indigo/72">
        <LinkTypeIcon type={iconType} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-white/84">{label}</span>
          {mocked && <PreviewPill>Preview</PreviewPill>}
        </div>
        <p className="mt-0.5 truncate text-[11px] text-white/28">{url.replace(/^https?:\/\//, '')}</p>
      </div>
      <span className="shrink-0 text-white/20 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-white/58">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M13 5l7 7-7 7" /></svg>
      </span>
    </a>
  )
}

function ClampedText({
  value,
  label,
  onExpand,
  expanded = false,
  rows = 4,
}: {
  value: string
  label: string
  onExpand: (label: string, value: string) => void
  expanded?: boolean
  rows?: number
}) {
  const isLong = value.length > EXPAND_THRESHOLD
  return (
    <div>
      <p
        className="text-sm leading-7 text-white/62"
        style={!expanded && isLong ? {
          display: '-webkit-box',
          WebkitLineClamp: rows,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        } : undefined}
      >
        {value}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => onExpand(label, value)}
          className="mt-2 text-[11px] font-medium text-accent-indigo/64 transition-colors hover:text-accent-indigo/90"
        >
          {expanded ? 'Ver menos ↑' : 'Ver mais →'}
        </button>
      )}
    </div>
  )
}

function CardFade() {
  return (
    <div
      className="pointer-events-none absolute bottom-0 left-0 right-0 h-14"
      style={{ background: 'linear-gradient(to top, rgba(10,12,16,0.97) 0%, transparent 100%)' }}
    />
  )
}

function CardExpandButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute bottom-3 right-3 flex h-6 w-6 items-center justify-center rounded-full border border-white/14 bg-surface-base/80 text-white/42 backdrop-blur-sm transition-[border-color,color] duration-150 hover:border-accent-indigo/34 hover:text-accent-indigo/72"
    >
      <PlusIcon />
    </button>
  )
}

function EmptyCta({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-[16px] border border-dashed border-white/10 py-5 text-xs text-white/26 transition-colors duration-150 hover:border-accent-indigo/28 hover:text-accent-indigo/58"
    >
      <PlusIcon />
      {label}
    </button>
  )
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-[14px] border border-white/8 bg-surface-high/70 px-3.5 py-3 text-sm text-white/86 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-white/22 focus:border-accent-indigo/34 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
      />
    </label>
  )
}

function ColorField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const previewColor = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value.trim()) ? value.trim() : '#1A1D26'

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">{label}</span>
      <div className="flex items-center gap-3 rounded-[14px] border border-white/8 bg-surface-high/70 px-3.5 py-3 transition-[border-color,box-shadow] duration-150 focus-within:border-accent-indigo/34 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]">
        <span
          className="h-4 w-4 shrink-0 rounded-full border border-white/16 shadow-[0_0_0_3px_rgba(255,255,255,0.03)]"
          style={{ backgroundColor: previewColor }}
          aria-hidden="true"
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-white/86 outline-none placeholder:text-white/22"
        />
      </div>
    </label>
  )
}

function StatusField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const options = [
    { value: 'active', label: 'Ativo' },
    { value: 'paused', label: 'Pausado' },
    { value: 'archived', label: 'Arquivado' },
  ]

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  return (
    <div ref={rootRef} className="relative flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">Status</span>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={[
          'flex items-center justify-between gap-3 rounded-[14px] border px-3.5 py-3 text-sm text-white/86 outline-none transition-[border-color,box-shadow,background-color] duration-150',
          open
            ? 'border-accent-indigo/34 bg-surface-high shadow-[0_0_0_3px_rgba(99,102,241,0.12)]'
            : 'border-white/8 bg-surface-high/70 hover:border-white/14',
        ].join(' ')}
      >
        <span className="inline-flex items-center gap-2">
          <span
            className={[
              'h-2.5 w-2.5 rounded-full',
              value === 'active' ? 'bg-emerald-400' : value === 'paused' ? 'bg-amber-400' : 'bg-white/28',
            ].join(' ')}
            aria-hidden="true"
          />
          {formatStatus(value)}
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
          className={['shrink-0 text-white/42 transition-transform duration-150', open ? 'rotate-180' : ''].join(' ')}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-[16px] border border-white/8 bg-[linear-gradient(180deg,rgba(19,22,30,0.98),rgba(13,15,20,0.98))] shadow-[0_18px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="p-2">
            {options.map((option) => {
              const selected = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                  className={[
                    'flex w-full items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-left text-sm transition-[background-color,color] duration-150',
                    selected
                      ? 'bg-accent-indigo/16 text-white'
                      : 'text-white/58 hover:bg-surface-high hover:text-white/84',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'h-2.5 w-2.5 rounded-full',
                      option.value === 'active' ? 'bg-emerald-400' : option.value === 'paused' ? 'bg-amber-400' : 'bg-white/28',
                    ].join(' ')}
                    aria-hidden="true"
                  />
                  <span className="flex-1">{option.label}</span>
                  {selected && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-indigo/82">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="resize-y rounded-[14px] border border-white/8 bg-surface-high/70 px-3.5 py-3 text-sm leading-6 text-white/86 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-white/22 focus:border-accent-indigo/34 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
      />
    </label>
  )
}

function DashboardSection({
  title,
  subtitle,
  children,
  badge,
  className = '',
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  badge?: React.ReactNode
  className?: string
}) {
  return (
    <section className={['rounded-[20px] border border-white/7 bg-surface-container/88 p-5 shadow-[0_20px_48px_rgba(0,0,0,0.22)] backdrop-blur-xl', className].join(' ')}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.22em] text-white/30 uppercase">{title}</p>
          {subtitle && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-white/42">{subtitle}</p>}
        </div>
        {badge}
      </div>
      {children}
    </section>
  )
}

// ── Page Component ────────────────────────────────────────────────────────────

export default function Sobre() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { setCurrentProject } = useAppStore()

  const [project, setProject] = useState<ProjectDetailDTO | null>(null)
  const [form, setForm] = useState<ProjectFormState | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>({})
  const [expandedCard, setExpandedCard] = useState<{ label: string; value: string } | null>(null)

  useEffect(() => {
    if (!projectId) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setNotFound(false)

    projectService
      .get(projectId)
      .then(({ data }) => {
        setProject(data)
        setForm(toFormState(data))
        setCurrentProject({ id: data.id, name: data.name })
      })
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status
        if (status === 404) {
          setNotFound(true)
        } else {
          setError('Não foi possível carregar os detalhes do projeto.')
        }
      })
      .finally(() => setLoading(false))
  }, [projectId, setCurrentProject])

  const displayProfile = useMemo(() => {
    if (!project) return null

    const projectName = project.name?.trim() || 'este projeto'
    const description = resolveDisplayValue(
      project.description,
      `Sistema orientado a contexto para registrar decisões, organizar conhecimento técnico e manter histórico operacional do ${projectName}.`,
    )
    const summary = resolveDisplayValue(
      project.profile?.summary,
      `Plataforma central para registrar contexto técnico, decisões e histórico operacional do ${projectName}.`,
    )
    const goal = resolveDisplayValue(
      project.profile?.goal,
      'Organizar o conhecimento do projeto em uma base consultável para acelerar onboardings, decisões técnicas e continuidade de contexto.',
    )
    const scope = resolveDisplayValue(
      project.profile?.scope,
      'Inclui registro de contexto, visão geral do produto, stack principal e referências técnicas. Não inclui analytics avançado nem gestão financeira nesta etapa. Inclui registro de contexto, visão geral do produto, stack principal e referências técnicas. Não inclui analytics avançado nem gestão financeira nesta etapa. Inclui registro de contexto, visão geral do produto, stack principal e referências técnicas. Não inclui analytics avançado nem gestão financeira nesta etapa.Inclui registro de contexto, visão geral do produto, stack principal e referências técnicas. Não inclui analytics avançado nem gestão financeira nesta etapa.',
    )
    const architectureSummary = resolveDisplayValue(
      project.profile?.architecture_summary,
      'Frontend em React consumindo uma API dedicada, com persistência relacional para projetos, perfis e histórico de interações do time.',
    )
    const productContext = resolveDisplayValue(
      project.profile?.product_context,
      'Produto interno focado em memória técnica e continuidade de contexto entre sessões, tarefas e decisões do projeto.',
    )
    const businessRules = resolveDisplayValue(
      project.profile?.business_rules,
      'Cada projeto possui um perfil único, apenas membros autorizados podem editar seus dados e o contexto precisa permanecer rastreável.Cada projeto possui um perfil único, apenas membros autorizados podem editar seus dados e o contexto precisa permanecer rastreável.Cada projeto possui um perfil único, apenas membros autorizados podem editar seus dados e o contexto precisa permanecer rastreável.Cada projeto possui um perfil único, apenas membros autorizados podem editar seus dados e o contexto precisa permanecer rastreável.Cada projeto possui um perfil único, apenas membros autorizados podem editar seus dados e o contexto precisa permanecer rastreável.',
    )
    const teamContext = resolveDisplayValue(
      project.profile?.team_context,
      'Time pequeno e multidisciplinar, com colaboração direta entre produto, frontend e backend para evoluir o fluxo de registro.',
    )
    const defaultLanguage = resolveDisplayValue(project.profile?.default_language, 'pt-BR')

    const mainStack =
      project.profile?.main_stack?.filter(Boolean).length
        ? { value: project.profile?.main_stack.filter(Boolean) ?? [], mocked: false }
        : project.stack?.length
          ? { value: project.stack, mocked: false }
          : { value: ['React', 'TypeScript', 'FastAPI', 'PostgreSQL'], mocked: ENABLE_SOBRE_PREVIEW_MOCKS }

    const documentationUrl = resolveDisplayValue(project.profile?.documentation_url, 'https://docs.logia.dev/projetos/visao-geral')
    const figmaUrl = resolveDisplayValue(project.profile?.figma_url, 'https://figma.com/file/logia/projeto-sobre')
    const boardUrl = resolveDisplayValue(project.profile?.board_url, 'https://linear.app/logia/project/contexto')
    const apiBaseUrl = resolveDisplayValue(project.profile?.api_base_url, 'https://api.logia.dev')
    const deploymentUrl = resolveDisplayValue(project.profile?.deployment_url, 'https://app.logia.dev')
    const repositoryUrl = resolveDisplayValue(project.repository_url, 'https://github.com/logia/app')

    return {
      description, summary, goal, scope,
      architectureSummary, productContext, businessRules, teamContext,
      defaultLanguage, mainStack,
      repositoryUrl, documentationUrl, figmaUrl, boardUrl, apiBaseUrl, deploymentUrl,
    }
  }, [project])

  const architectureCards = useMemo<ArchitectureCardModel[]>(() => {
    if (!displayProfile) return []
    return [
      { title: 'Frontend Experience', description: displayProfile.productContext.value, icon: 'frontend', mocked: displayProfile.productContext.mocked },
      { title: 'Application Layer', description: displayProfile.architectureSummary.value, icon: 'backend', mocked: displayProfile.architectureSummary.mocked },
      { title: 'Persistence', description: `Base apoiada por ${displayProfile.mainStack.value.slice(0, 3).join(', ')} para manter contexto, relações e histórico operacional.`, icon: 'storage', mocked: displayProfile.mainStack.mocked },
      { title: 'Orchestration', description: displayProfile.businessRules.value, icon: 'orchestration', mocked: displayProfile.businessRules.mocked },
    ]
  }, [displayProfile])

  const links = useMemo(() => {
    if (!displayProfile) return []
    return [
      { label: 'GitHub Repository', url: displayProfile.repositoryUrl.value, mocked: displayProfile.repositoryUrl.mocked },
      { label: 'Product Documentation', url: displayProfile.documentationUrl.value, mocked: displayProfile.documentationUrl.mocked },
      { label: 'Figma Design File', url: displayProfile.figmaUrl.value, mocked: displayProfile.figmaUrl.mocked },
      { label: 'Project Board', url: displayProfile.boardUrl.value, mocked: displayProfile.boardUrl.mocked },
      { label: 'API Base URL', url: displayProfile.apiBaseUrl.value, mocked: displayProfile.apiBaseUrl.mocked },
      { label: 'Deployment URL', url: displayProfile.deploymentUrl.value, mocked: displayProfile.deploymentUrl.mocked },
    ].filter((l) => l.url)
  }, [displayProfile])

  function updateField<K extends keyof ProjectFormState>(field: K, value: ProjectFormState[K]) {
    setForm((current) => (current ? { ...current, [field]: value } : current))
  }

  function handleExpand(label: string) {
    setExpandedFields((current) => ({
      ...current,
      [label]: !current[label],
    }))
  }

  function handleOpenCardModal(label: string, value: string) {
    setExpandedCard({ label, value })
  }

  function handleCancel() {
    if (!project) return
    setForm(toFormState(project))
    setEditing(false)
    setError(null)
  }

  async function handleSave() {
    if (!projectId || !form) return

    setSaving(true)
    setError(null)

    const projectPayload: UpdateProjectRequest = {
      name: form.name.trim(),
      description: normalizeNullable(form.description),
      repository_url: normalizeNullable(form.repository_url),
      color: normalizeNullable(form.color) ?? '#6366F1',
      status: form.status.trim() || 'active',
    }

    const profilePayload: UpdateProfileRequest = {
      summary: normalizeNullable(form.summary),
      goal: normalizeNullable(form.goal),
      scope: normalizeNullable(form.scope),
      main_stack: normalizeStack(form.main_stack),
      architecture_summary: normalizeNullable(form.architecture_summary),
      product_context: normalizeNullable(form.product_context),
      business_rules: normalizeNullable(form.business_rules),
      team_context: normalizeNullable(form.team_context),
      default_language: normalizeNullable(form.default_language),
      documentation_url: normalizeNullable(form.documentation_url),
      figma_url: normalizeNullable(form.figma_url),
      board_url: normalizeNullable(form.board_url),
      api_base_url: normalizeNullable(form.api_base_url),
      deployment_url: normalizeNullable(form.deployment_url),
    }

    try {
      await projectService.update(projectId, projectPayload)
      const { data } = await projectService.updateProfile(projectId, profilePayload)

      setProject(data)
      setForm(toFormState(data))
      setCurrentProject({ id: data.id, name: data.name })
      setEditing(false)
    } catch {
      setError('Não foi possível salvar as alterações do projeto.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteProject() {
    if (!projectId) return

    setDeleting(true)
    setError(null)

    try {
      await projectService.remove(projectId)
      setCurrentProject(null)
      navigate('/projects', { replace: true })
    } catch {
      setError('Não foi possível excluir o projeto.')
      setDeleting(false)
      setDeleteModalOpen(false)
    }
  }

  // ── Loading / Not found ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-full bg-surface-base px-6 pb-16 pt-8 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex min-h-[360px] items-center justify-center rounded-[20px] border border-white/8 bg-surface-container">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/12 border-t-accent-indigo/70" />
          </div>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-full bg-surface-base px-6 pb-16 pt-8 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[20px] border border-white/8 bg-surface-container p-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-white/90">Projeto não encontrado</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/40">
              O projeto solicitado não foi localizado ou não pertence ao seu usuário.
            </p>
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="mt-6 rounded-btn border border-accent-indigo/22 bg-accent-indigo/10 px-4 py-2.5 text-xs font-semibold tracking-[0.16em] text-accent-indigo/84 uppercase transition-[border-color,background-color] duration-150 hover:border-accent-indigo/35 hover:bg-accent-indigo/14"
            >
              Voltar para projetos
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!project || !form || !displayProfile) {
    return (
      <div className="min-h-full bg-surface-base px-6 pb-16 pt-8 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[20px] border border-white/8 bg-surface-container p-8 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-white/90">Não foi possível exibir o projeto</h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/40">
              {error ?? 'Os dados do projeto não puderam ser carregados no momento.'}
            </p>
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="mt-6 rounded-btn border border-accent-indigo/22 bg-accent-indigo/10 px-4 py-2.5 text-xs font-semibold tracking-[0.16em] text-accent-indigo/84 uppercase transition-[border-color,background-color] duration-150 hover:border-accent-indigo/35 hover:bg-accent-indigo/14"
            >
              Voltar para projetos
            </button>
          </div>
        </div>
      </div>
    )
  }

  const accentColor = project.color ?? '#6366F1'
  const members = project.members?.length
    ? project.members
    : ENABLE_SOBRE_PREVIEW_MOCKS ? MOCK_PROJECT_MEMBERS : []
  const memberDataMocked = ENABLE_SOBRE_PREVIEW_MOCKS && !project.members?.length
  const overviewUsesMock = displayProfile.summary.mocked || displayProfile.goal.mocked || displayProfile.scope.mocked
  const architectureUsesMock = architectureCards.some((c) => c.mocked) || displayProfile.teamContext.mocked

  // Empty state flags (only matters when mocks are off)
  const hasOverview = Boolean(displayProfile.summary.value || displayProfile.goal.value || displayProfile.scope.value)
  const hasArchitecture = Boolean(displayProfile.architectureSummary.value || displayProfile.productContext.value || displayProfile.businessRules.value || displayProfile.teamContext.value)
  const hasLinks = links.length > 0
  const hasStack = displayProfile.mainStack.value.length > 0 && !displayProfile.mainStack.mocked

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-full overflow-hidden bg-surface-base px-4 pb-16 pt-4 sm:px-6 sm:pt-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.14),transparent_58%)]" />
      <div className="pointer-events-none absolute right-[-80px] top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.12),transparent_70%)] blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div
          className="overflow-hidden rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(19,22,30,0.94),rgba(13,15,20,0.94))] shadow-[0_28px_90px_rgba(0,0,0,0.34)] backdrop-blur-xl"
          style={{ boxShadow: `0 28px 90px rgba(0,0,0,0.34), 0 0 0 1px ${accentColor}14 inset` }}
        >
          {/* ── Hero ── */}
          <div className="border-b border-white/6 px-5 py-6 sm:px-7">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">

              {/* Left: identifier + status + title + description */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <p className="text-[11px] font-semibold tracking-[0.28em] text-accent-violet/84 uppercase">
                    Detalhes do projeto
                  </p>
                  {displayProfile.summary.mocked && <PreviewPill>Conteúdo parcial</PreviewPill>}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span
                    className="rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.16em] uppercase"
                    style={{ borderColor: `${accentColor}44`, color: accentColor, backgroundColor: `${accentColor}14` }}
                  >
                    {formatStatus(project.status)}
                  </span>
                </div>

                <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight text-white/96 sm:text-4xl">
                  {project.name}
                </h1>
                <p className="mt-4 max-w-4xl text-base leading-8 text-white/56">
                  {displayProfile.description.value}
                </p>

                {/* Subtle meta row */}
                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/30">
                  {project.task_count > 0 && (
                    <span>{project.done_count}/{project.task_count} tarefas concluídas</span>
                  )}
                  <span>Criado em {new Date(project.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  {project.last_session_at && (
                    <span>· Última sessão {new Date(project.last_session_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                  )}
                </div>
              </div>

              {/* Right: avatars + context card + action buttons */}
              <div className="flex shrink-0 flex-col items-stretch gap-3 xl:w-[260px]">
                {members.length > 0 && (
                  <div className="flex -space-x-2 xl:justify-start">
                    {members.slice(0, 5).map((member) => (
                      <div
                        key={member.id}
                        title={`${member.user.name} — ${member.role}`}
                        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-surface-container text-[11px] font-bold text-white shadow-[0_8px_20px_rgba(0,0,0,0.25)]"
                        style={{ backgroundColor: avatarColor(member.user_id) }}
                      >
                        {initials(member.user.name)}
                      </div>
                    ))}
                    {members.length > 5 && (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-surface-container bg-surface-high text-[11px] font-semibold text-white/50">
                        +{members.length - 5}
                      </div>
                    )}
                  </div>
                )}

                {displayProfile.summary.value && (
                  <div className="rounded-[18px] border border-white/7 bg-surface-base/70 p-4">
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-white/28 uppercase">Resumo</p>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/82">{displayProfile.summary.value}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {editing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={saving}
                        className="flex-1 rounded-btn border border-white/10 bg-surface-high px-4 py-2.5 text-xs font-medium text-white/52 transition-[border-color,color] duration-150 hover:border-white/18 hover:text-white/76 disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || !form.name.trim()}
                        className="flex-1 rounded-btn bg-linear-to-r from-accent-indigo to-accent-violet px-4 py-2.5 text-xs font-semibold tracking-[0.16em] text-white uppercase transition-[filter,transform,opacity] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                      >
                        {saving ? 'Salvando...' : 'Salvar'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setDeleteModalOpen(true)}
                        className="flex-1 rounded-btn border border-red-500/16 bg-red-500/8 px-4 py-2.5 text-xs font-semibold tracking-[0.16em] text-red-300 uppercase transition-[border-color,background-color,color] duration-150 hover:border-red-500/28 hover:bg-red-500/12 hover:text-red-200"
                      >
                        Excluir
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="flex-1 rounded-btn bg-linear-to-r from-accent-indigo to-accent-violet px-4 py-2.5 text-xs font-semibold tracking-[0.16em] text-white uppercase transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98]"
                      >
                        Editar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <p className="mt-5 rounded-[14px] border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
                {error}
              </p>
            )}
          </div>

          {/* ── Body ── */}
          {editing ? (
            // ── Edit mode ────────────────────────────────────────────────────
            <div className="px-5 py-5 sm:px-7 sm:py-6">
              <div className="grid gap-4 lg:grid-cols-2">
                <DashboardSection title="Visão geral" subtitle="Campos principais da tabela projects." className="bg-surface-container/92">
                  <div className="grid gap-4">
                    <TextField label="Nome" value={form.name} onChange={(v) => updateField('name', v)} />
                    <TextAreaField label="Descrição" value={form.description} onChange={(v) => updateField('description', v)} rows={4} />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField label="Repositório" value={form.repository_url} onChange={(v) => updateField('repository_url', v)} placeholder="https://github.com/..." />
                      <ColorField label="Cor" value={form.color} onChange={(v) => updateField('color', v)} placeholder="#6366F1" />
                    </div>
                    <StatusField value={form.status} onChange={(v) => updateField('status', v)} />
                  </div>
                </DashboardSection>

                <DashboardSection title="Contexto e objetivo" subtitle="Informações de alto nível para a visão editorial do projeto.">
                  <div className="grid gap-4">
                    <TextAreaField label="Resumo" value={form.summary} onChange={(v) => updateField('summary', v)} rows={4} />
                    <TextAreaField label="Objetivo" value={form.goal} onChange={(v) => updateField('goal', v)} rows={4} />
                    <TextAreaField label="Escopo" value={form.scope} onChange={(v) => updateField('scope', v)} rows={4} />
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">Stack principal</span>
                      <StackAutocomplete
                        value={normalizeStack(form.main_stack)}
                        onChange={(value) => updateField('main_stack', value.join(', '))}
                        placeholder="Busque stacks como React, Python, PostgreSQL..."
                        allowCustom
                      />
                    </div>
                  </div>
                </DashboardSection>

                <DashboardSection title="Arquitetura e regras" subtitle="Contexto técnico e regras importantes do domínio.">
                  <div className="grid gap-4">
                    <TextAreaField label="Resumo da arquitetura" value={form.architecture_summary} onChange={(v) => updateField('architecture_summary', v)} rows={5} />
                    <TextAreaField label="Contexto do produto" value={form.product_context} onChange={(v) => updateField('product_context', v)} rows={4} />
                    <TextAreaField label="Regras de negócio" value={form.business_rules} onChange={(v) => updateField('business_rules', v)} rows={4} />
                  </div>
                </DashboardSection>

                <DashboardSection title="Time, linguagem e links" subtitle="Dados auxiliares e referências externas.">
                  <div className="grid gap-4">
                    <TextAreaField label="Contexto do time" value={form.team_context} onChange={(v) => updateField('team_context', v)} rows={4} />
                    <TextField label="Linguagem padrão" value={form.default_language} onChange={(v) => updateField('default_language', v)} placeholder="pt-BR, en-US..." />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField label="Documentação" value={form.documentation_url} onChange={(v) => updateField('documentation_url', v)} placeholder="https://..." />
                      <TextField label="Figma" value={form.figma_url} onChange={(v) => updateField('figma_url', v)} placeholder="https://..." />
                      <TextField label="Board" value={form.board_url} onChange={(v) => updateField('board_url', v)} placeholder="https://..." />
                      <TextField label="API base URL" value={form.api_base_url} onChange={(v) => updateField('api_base_url', v)} placeholder="https://api..." />
                      <TextField label="Deploy URL" value={form.deployment_url} onChange={(v) => updateField('deployment_url', v)} placeholder="https://..." />
                    </div>
                  </div>
                </DashboardSection>
              </div>
            </div>
          ) : (
            // ── Read mode ─────────────────────────────────────────────────────
            <div className="px-5 py-5 sm:px-7 sm:py-6">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">

                {/* Left column */}
                <div className="flex min-w-0 flex-col gap-5">

                  {/* Project Summary */}
                  <DashboardSection
                    title="Resumo do Projeto"
                    subtitle="Visão editorial do projeto com foco em contexto, objetivo e escopo."
                    badge={overviewUsesMock ? <PreviewPill /> : undefined}
                  >
                    {hasOverview ? (
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-2xl font-semibold tracking-tight text-white/94">
                            {displayProfile.summary.value}
                          </h2>
                          {displayProfile.scope.value && (
                            <ClampedText
                              value={displayProfile.scope.value}
                              label="Escopo"
                              onExpand={handleExpand}
                              expanded={Boolean(expandedFields.Escopo)}
                              rows={3}
                            />
                          )}
                        </div>

                        {displayProfile.goal.value && (
                          <div className="relative max-h-44 overflow-hidden rounded-[18px] border border-accent-indigo/24 bg-[linear-gradient(180deg,rgba(10,12,16,0.92),rgba(13,15,20,0.92))] px-5 py-5 shadow-[inset_3px_0_0_0_rgba(99,102,241,0.92)]">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-[11px] font-semibold tracking-[0.22em] text-white/68 uppercase">Objetivo principal</p>
                              {displayProfile.goal.mocked && <PreviewPill>Preview</PreviewPill>}
                            </div>
                            <p className="mt-4 text-base leading-8 text-white/82">{displayProfile.goal.value}</p>
                            {displayProfile.goal.value.length > EXPAND_THRESHOLD && (
                              <>
                                <CardFade />
                                <CardExpandButton onClick={() => handleOpenCardModal('Objetivo principal', displayProfile.goal.value)} />
                              </>
                            )}
                          </div>
                        )}

                        <div className="grid gap-4 md:grid-cols-2">
                          {displayProfile.productContext.value && (
                            <div className="relative max-h-48 overflow-hidden rounded-[18px] border border-white/7 bg-surface-base/62 p-5">
                              <p className="mb-3 text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">Contexto do produto</p>
                              <p className="text-sm leading-7 text-white/62">{displayProfile.productContext.value}</p>
                              {displayProfile.productContext.value.length > EXPAND_THRESHOLD && (
                                <>
                                  <CardFade />
                                  <CardExpandButton onClick={() => handleOpenCardModal('Contexto do produto', displayProfile.productContext.value)} />
                                </>
                              )}
                            </div>
                          )}
                          {displayProfile.teamContext.value && (
                            <div className="relative max-h-48 overflow-hidden rounded-[18px] border border-white/7 bg-surface-base/62 p-5">
                              <p className="mb-3 text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">Contexto do time</p>
                              <p className="text-sm leading-7 text-white/62">{displayProfile.teamContext.value}</p>
                              {displayProfile.teamContext.value.length > EXPAND_THRESHOLD && (
                                <>
                                  <CardFade />
                                  <CardExpandButton onClick={() => handleOpenCardModal('Contexto do time', displayProfile.teamContext.value)} />
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <EmptyCta label="Adicionar contexto e objetivo" onClick={() => setEditing(true)} />
                    )}
                  </DashboardSection>

                  {/* System Architecture */}
                  <DashboardSection
                    title="Arquitetura do sistema"
                    subtitle="Blocos conceituais para comunicar a estrutura técnica do projeto."
                    badge={architectureUsesMock ? <PreviewPill /> : undefined}
                  >
                    {hasArchitecture ? (
                      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                        {architectureCards.map((card) => (
                          <article
                            key={card.title}
                            className="relative max-h-56 overflow-hidden rounded-[18px] border border-white/7 bg-[linear-gradient(180deg,rgba(10,12,16,0.88),rgba(18,20,28,0.74))] p-5 transition-[border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-accent-indigo/18"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-accent-indigo/18 bg-accent-indigo/10 text-accent-indigo/76">
                                <ArchitectureIcon kind={card.icon} />
                              </div>
                              {card.mocked && <PreviewPill>Preview</PreviewPill>}
                            </div>
                            <h3 className="mt-5 text-lg font-semibold text-white/92">{card.title}</h3>
                            <p className="mt-3 text-sm leading-7 text-white/52">{card.description}</p>
                            {card.description.length > EXPAND_THRESHOLD && (
                              <>
                                <CardFade />
                                <CardExpandButton onClick={() => handleOpenCardModal(card.title, card.description)} />
                              </>
                            )}
                          </article>
                        ))}
                      </div>
                    ) : (
                      <EmptyCta label="Adicionar arquitetura e regras" onClick={() => setEditing(true)} />
                    )}
                  </DashboardSection>

                  {/* Operational Notes */}
                  {(displayProfile.architectureSummary.value || displayProfile.businessRules.value) && (
                    <DashboardSection title="Operational Notes" subtitle="Campos centrais do projeto organizados para consulta rápida.">
                      <div className="grid gap-4 md:grid-cols-2">
                        {displayProfile.architectureSummary.value && (
                          <div className="relative max-h-48 overflow-hidden rounded-[18px] border border-white/7 bg-surface-base/62 p-5">
                            <p className="mb-3 text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">Resumo da arquitetura</p>
                            <p className="text-sm leading-7 text-white/62">{displayProfile.architectureSummary.value}</p>
                            {displayProfile.architectureSummary.value.length > EXPAND_THRESHOLD && (
                              <>
                                <CardFade />
                                <CardExpandButton onClick={() => handleOpenCardModal('Resumo da arquitetura', displayProfile.architectureSummary.value)} />
                              </>
                            )}
                          </div>
                        )}
                        {displayProfile.businessRules.value && (
                          <div className="relative max-h-48 overflow-hidden rounded-[18px] border border-white/7 bg-surface-base/62 p-5">
                            <p className="mb-3 text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">Regras de negócio</p>
                            <p className="text-sm leading-7 text-white/62">{displayProfile.businessRules.value}</p>
                            {displayProfile.businessRules.value.length > EXPAND_THRESHOLD && (
                              <>
                                <CardFade />
                                <CardExpandButton onClick={() => handleOpenCardModal('Regras de negócio', displayProfile.businessRules.value)} />
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </DashboardSection>
                  )}
                </div>

                {/* Right column */}
                <div className="flex flex-col gap-5">

                  {/* Main Stack */}
                  <DashboardSection
                    title="Stack Principal"
                    badge={displayProfile.mainStack.mocked ? <PreviewPill /> : undefined}
                  >
                    {hasStack ? (
                      <div className="flex flex-wrap gap-2.5">
                        {displayProfile.mainStack.value.map((item) => (
                          <StackBadge key={item} value={item} />
                        ))}
                      </div>
                    ) : (
                      <EmptyCta label="Adicionar stack" onClick={() => setEditing(true)} />
                    )}
                  </DashboardSection>

                  {/* Useful Links */}
                  <DashboardSection
                    title="Links úteis"
                    subtitle="Atalhos importantes para navegação rápida entre artefatos."
                    badge={links.some((l) => l.mocked) ? <PreviewPill /> : undefined}
                  >
                    {hasLinks ? (
                      <div className="flex flex-col gap-3">
                        {links.map((link) => (
                          <LinkRow key={link.label} {...link} />
                        ))}
                      </div>
                    ) : (
                      <EmptyCta label="Adicionar links" onClick={() => setEditing(true)} />
                    )}
                  </DashboardSection>

                  {/* Development Team */}
                  <DashboardSection
                    title="Time de Desenvolvimento"
                    subtitle="Pessoas diretamente envolvidas no contexto deste projeto."
                    badge={memberDataMocked ? <PreviewPill /> : undefined}
                  >
                    {members.length > 0 ? (
                      <div className="space-y-3">
                        {members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center gap-3 rounded-2xl border border-white/7 bg-surface-high/50 px-3.5 py-3"
                          >
                            <div
                              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                              style={{ backgroundColor: avatarColor(member.user_id) }}
                            >
                              {initials(member.user.name)}
                              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface-container bg-emerald-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-white/90">{member.user.name}</p>
                              <p className="truncate text-xs text-white/38">
                                {member.role === 'owner' ? 'Lead do projeto' : 'Membro do time'}
                              </p>
                            </div>
                            <span
                              className={
                                member.role === 'owner'
                                  ? 'shrink-0 rounded-full border border-accent-indigo/24 bg-accent-indigo/10 px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-accent-indigo/80 uppercase'
                                  : 'shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-medium tracking-[0.12em] text-white/34 uppercase'
                              }
                            >
                              {member.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-white/28">Nenhum membro cadastrado.</p>
                    )}
                  </DashboardSection>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {expandedCard && (
        <Modal
          open
          title={expandedCard.label}
          description="Visualização completa do conteúdo do card."
          onClose={() => setExpandedCard(null)}
          footer={(
            <button
              type="button"
              onClick={() => setExpandedCard(null)}
              className="rounded-[12px] border border-white/10 bg-surface-high px-4 py-2.5 text-xs font-medium text-white/60 transition-[border-color,color] duration-150 hover:border-white/18 hover:text-white/82"
            >
              Fechar
            </button>
          )}
        >
          <div className="rounded-[18px] border border-white/7 bg-[linear-gradient(180deg,rgba(10,12,16,0.88),rgba(18,20,28,0.78))] px-5 py-5">
            <p className="whitespace-pre-wrap text-sm leading-8 text-white/76">{expandedCard.value}</p>
          </div>
        </Modal>
      )}

      {/* ── Delete modal ── */}
      <Modal
        open={deleteModalOpen}
        title="Excluir projeto"
        description="Essa ação remove o projeto permanentemente. Você perderá o acesso a esse contexto e não poderá desfazer a exclusão."
        onClose={() => {
          if (!deleting) setDeleteModalOpen(false)
        }}
        footer={(
          <>
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
              className="rounded-[12px] border border-white/10 bg-surface-high px-4 py-2.5 text-xs font-medium text-white/56 transition-[border-color,color] duration-150 hover:border-white/18 hover:text-white/76 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDeleteProject}
              disabled={deleting}
              className="rounded-[12px] border border-red-500/18 bg-red-500/14 px-4 py-2.5 text-xs font-semibold tracking-[0.16em] text-red-200 uppercase transition-[filter,transform,opacity] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
            >
              {deleting ? 'Excluindo...' : 'Confirmar exclusão'}
            </button>
          </>
        )}
      >
        <div className="rounded-2xl border border-white/7 bg-surface-base/74 px-4 py-4">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-white/28 uppercase">Projeto selecionado</p>
          <p className="mt-2 text-sm font-semibold text-white/90">{project.name}</p>
          {project.description && (
            <p className="mt-2 text-sm leading-6 text-white/48">{project.description}</p>
          )}
        </div>
      </Modal>
    </div>
  )
}
