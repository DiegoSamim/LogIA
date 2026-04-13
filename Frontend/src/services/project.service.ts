import api from './api'
import type { ProjectDTO, ProjectDetailDTO } from '@/data/dtos'

export interface CreateProjectRequest {
  name: string
  description?: string | null
  repository_url?: string | null
  color?: string | null
  status?: string
  profile?: {
    summary?: string | null
    goal?: string | null
    scope?: string | null
    main_stack?: string[]
    architecture_summary?: string | null
    product_context?: string | null
    business_rules?: string | null
    team_context?: string | null
    default_language?: string | null
    documentation_url?: string | null
    figma_url?: string | null
    board_url?: string | null
    api_base_url?: string | null
    deployment_url?: string | null
  }
}

export interface UpdateProjectRequest {
  name?: string
  description?: string | null
  repository_url?: string | null
  color?: string | null
  status?: string
}

export interface UpdateProfileRequest {
  summary?: string | null
  goal?: string | null
  scope?: string | null
  main_stack?: string[]
  architecture_summary?: string | null
  product_context?: string | null
  business_rules?: string | null
  team_context?: string | null
  default_language?: string | null
  documentation_url?: string | null
  figma_url?: string | null
  board_url?: string | null
  api_base_url?: string | null
  deployment_url?: string | null
}

export const projectService = {
  list: () => api.get<ProjectDTO[]>('/projects'),
  create: (data: CreateProjectRequest) => api.post<ProjectDetailDTO>('/projects', data),
  get: (id: string) => api.get<ProjectDetailDTO>(`/projects/${id}`),
  update: (id: string, data: UpdateProjectRequest) =>
    api.put<ProjectDetailDTO>(`/projects/${id}`, data),
  updateProfile: (id: string, data: UpdateProfileRequest) =>
    api.put<ProjectDetailDTO>(`/projects/${id}/profile`, data),
  remove: (id: string) => api.delete(`/projects/${id}`),
}
