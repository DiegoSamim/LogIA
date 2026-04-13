import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { ProjectDetailDTO } from '@/data/dtos'
import Modal from '@/components/ui/Modal'
import {
  projectService,
  type UpdateProfileRequest,
  type UpdateProjectRequest,
} from '@/services/project.service'
import { useAppStore } from '@/store/useAppStore'

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
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
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

function ExternalLinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

function LinkRow({ label, url }: { label: string; url: string | null | undefined }) {
  if (!url?.trim()) return null
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2.5 rounded-card px-3 py-2.5 text-sm text-white/56 transition-colors duration-150 hover:bg-surface-high hover:text-white/82"
    >
      <span className="shrink-0 text-accent-indigo/60">
        <ExternalLinkIcon />
      </span>
      <span className="truncate">{label}</span>
    </a>
  )
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">{label}</p>
      <p className="text-sm leading-6 text-white/76">{value?.trim() ? value : '—'}</p>
    </div>
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

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-card border border-white/8 bg-surface-container/86 p-5">
      <div className="mb-4">
        <p className="text-sm font-semibold text-white/88">{title}</p>
        {subtitle && <p className="mt-1 text-xs leading-5 text-white/38">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

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

  const stackChips = useMemo(
    () => normalizeStack(form?.main_stack ?? ''),
    [form?.main_stack],
  )

  const projectLinks = useMemo(() => {
    if (!project) return []
    return [
      { label: 'Repositório', url: project.repository_url },
      { label: 'Documentação', url: project.profile?.documentation_url },
      { label: 'Figma', url: project.profile?.figma_url },
      { label: 'Board', url: project.profile?.board_url },
      { label: 'API base URL', url: project.profile?.api_base_url },
      { label: 'Deploy URL', url: project.profile?.deployment_url },
    ].filter((l) => l.url?.trim())
  }, [project])

  function updateField<K extends keyof ProjectFormState>(field: K, value: ProjectFormState[K]) {
    setForm((current) => (current ? { ...current, [field]: value } : current))
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

  if (loading) {
    return (
      <div className="min-h-full bg-surface-base px-6 pb-16 pt-8 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="flex min-h-[360px] items-center justify-center rounded-card border border-white/8 bg-surface-container">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/12 border-t-accent-indigo/70" />
          </div>
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-full bg-surface-base px-6 pb-16 pt-8 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-card border border-white/8 bg-surface-container p-8 text-center">
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

  if (!project || !form) {
    return (
      <div className="min-h-full bg-surface-base px-6 pb-16 pt-8 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-card border border-white/8 bg-surface-container p-8 text-center">
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
  const members = project.members ?? []

  return (
    <div className="min-h-full bg-surface-base px-6 pb-16 pt-8 sm:px-8">
      <div className="mx-auto max-w-6xl">

        {/* Hero */}
        <div
          className="mb-6 overflow-hidden rounded-card border border-white/8 bg-surface-container/82"
          style={{ borderTopColor: accentColor, borderTopWidth: 3 }}
        >
          <div className="p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold tracking-[0.22em] text-accent-indigo/72 uppercase">
                  Detalhes do projeto
                </p>
                <h1 className="mt-2 truncate text-3xl font-semibold tracking-tight text-white/94">
                  {project.name}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/46">
                  {project.description || 'Complete os detalhes do projeto para enriquecer o contexto técnico usado no registro e na consulta.'}
                </p>

                {/* status + language */}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase"
                    style={{ borderColor: `${accentColor}44`, color: accentColor }}
                  >
                    {project.status}
                  </span>
                  {project.profile?.default_language && (
                    <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] text-white/42">
                      {project.profile.default_language}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                {/* member avatar group */}
                {members.length > 0 && (
                  <div className="flex -space-x-2">
                    {members.slice(0, 5).map((m) => (
                      <div
                        key={m.id}
                        title={`${m.user.name} — ${m.role}`}
                        className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface-container text-[10px] font-bold text-white"
                        style={{ backgroundColor: avatarColor(m.user_id) }}
                      >
                        {initials(m.user.name)}
                      </div>
                    ))}
                    {members.length > 5 && (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface-container bg-surface-high text-[10px] font-semibold text-white/50">
                        +{members.length - 5}
                      </div>
                    )}
                  </div>
                )}

                {/* action buttons */}
                <div className="flex flex-wrap gap-2">
                  {editing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={saving}
                        className="rounded-btn border border-white/10 bg-surface-high px-4 py-2.5 text-xs font-medium text-white/52 transition-[border-color,color] duration-150 hover:border-white/18 hover:text-white/76 disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || !form.name.trim()}
                        className="rounded-btn bg-linear-to-r from-accent-indigo to-accent-violet px-4 py-2.5 text-xs font-semibold tracking-[0.16em] text-white uppercase transition-[filter,transform,opacity] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                      >
                        {saving ? 'Salvando...' : 'Salvar'}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setDeleteModalOpen(true)}
                        className="rounded-btn border border-red-500/16 bg-red-500/8 px-4 py-2.5 text-xs font-semibold tracking-[0.16em] text-red-300 uppercase transition-[border-color,background-color,color] duration-150 hover:border-red-500/28 hover:bg-red-500/12 hover:text-red-200"
                      >
                        Excluir
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="rounded-btn bg-linear-to-r from-accent-indigo to-accent-violet px-4 py-2.5 text-xs font-semibold tracking-[0.16em] text-white uppercase transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98]"
                      >
                        Editar
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <p className="mt-4 rounded-btn border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        {editing ? (
          /* ── Edit mode: 2-column grid ── */
          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard title="Visão geral" subtitle="Campos principais da tabela projects.">
              <div className="grid gap-4">
                <TextField label="Nome" value={form.name} onChange={(v) => updateField('name', v)} />
                <TextAreaField label="Descrição" value={form.description} onChange={(v) => updateField('description', v)} rows={4} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField label="Repositório" value={form.repository_url} onChange={(v) => updateField('repository_url', v)} placeholder="https://github.com/..." />
                  <TextField label="Cor" value={form.color} onChange={(v) => updateField('color', v)} placeholder="#6366F1" />
                </div>
                <label className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">Status</span>
                  <select
                    value={form.status}
                    onChange={(e) => updateField('status', e.target.value)}
                    className="rounded-[14px] border border-white/8 bg-surface-high/70 px-3.5 py-3 text-sm text-white/86 outline-none transition-[border-color,box-shadow] duration-150 focus:border-accent-indigo/34 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
                  >
                    <option value="active">active</option>
                    <option value="paused">paused</option>
                    <option value="archived">archived</option>
                  </select>
                </label>
              </div>
            </SectionCard>

            <SectionCard title="Contexto e objetivo" subtitle="Informações de alto nível.">
              <div className="grid gap-4">
                <TextAreaField label="Resumo" value={form.summary} onChange={(v) => updateField('summary', v)} rows={4} />
                <TextAreaField label="Objetivo" value={form.goal} onChange={(v) => updateField('goal', v)} rows={4} />
                <TextAreaField label="Escopo" value={form.scope} onChange={(v) => updateField('scope', v)} rows={4} />
                <TextField label="Stack principal" value={form.main_stack} onChange={(v) => updateField('main_stack', v)} placeholder="React, TypeScript, FastAPI..." />
              </div>
            </SectionCard>

            <SectionCard title="Arquitetura e regras" subtitle="Contexto técnico e regras do domínio.">
              <div className="grid gap-4">
                <TextAreaField label="Resumo da arquitetura" value={form.architecture_summary} onChange={(v) => updateField('architecture_summary', v)} rows={5} />
                <TextAreaField label="Contexto do produto" value={form.product_context} onChange={(v) => updateField('product_context', v)} rows={4} />
                <TextAreaField label="Regras de negócio" value={form.business_rules} onChange={(v) => updateField('business_rules', v)} rows={4} />
              </div>
            </SectionCard>

            <SectionCard title="Time, linguagem e links" subtitle="Dados auxiliares e referências externas.">
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
            </SectionCard>
          </div>
        ) : (
          /* ── Read mode: asymmetric layout ── */
          <div className="grid gap-4 lg:grid-cols-[1fr_300px]">

            {/* Left column — main content */}
            <div className="flex flex-col gap-4">
              <SectionCard title="Visão geral" subtitle="Campos principais da tabela projects.">
                <div className="grid gap-4">
                  <ReadOnlyField label="Nome" value={project.name} />
                  <ReadOnlyField label="Descrição" value={project.description} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ReadOnlyField label="Repositório" value={project.repository_url} />
                    <ReadOnlyField label="Cor" value={project.color} />
                    <ReadOnlyField label="Status" value={project.status} />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Contexto e objetivo" subtitle="Informações de alto nível para orientar entendimento do projeto.">
                <div className="grid gap-4">
                  <ReadOnlyField label="Resumo" value={project.profile?.summary} />
                  <ReadOnlyField label="Objetivo" value={project.profile?.goal} />
                  <ReadOnlyField label="Escopo" value={project.profile?.scope} />
                </div>
              </SectionCard>

              <SectionCard title="Arquitetura e regras" subtitle="Contexto técnico e regras importantes do domínio.">
                <div className="grid gap-4">
                  <ReadOnlyField label="Resumo da arquitetura" value={project.profile?.architecture_summary} />
                  <ReadOnlyField label="Contexto do produto" value={project.profile?.product_context} />
                  <ReadOnlyField label="Regras de negócio" value={project.profile?.business_rules} />
                  <ReadOnlyField label="Contexto do time" value={project.profile?.team_context} />
                </div>
              </SectionCard>
            </div>

            {/* Right column — auxiliary panel */}
            <div className="flex flex-col gap-4">

              {/* Stack */}
              <SectionCard title="Stack">
                {stackChips.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {stackChips.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-accent-indigo/20 bg-accent-indigo/8 px-3 py-1.5 text-xs font-medium text-accent-indigo/86"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/28">Nenhuma tecnologia cadastrada.</p>
                )}
              </SectionCard>

              {/* Links */}
              <SectionCard title="Links">
                {projectLinks.length > 0 ? (
                  <div className="-mx-1 flex flex-col">
                    {projectLinks.map((l) => (
                      <LinkRow key={l.label} label={l.label} url={l.url} />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/28">Nenhum link configurado.</p>
                )}
              </SectionCard>

              {/* Team */}
              <SectionCard title="Equipe">
                {members.length > 0 ? (
                  <div className="flex flex-col gap-1">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 rounded-card px-3 py-2.5 transition-colors duration-150 hover:bg-surface-high"
                      >
                        <div
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{ backgroundColor: avatarColor(member.user_id) }}
                        >
                          {initials(member.user.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-white/82">{member.user.name}</p>
                          <p className="truncate text-[11px] text-white/36">{member.user.email}</p>
                        </div>
                        <span
                          className={
                            member.role === 'owner'
                              ? 'shrink-0 rounded-full border border-accent-indigo/24 bg-accent-indigo/10 px-2 py-0.5 text-[10px] font-semibold text-accent-indigo/80'
                              : 'shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/34'
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
              </SectionCard>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={deleteModalOpen}
        title="Excluir projeto"
        description="Essa ação remove o projeto permanentemente. Você perderá o acesso a esse contexto e não poderá desfazer a exclusão."
        onClose={() => {
          if (!deleting) {
            setDeleteModalOpen(false)
          }
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
        <div className="rounded-[16px] border border-white/7 bg-surface-base/74 px-4 py-4">
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
