import type { ProjectDetailDTO, ProjectMemberRole } from '@/data/dtos'
import {
  categorizeStackValues,
  combineCategorizedStacks,
  normalizeStackValues,
  type StackCategoryKey,
} from '@/data/stackCatalog'
import type {
  ContentCardModel,
  DisplayProfile,
  DisplayValue,
  LinkItem,
  ProjectFormState,
  StackGroupModel,
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
  const stackGroups = resolveProjectStackGroups(project)

  return {
    name: project.name ?? '',
    description: project.description ?? '',
    repository_url: project.repository_url ?? '',
    color: project.color ?? '#6366F1',
    status: project.status ?? 'active',
    summary: project.profile?.summary ?? '',
    goal: project.profile?.goal ?? '',
    scope: project.profile?.scope ?? '',
    frontend_stack: stackGroups.frontend_stack,
    backend_stack: stackGroups.backend_stack,
    infra_stack: stackGroups.infra_stack,
    database_stack: stackGroups.database_stack,
    other_stack: stackGroups.other_stack,
    architecture_summary: project.profile?.architecture_summary ?? '',
    architecture_frontend: project.profile?.architecture_frontend ?? '',
    architecture_backend: project.profile?.architecture_backend ?? '',
    architecture_integrations: project.profile?.architecture_integrations ?? '',
    architecture_data: project.profile?.architecture_data ?? '',
    architecture_infra: project.profile?.architecture_infra ?? '',
    product_context: project.profile?.product_context ?? '',
    business_rules: project.profile?.business_rules ?? '',
    business_rules_core: project.profile?.business_rules_core ?? '',
    business_rules_permissions: project.profile?.business_rules_permissions ?? '',
    business_rules_validations: project.profile?.business_rules_validations ?? '',
    business_rules_constraints: project.profile?.business_rules_constraints ?? '',
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

export function normalizeStackList(values: string[]) {
  return normalizeStackValues(values)
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
  const stackGroups = buildStackGroupModels(resolveProjectStackGroups(project))
  const architectureSections = buildArchitectureCards(project)
  const businessRuleSections = buildBusinessRuleCards(project)

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
    stackGroups,
    repositoryUrl: resolveDisplayValue(project.repository_url),
    documentationUrl: resolveDisplayValue(project.profile?.documentation_url),
    figmaUrl: resolveDisplayValue(project.profile?.figma_url),
    boardUrl: resolveDisplayValue(project.profile?.board_url),
    apiBaseUrl: resolveDisplayValue(project.profile?.api_base_url),
    deploymentUrl: resolveDisplayValue(project.profile?.deployment_url),
    architectureSections,
    businessRuleSections,
  }
}

function resolveProjectStackGroups(project: ProjectDetailDTO): Record<StackCategoryKey, string[]> {
  const profile = project.profile
  const categorized = {
    frontend_stack: normalizeStackValues(profile?.frontend_stack ?? []),
    backend_stack: normalizeStackValues(profile?.backend_stack ?? []),
    infra_stack: normalizeStackValues(profile?.infra_stack ?? []),
    database_stack: normalizeStackValues(profile?.database_stack ?? []),
    other_stack: normalizeStackValues(profile?.other_stack ?? []),
  }

  const hasCategorizedValues = Object.values(categorized).some((items) => items.length > 0)
  if (hasCategorizedValues) {
    return categorized
  }

  return categorizeStackValues(profile?.main_stack?.length ? profile.main_stack : project.stack ?? [])
}

function buildStackGroupModels(groups: Record<StackCategoryKey, string[]>): StackGroupModel[] {
  return [
    {
      key: 'frontend_stack',
      title: 'Frontend',
      description: 'Interface, web e apps',
      items: groups.frontend_stack,
    },
    {
      key: 'backend_stack',
      title: 'Backend',
      description: 'APIs, serviços e regras',
      items: groups.backend_stack,
    },
    {
      key: 'infra_stack',
      title: 'Infra/Cloud',
      description: 'Deploy, infraestrutura e operação',
      items: groups.infra_stack,
    },
    {
      key: 'database_stack',
      title: 'Banco de Dados',
      description: 'Persistência, busca e cache',
      items: groups.database_stack,
    },
    {
      key: 'other_stack',
      title: 'Outras tecnologias',
      description: 'Itens legados ou personalizados',
      items: groups.other_stack,
    },
  ]
}

export function buildArchitectureCards(project: ProjectDetailDTO): ContentCardModel[] {
  const profile = project.profile
  const cards: ContentCardModel[] = [
    {
      title: 'Frontend',
      description: profile?.architecture_frontend ?? '',
      icon: 'frontend',
      accent: 'sky',
    },
    {
      title: 'Backend',
      description: profile?.architecture_backend || profile?.architecture_summary || '',
      icon: 'backend',
      accent: 'indigo',
    },
    {
      title: 'Integrações',
      description: profile?.architecture_integrations ?? '',
      icon: 'orchestration',
      accent: 'amber',
    },
    {
      title: 'Dados',
      description: profile?.architecture_data ?? '',
      icon: 'storage',
      accent: 'emerald',
    },
    {
      title: 'Infraestrutura',
      description: profile?.architecture_infra ?? '',
      icon: 'orchestration',
      accent: 'rose',
    },
  ]

  return cards
}

export function buildBusinessRuleCards(project: ProjectDetailDTO): ContentCardModel[] {
  const profile = project.profile
  const cards: ContentCardModel[] = [
    {
      title: 'Regras principais',
      description: profile?.business_rules_core || profile?.business_rules || '',
      icon: 'orchestration',
      accent: 'indigo',
    },
    {
      title: 'Permissões e papéis',
      description: profile?.business_rules_permissions ?? '',
      icon: 'backend',
      accent: 'sky',
    },
    {
      title: 'Validações',
      description: profile?.business_rules_validations ?? '',
      icon: 'storage',
      accent: 'emerald',
    },
    {
      title: 'Restrições e exceções',
      description: profile?.business_rules_constraints ?? '',
      icon: 'orchestration',
      accent: 'amber',
    },
  ]

  return cards
}

export function buildProjectLinks(displayProfile: DisplayProfile): LinkItem[] {
  return [
    { label: 'Repositório', url: displayProfile.repositoryUrl.value },
    { label: 'Documentação', url: displayProfile.documentationUrl.value },
    { label: 'Figma', url: displayProfile.figmaUrl.value },
    { label: 'Quadro do projeto', url: displayProfile.boardUrl.value },
    { label: 'Base da API', url: displayProfile.apiBaseUrl.value },
    { label: 'Ambiente publicado', url: displayProfile.deploymentUrl.value },
  ]
}

export function combineFormStacks(form: Pick<ProjectFormState, 'frontend_stack' | 'backend_stack' | 'infra_stack' | 'database_stack' | 'other_stack'>) {
  return combineCategorizedStacks(form)
}
