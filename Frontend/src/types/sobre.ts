import type { ProjectDetailDTO } from '@/data/dtos'

export interface ProjectFormState {
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
  mainStack: { value: string[] }
  repositoryUrl: DisplayValue
  documentationUrl: DisplayValue
  figmaUrl: DisplayValue
  boardUrl: DisplayValue
  apiBaseUrl: DisplayValue
  deploymentUrl: DisplayValue
}

export interface LinkItem {
  label: string
  url: string
}

export interface ExpandedCardState {
  label: string
  value: string
}

export type LinkType = 'github' | 'figma' | 'book' | 'grid' | 'terminal' | 'globe'

export type ProjectDetail = ProjectDetailDTO
