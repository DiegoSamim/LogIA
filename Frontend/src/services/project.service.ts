import api from './api'
import type {
  AddProjectMemberRequest,
  ProjectAttachmentDTO,
  ProjectDTO,
  ProjectDetailDTO,
  ProjectMemberDTO,
  UpdateProjectMemberRequest,
  UserLookupDTO,
} from '@/data/dtos'

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
    frontend_stack?: string[]
    backend_stack?: string[]
    infra_stack?: string[]
    database_stack?: string[]
    other_stack?: string[]
    architecture_summary?: string | null
    architecture_frontend?: string | null
    architecture_backend?: string | null
    architecture_integrations?: string | null
    architecture_data?: string | null
    architecture_infra?: string | null
    product_context?: string | null
    business_rules?: string | null
    business_rules_core?: string | null
    business_rules_permissions?: string | null
    business_rules_validations?: string | null
    business_rules_constraints?: string | null
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
  frontend_stack?: string[]
  backend_stack?: string[]
  infra_stack?: string[]
  database_stack?: string[]
  other_stack?: string[]
  architecture_summary?: string | null
  architecture_frontend?: string | null
  architecture_backend?: string | null
  architecture_integrations?: string | null
  architecture_data?: string | null
  architecture_infra?: string | null
  product_context?: string | null
  business_rules?: string | null
  business_rules_core?: string | null
  business_rules_permissions?: string | null
  business_rules_validations?: string | null
  business_rules_constraints?: string | null
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
  listMembers: (id: string) => api.get<ProjectMemberDTO[]>(`/projects/${id}/members`),
  addMember: (id: string, data: AddProjectMemberRequest) =>
    api.post<ProjectMemberDTO>(`/projects/${id}/members`, data),
  updateMember: (projectId: string, memberId: string, data: UpdateProjectMemberRequest) =>
    api.patch<ProjectMemberDTO>(`/projects/${projectId}/members/${memberId}`, data),
  removeMember: (projectId: string, memberId: string) =>
    api.delete(`/projects/${projectId}/members/${memberId}`),
  searchUserByEmail: (email: string) =>
    api.get<UserLookupDTO | null>('/users/search', { params: { email } }),
  remove: (id: string) => api.delete(`/projects/${id}`),
  listAttachments: (projectId: string) =>
    api.get<ProjectAttachmentDTO[]>(`/projects/${projectId}/attachments`),
  uploadAttachment: (projectId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<ProjectAttachmentDTO>(`/projects/${projectId}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  deleteAttachment: (projectId: string, attachmentId: string) =>
    api.delete(`/projects/${projectId}/attachments/${attachmentId}`),
}
