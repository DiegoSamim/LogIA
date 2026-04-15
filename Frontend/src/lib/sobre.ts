import type { ProjectDetailDTO, ProjectMemberRole } from '@/data/dtos'
import type {
  ArchitectureCardModel,
  DisplayProfile,
  DisplayValue,
  LinkItem,
  ProjectFormState,
} from '@/types/sobre'

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  paused: 'Pausado',
  archived: 'Arquivado',
}

const AVATAR_PALETTE = ['#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B']

export const EXPAND_THRESHOLD = 200

export function formatStatus(status: string): string {
  return STATUS_LABELS[status] ?? status
}

export function resolveDisplayValue(actual: string | null | undefined): DisplayValue {
  const trimmed = actual?.trim()
  return { value: trimmed ?? '' }
}

export function toFormState(project: ProjectDetailDTO): ProjectFormState {
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

export function normalizeNullable(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function normalizeStack(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function avatarColor(userId: string): string {
  let hash = 0
  for (const ch of userId) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function formatMemberRole(role: ProjectMemberRole): string {
  if (role === 'admin') return 'Administrador'
  if (role === 'editor') return 'Editor'
  return 'Visualizador'
}

export function buildDisplayProfile(project: ProjectDetailDTO): DisplayProfile {
  const description = resolveDisplayValue(project.description)
  const summary = resolveDisplayValue(project.profile?.summary)
  const goal = resolveDisplayValue(project.profile?.goal)
  const scope = resolveDisplayValue(project.profile?.scope)
  const architectureSummary = resolveDisplayValue(project.profile?.architecture_summary)
  const productContext = resolveDisplayValue(project.profile?.product_context)
  const businessRules = resolveDisplayValue(project.profile?.business_rules)
  const teamContext = resolveDisplayValue(project.profile?.team_context)
  const defaultLanguage = resolveDisplayValue(project.profile?.default_language)

  const mainStack =
    project.profile?.main_stack?.filter(Boolean).length
      ? { value: project.profile?.main_stack.filter(Boolean) ?? [] }
      : project.stack?.length
        ? { value: project.stack }
        : { value: [] }

  return {
    description,
    summary,
    goal,
    scope,
    architectureSummary,
    productContext,
    businessRules,
    teamContext,
    defaultLanguage,
    mainStack,
    repositoryUrl: resolveDisplayValue(project.repository_url),
    documentationUrl: resolveDisplayValue(project.profile?.documentation_url),
    figmaUrl: resolveDisplayValue(project.profile?.figma_url),
    boardUrl: resolveDisplayValue(project.profile?.board_url),
    apiBaseUrl: resolveDisplayValue(project.profile?.api_base_url),
    deploymentUrl: resolveDisplayValue(project.profile?.deployment_url),
  }
}

export function buildArchitectureCards(displayProfile: DisplayProfile): ArchitectureCardModel[] {
  const cards: ArchitectureCardModel[] = [
    {
      title: 'Frontend Experience',
      description: displayProfile.productContext.value,
      icon: 'frontend',
    },
    {
      title: 'Application Layer',
      description: displayProfile.architectureSummary.value,
      icon: 'backend',
    },
    {
      title: 'Persistence',
      description: displayProfile.mainStack.value.length
        ? `Base apoiada por ${displayProfile.mainStack.value.slice(0, 3).join(', ')} para manter contexto, relações e histórico operacional.`
        : '',
      icon: 'storage',
    },
    {
      title: 'Orchestration',
      description: displayProfile.businessRules.value,
      icon: 'orchestration',
    },
  ]

  return cards.filter((card) => card.description)
}

export function buildProjectLinks(displayProfile: DisplayProfile): LinkItem[] {
  return [
    { label: 'GitHub Repository', url: displayProfile.repositoryUrl.value },
    { label: 'Product Documentation', url: displayProfile.documentationUrl.value },
    { label: 'Figma Design File', url: displayProfile.figmaUrl.value },
    { label: 'Project Board', url: displayProfile.boardUrl.value },
    { label: 'API Base URL', url: displayProfile.apiBaseUrl.value },
    { label: 'Deployment URL', url: displayProfile.deploymentUrl.value },
  ].filter((link) => link.url)
}
