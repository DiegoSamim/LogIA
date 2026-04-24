import type { ProjectMemberRole } from '@/data/dtos'

export function canEditProjectRole(role: ProjectMemberRole | null | undefined): boolean {
  return role === 'admin' || role === 'editor'
}

export function canManageProjectMembersRole(role: ProjectMemberRole | null | undefined): boolean {
  return role === 'admin'
}

export function canDeleteProjectRole(role: ProjectMemberRole | null | undefined): boolean {
  return role === 'admin'
}
