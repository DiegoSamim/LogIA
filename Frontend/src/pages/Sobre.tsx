import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { ProjectAttachmentDTO, ProjectDetailDTO, ProjectMemberRole, UserLookupDTO } from '@/data/dtos'
import {
  projectService,
  type UpdateProfileRequest,
  type UpdateProjectRequest,
} from '@/services/project.service'
import ProjectAttachments from '@/components/Sobre/ProjectAttachments'
import { useAppStore } from '@/store/useAppStore'
import {
  AboutEditContent,
  AboutHero,
  AboutPageState,
  AboutReadContent,
  DeleteProjectModal,
  ExpandedCardModal,
} from '@/components/Sobre'
import type { ExpandedCardState, ProjectFormState } from '@/types/sobre'
import {
  buildDisplayProfile,
  buildProjectLinks,
  combineFormStacks,
  normalizeNullable,
  toFormState,
} from '@/lib/sobre'
import {
  canDeleteProjectRole,
  canEditProjectRole,
  canManageProjectMembersRole,
} from '@/lib/permissions'

export default function Sobre() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { currentUser, setCurrentProject } = useAppStore()

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
  const [expandedCard, setExpandedCard] = useState<ExpandedCardState | null>(null)
  const [memberEmailQuery, setMemberEmailQuery] = useState('')
  const [memberLookup, setMemberLookup] = useState<UserLookupDTO | null>(null)
  const [memberSearchLoading, setMemberSearchLoading] = useState(false)
  const [memberMutationLoading, setMemberMutationLoading] = useState<string | null>(null)
  const [memberError, setMemberError] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<Exclude<ProjectMemberRole, 'admin'>>('viewer')
  const [attachments, setAttachments] = useState<ProjectAttachmentDTO[]>([])
  const [editScrollTarget, setEditScrollTarget] = useState<string | null>(null)

  useEffect(() => {
    if (editing && editScrollTarget) {
      const timer = setTimeout(() => {
        const el = document.getElementById(editScrollTarget)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setEditScrollTarget(null)
      }, 60)
      return () => clearTimeout(timer)
    }
  }, [editing, editScrollTarget])

  function handleStartEditing(sectionId?: string) {
    setEditing(true)
    if (sectionId) setEditScrollTarget(sectionId)
  }

  useEffect(() => {
    if (!projectId) {
      setNotFound(true)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setNotFound(false)

    Promise.all([
      projectService.get(projectId),
      projectService.listAttachments(projectId),
    ])
      .then(([projectRes, attachmentsRes]) => {
        setProject(projectRes.data)
        setForm(toFormState(projectRes.data))
        setCurrentProject({
          id: projectRes.data.id,
          name: projectRes.data.name,
          current_user_role: projectRes.data.current_user_role,
        })
        setAttachments(attachmentsRes.data)
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

  const displayProfile = useMemo(() => (project ? buildDisplayProfile(project) : null), [project])
  const links = useMemo(() => (displayProfile ? buildProjectLinks(displayProfile) : []), [displayProfile])
  const currentUserRole = project?.current_user_role
  const canEditProject = canEditProjectRole(currentUserRole)
  const canManageMembers = canManageProjectMembersRole(currentUserRole)
  const canDeleteProject = canDeleteProjectRole(currentUserRole)

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

  async function refreshProject() {
    if (!projectId) return
    const { data } = await projectService.get(projectId)
    setProject(data)
    setCurrentProject({ id: data.id, name: data.name, current_user_role: data.current_user_role })
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
      main_stack: combineFormStacks(form),
      frontend_stack: form.frontend_stack,
      backend_stack: form.backend_stack,
      infra_stack: form.infra_stack,
      database_stack: form.database_stack,
      other_stack: form.other_stack,
      architecture_summary: normalizeNullable(form.architecture_summary),
      architecture_frontend: normalizeNullable(form.architecture_frontend),
      architecture_backend: normalizeNullable(form.architecture_backend),
      architecture_integrations: normalizeNullable(form.architecture_integrations),
      architecture_data: normalizeNullable(form.architecture_data),
      architecture_infra: normalizeNullable(form.architecture_infra),
      product_context: normalizeNullable(form.product_context),
      business_rules: normalizeNullable(form.business_rules),
      business_rules_core: normalizeNullable(form.business_rules_core),
      business_rules_permissions: normalizeNullable(form.business_rules_permissions),
      business_rules_validations: normalizeNullable(form.business_rules_validations),
      business_rules_constraints: normalizeNullable(form.business_rules_constraints),
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
      setCurrentProject({ id: data.id, name: data.name, current_user_role: data.current_user_role })
      setEditing(false)
    } catch {
      setError('Não foi possível salvar as alterações do projeto.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteProject() {
    if (!projectId) return
    if (!canDeleteProject) return

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

  async function handleSearchMember() {
    const email = memberEmailQuery.trim()
    if (!email || !canManageMembers) return

    setMemberSearchLoading(true)
    setMemberLookup(null)
    setMemberError(null)

    try {
      const { data } = await projectService.searchUserByEmail(email)
      if (!data) {
        setMemberError('Nenhum usuário cadastrado foi encontrado com esse email.')
        return
      }
      if (project?.members.some((member) => member.user_id === data.id)) {
        setMemberError('Esse usuário já faz parte do projeto.')
        return
      }
      setMemberLookup(data)
    } catch {
      setMemberError('Não foi possível buscar o usuário por email.')
    } finally {
      setMemberSearchLoading(false)
    }
  }

  async function handleAddMember() {
    if (!projectId || !memberLookup || !canManageMembers) return

    setMemberMutationLoading('add')
    setMemberError(null)

    try {
      await projectService.addMember(projectId, {
        email: memberLookup.email,
        role: selectedRole,
      })
      await refreshProject()
      setMemberEmailQuery('')
      setMemberLookup(null)
      setSelectedRole('viewer')
    } catch {
      setMemberError('Não foi possível adicionar o membro ao projeto.')
    } finally {
      setMemberMutationLoading(null)
    }
  }

  async function handleUpdateMemberRole(memberId: string, role: Exclude<ProjectMemberRole, 'admin'>) {
    if (!projectId || !canManageMembers) return

    setMemberMutationLoading(memberId)
    setMemberError(null)

    try {
      await projectService.updateMember(projectId, memberId, { role })
      await refreshProject()
    } catch {
      setMemberError('Não foi possível atualizar o papel deste membro.')
    } finally {
      setMemberMutationLoading(null)
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!projectId || !canManageMembers) return

    setMemberMutationLoading(memberId)
    setMemberError(null)

    try {
      await projectService.removeMember(projectId, memberId)
      await refreshProject()
    } catch {
      setMemberError('Não foi possível remover este membro do projeto.')
    } finally {
      setMemberMutationLoading(null)
    }
  }

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
      <AboutPageState
        title="Projeto não encontrado"
        description="O projeto solicitado não foi localizado ou não pertence ao seu usuário."
        actionLabel="Voltar para projetos"
        onAction={() => navigate('/projects')}
      />
    )
  }

  if (!project || !form || !displayProfile) {
    return (
      <AboutPageState
        title="Não foi possível exibir o projeto"
        description={error ?? 'Os dados do projeto não puderam ser carregados no momento.'}
        actionLabel="Voltar para projetos"
        onAction={() => navigate('/projects')}
      />
    )
  }

  const accentColor = project.color ?? '#6366F1'
  const members = project.members ?? []

  return (
    <div className="relative min-h-full overflow-hidden bg-surface-base px-4 pb-16 pt-4 sm:px-6 sm:pt-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.14),transparent_58%)]" />
      <div className="pointer-events-none absolute right-[-80px] top-20 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.12),transparent_70%)] blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl">
        <div
          className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(19,22,30,0.94),rgba(13,15,20,0.94))] shadow-[0_28px_90px_rgba(0,0,0,0.34)] backdrop-blur-xl"
          style={{ boxShadow: `0 28px 90px rgba(0,0,0,0.34), 0 0 0 1px ${accentColor}14 inset` }}
        >
          <AboutHero
            project={project}
            displayProfile={displayProfile}
            accentColor={accentColor}
            editing={editing}
            saving={saving}
            canSave={Boolean(form.name.trim())}
            canEditProject={canEditProject}
            canDeleteProject={canDeleteProject}
            error={error}
            onCancel={handleCancel}
            onSave={handleSave}
            onEdit={() => handleStartEditing()}
            onDelete={() => setDeleteModalOpen(true)}
          />

          {editing ? (
            <AboutEditContent form={form} onFieldChange={updateField} />
          ) : (
            <>
              <AboutReadContent
                displayProfile={displayProfile}
                links={links}
                members={members}
                expandedFields={expandedFields}
                onToggleExpandField={handleExpand}
                onOpenCardModal={handleOpenCardModal}
                onStartEditing={(sectionId) => handleStartEditing(sectionId)}
                canEditProject={canEditProject}
                canManageMembers={canManageMembers}
                currentUserId={currentUser?.id ?? null}
                memberEmailQuery={memberEmailQuery}
                selectedRole={selectedRole}
                memberLookup={memberLookup}
                memberSearchLoading={memberSearchLoading}
                memberMutationLoading={memberMutationLoading}
                memberError={memberError}
                onMemberEmailChange={(value) => {
                  setMemberEmailQuery(value)
                  setMemberLookup(null)
                  setMemberError(null)
                }}
                onRoleChange={setSelectedRole}
                onSearchMember={() => {
                  void handleSearchMember()
                }}
                onAddMember={() => {
                  void handleAddMember()
                }}
                onUpdateMemberRole={(memberId, role) => {
                  void handleUpdateMemberRole(memberId, role)
                }}
                onRemoveMember={(memberId) => {
                  void handleRemoveMember(memberId)
                }}
              />
              <div className="border-t border-white/6 px-5 py-5 sm:px-7">
                  <ProjectAttachments
                  projectId={project.id}
                  attachments={attachments}
                  canManage={canEditProject}
                  onNewAttachment={(a) => setAttachments((prev) => [...prev, a])}
                  onDeleteAttachment={(id) => setAttachments((prev) => prev.filter((a) => a.id !== id))}
                />
              </div>
            </>
          )}
        </div>
      </div>

      <ExpandedCardModal expandedCard={expandedCard} onClose={() => setExpandedCard(null)} />
      <DeleteProjectModal
        open={deleteModalOpen}
        deleting={deleting}
        project={project}
        onClose={() => {
          if (!deleting) setDeleteModalOpen(false)
        }}
        onConfirm={handleDeleteProject}
      />
    </div>
  )
}
