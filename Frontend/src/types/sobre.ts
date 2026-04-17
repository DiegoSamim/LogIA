import type { ProjectDetailDTO } from '@/data/dtos'
import type { StackCategoryKey } from '@/data/stackCatalog'

export interface ProjectFormState {
  name: string
  description: string
  repository_url: string
  color: string
  status: string
  summary: string
  goal: string
  scope: string
  frontend_stack: string[]
  backend_stack: string[]
  infra_stack: string[]
  database_stack: string[]
  other_stack: string[]
  architecture_summary: string
  architecture_frontend: string
  architecture_backend: string
  architecture_integrations: string
  architecture_data: string
  architecture_infra: string
  product_context: string
  business_rules: string
  business_rules_core: string
  business_rules_permissions: string
  business_rules_validations: string
  business_rules_constraints: string
  team_context: string
  default_language: string
  documentation_url: string
  figma_url: string
  board_url: string
  api_base_url: string
  deployment_url: string
}

export interface DisplayValue {
  value: string
}

export type ArchitectureCardIcon = 'frontend' | 'backend' | 'storage' | 'orchestration'

export interface ArchitectureCardModel {
  title: string
  description: string
  icon: ArchitectureCardIcon
}

export interface DisplayProfile {
  description: DisplayValue
  summary: DisplayValue
  goal: DisplayValue
  scope: DisplayValue
  architectureSummary: DisplayValue
  productContext: DisplayValue
  businessRules: DisplayValue
  teamContext: DisplayValue
  defaultLanguage: DisplayValue
  stackGroups: StackGroupModel[]
  repositoryUrl: DisplayValue
  documentationUrl: DisplayValue
  figmaUrl: DisplayValue
  boardUrl: DisplayValue
  apiBaseUrl: DisplayValue
  deploymentUrl: DisplayValue
  architectureSections: ContentCardModel[]
  businessRuleSections: ContentCardModel[]
}

export interface LinkItem {
  label: string
  url: string
}

export interface StackGroupModel {
  key: StackCategoryKey
  title: string
  description: string
  items: string[]
}

export interface ContentCardModel {
  title: string
  description: string
  accent: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky'
  icon: ArchitectureCardIcon
}

export interface ExpandedCardState {
  label: string
  value: string
}

export type LinkType = 'github' | 'figma' | 'book' | 'grid' | 'terminal' | 'globe'

export type ProjectDetail = ProjectDetailDTO
