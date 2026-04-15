import StackBadge from '@/components/ui/StackBadge'
import { EXPAND_THRESHOLD, avatarColor, formatMemberRole, initials } from '@/lib/sobre'
import type { ProjectMemberDTO, ProjectMemberRole, UserLookupDTO } from '@/data/dtos'
import type { ArchitectureCardModel, DisplayProfile, LinkItem } from '@/types/sobre'
import { ArchitectureIcon } from './icons'
import CardExpandButton from './CardExpandButton'
import CardFade from './CardFade'
import ClampedText from './ClampedText'
import DashboardSection from './DashboardSection'
import EmptyCta from './EmptyCta'
import ExpandableInfoCard from './ExpandableInfoCard'
import LinkRow from './LinkRow'

export default function AboutReadContent({
  displayProfile,
  architectureCards,
  links,
  members,
  expandedFields,
  onToggleExpandField,
  onOpenCardModal,
  onStartEditing,
  canEditProject,
  canManageMembers,
  memberEmailQuery,
  selectedRole,
  memberLookup,
  memberSearchLoading,
  memberMutationLoading,
  memberError,
  onMemberEmailChange,
  onRoleChange,
  onSearchMember,
  onAddMember,
  onUpdateMemberRole,
  onRemoveMember,
}: {
  displayProfile: DisplayProfile
  architectureCards: ArchitectureCardModel[]
  links: LinkItem[]
  members: ProjectMemberDTO[]
  expandedFields: Record<string, boolean>
  onToggleExpandField: (label: string, value: string) => void
  onOpenCardModal: (label: string, value: string) => void
  onStartEditing: () => void
  canEditProject: boolean
  canManageMembers: boolean
  memberEmailQuery: string
  selectedRole: ProjectMemberRole
  memberLookup: UserLookupDTO | null
  memberSearchLoading: boolean
  memberMutationLoading: string | null
  memberError: string | null
  onMemberEmailChange: (value: string) => void
  onRoleChange: (role: ProjectMemberRole) => void
  onSearchMember: () => void
  onAddMember: () => void
  onUpdateMemberRole: (memberId: string, role: ProjectMemberRole) => void
  onRemoveMember: (memberId: string) => void
}) {
  const hasOverview = Boolean(displayProfile.summary.value || displayProfile.goal.value || displayProfile.scope.value)
  const hasArchitecture = Boolean(
    displayProfile.architectureSummary.value ||
      displayProfile.productContext.value ||
      displayProfile.businessRules.value ||
      displayProfile.teamContext.value,
  )
  const hasLinks = links.length > 0
  const hasStack = displayProfile.mainStack.value.length > 0
  const roleOptions: ProjectMemberRole[] = ['admin', 'editor', 'viewer']

  function renderLockedEmptyState(label: string) {
    if (canEditProject) return <EmptyCta label={label} onClick={onStartEditing} />
    return <p className="text-xs leading-6 text-white/34">Somente o criador do projeto pode preencher esta seção.</p>
  }

  return (
    <div className="px-5 py-5 sm:px-7 sm:py-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-5">
          <DashboardSection title="Resumo do Projeto" subtitle="Visão editorial do projeto com foco em contexto, objetivo e escopo.">
            {hasOverview ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-white/94">{displayProfile.summary.value}</h2>
                  {displayProfile.scope.value && (
                    <ClampedText
                      value={displayProfile.scope.value}
                      label="Escopo"
                      onExpand={onToggleExpandField}
                      expanded={Boolean(expandedFields.Escopo)}
                      rows={3}
                    />
                  )}
                </div>

                {displayProfile.goal.value && (
                  <div className="relative max-h-44 overflow-hidden rounded-[18px] border border-accent-indigo/24 bg-[linear-gradient(180deg,rgba(10,12,16,0.92),rgba(13,15,20,0.92))] px-5 py-5 shadow-[inset_3px_0_0_0_rgba(99,102,241,0.92)]">
                    <p className="text-[11px] font-semibold tracking-[0.22em] text-white/68 uppercase">Objetivo principal</p>
                    <p className="mt-4 text-base leading-8 text-white/82">{displayProfile.goal.value}</p>
                    {displayProfile.goal.value.length > EXPAND_THRESHOLD && (
                      <>
                        <CardFade />
                        <CardExpandButton onClick={() => onOpenCardModal('Objetivo principal', displayProfile.goal.value)} />
                      </>
                    )}
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  {displayProfile.productContext.value && (
                    <ExpandableInfoCard
                      title="Contexto do produto"
                      value={displayProfile.productContext.value}
                      onExpand={onOpenCardModal}
                    />
                  )}
                  {displayProfile.teamContext.value && (
                    <ExpandableInfoCard
                      title="Contexto do time"
                      value={displayProfile.teamContext.value}
                      onExpand={onOpenCardModal}
                    />
                  )}
                </div>
              </div>
            ) : (
              renderLockedEmptyState('Adicionar contexto e objetivo')
            )}
          </DashboardSection>

          <DashboardSection title="Arquitetura do sistema" subtitle="Blocos conceituais para comunicar a estrutura técnica do projeto.">
            {hasArchitecture ? (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
                {architectureCards.map((card) => (
                  <article
                    key={card.title}
                    className="relative max-h-56 overflow-hidden rounded-[18px] border border-white/7 bg-[linear-gradient(180deg,rgba(10,12,16,0.88),rgba(18,20,28,0.74))] p-5 transition-[border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-accent-indigo/18"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-accent-indigo/18 bg-accent-indigo/10 text-accent-indigo/76">
                      <ArchitectureIcon kind={card.icon} />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-white/92">{card.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-white/52">{card.description}</p>
                    {card.description.length > EXPAND_THRESHOLD && (
                      <>
                        <CardFade />
                        <CardExpandButton onClick={() => onOpenCardModal(card.title, card.description)} />
                      </>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              renderLockedEmptyState('Adicionar arquitetura e regras')
            )}
          </DashboardSection>

          {(displayProfile.architectureSummary.value || displayProfile.businessRules.value) && (
            <DashboardSection title="Operational Notes" subtitle="Campos centrais do projeto organizados para consulta rápida.">
              <div className="grid gap-4 md:grid-cols-2">
                {displayProfile.architectureSummary.value && (
                  <ExpandableInfoCard
                    title="Resumo da arquitetura"
                    value={displayProfile.architectureSummary.value}
                    onExpand={onOpenCardModal}
                  />
                )}
                {displayProfile.businessRules.value && (
                  <ExpandableInfoCard
                    title="Regras de negócio"
                    value={displayProfile.businessRules.value}
                    onExpand={onOpenCardModal}
                  />
                )}
              </div>
            </DashboardSection>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <DashboardSection title="Stack Principal">
            {hasStack ? (
              <div className="flex flex-wrap gap-2.5">
                {displayProfile.mainStack.value.map((item) => (
                  <StackBadge key={item} value={item} />
                ))}
              </div>
            ) : (
              renderLockedEmptyState('Adicionar stack')
            )}
          </DashboardSection>

          <DashboardSection title="Links úteis" subtitle="Atalhos importantes para navegação rápida entre artefatos.">
            {hasLinks ? (
              <div className="flex flex-col gap-3">
                {links.map((link) => (
                  <LinkRow key={link.label} {...link} />
                ))}
              </div>
            ) : (
              renderLockedEmptyState('Adicionar links')
            )}
          </DashboardSection>

          <DashboardSection title="Time de Desenvolvimento" subtitle="Pessoas diretamente envolvidas no contexto deste projeto.">
            {canManageMembers && (
              <div className="mb-3 space-y-3 rounded-[14px] border border-accent-indigo/14 bg-accent-indigo/5 p-3.5">
                <p className="text-[10px] font-semibold tracking-[0.18em] text-accent-indigo/70 uppercase">Adicionar membro</p>

                {/* Email input with inline search button */}
                <div className="relative">
                  <input
                    type="email"
                    value={memberEmailQuery}
                    onChange={(e) => onMemberEmailChange(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') onSearchMember() }}
                    placeholder="email@exemplo.com"
                    className="w-full rounded-card border border-white/8 bg-surface-base/80 py-2.5 pl-3.5 pr-17 text-sm text-white/84 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-white/22 focus:border-accent-indigo/34 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.10)]"
                  />
                  <button
                    type="button"
                    onClick={onSearchMember}
                    disabled={!memberEmailQuery.trim() || memberSearchLoading}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg border border-white/10 bg-surface-high px-3 py-1.5 text-[10px] font-semibold tracking-[0.12em] text-white/56 uppercase transition-[border-color,color,opacity] duration-150 hover:border-white/18 hover:text-white/80 disabled:opacity-40"
                  >
                    {memberSearchLoading ? '...' : 'Buscar'}
                  </button>
                </div>

                {/* Role segmented control */}
                <div className="grid grid-cols-3 gap-0.5 rounded-lg border border-white/8 bg-surface-base/60 p-0.5">
                  {roleOptions.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => onRoleChange(role)}
                      className={[
                        'rounded-[6px] py-1.5 text-[10px] font-semibold tracking-widest uppercase transition-[background-color,color] duration-150',
                        selectedRole === role
                          ? 'bg-accent-indigo/18 text-accent-indigo/86 shadow-[0_1px_4px_rgba(0,0,0,0.22)]'
                          : 'text-white/32 hover:text-white/60',
                      ].join(' ')}
                    >
                      {role === 'admin' ? 'Admin' : role === 'editor' ? 'Editor' : 'Viewer'}
                    </button>
                  ))}
                </div>

                {/* User lookup result */}
                {memberLookup && (
                  <div className="flex items-center gap-2.5 rounded-card border border-white/8 bg-surface-base/74 px-3 py-2.5">
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ backgroundColor: avatarColor(memberLookup.id) }}
                    >
                      {initials(memberLookup.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-white/88">{memberLookup.name}</p>
                      <p className="truncate text-[10px] text-white/40">{memberLookup.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={onAddMember}
                      disabled={memberMutationLoading === 'add'}
                      className="shrink-0 rounded-lg bg-linear-to-r from-accent-indigo to-accent-violet px-3 py-1.5 text-[10px] font-semibold tracking-[0.14em] text-white uppercase transition-[filter,transform,opacity] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-45"
                    >
                      {memberMutationLoading === 'add' ? '...' : 'Adicionar'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {!canManageMembers && (
              <div className="mb-3 rounded-card border border-white/7 bg-surface-base/60 px-3.5 py-2.5 text-xs leading-5 text-white/40">
                Apenas admins podem adicionar, remover ou alterar o papel dos membros.
              </div>
            )}

            {memberError && (
              <p className="mb-3 rounded-card border border-rose-400/18 bg-rose-400/8 px-3 py-2.5 text-xs text-rose-100/80">
                {memberError}
              </p>
            )}

            {members.length > 0 ? (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2.5 rounded-xl border border-white/7 bg-surface-high/40 px-3 py-2.5"
                  >
                    <div
                      className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ backgroundColor: avatarColor(member.user_id) }}
                    >
                      {initials(member.user.name)}
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-surface-container bg-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-white/88">{member.user.name}</p>
                      <p className="truncate text-[10px] text-white/36">{member.user.email}</p>
                    </div>
                    {canManageMembers ? (
                      <div className="flex shrink-0 items-center gap-1.5">
                        <select
                          value={member.role}
                          onChange={(e) => onUpdateMemberRole(member.id, e.target.value as ProjectMemberRole)}
                          disabled={memberMutationLoading === member.id}
                          className="rounded-lg border border-white/10 bg-surface-base/70 px-2 py-1.5 text-[10px] font-medium text-white/60 outline-none transition-opacity disabled:opacity-45"
                        >
                          <option value="admin">Admin</option>
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => onRemoveMember(member.id)}
                          disabled={memberMutationLoading === member.id}
                          aria-label={`Remover ${member.user.name}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-400/16 bg-red-400/8 text-red-200/64 transition-[border-color,color,opacity] duration-150 hover:border-red-400/30 hover:text-red-200/90 disabled:opacity-40"
                        >
                          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                            <path d="M1 1l7 7M8 1L1 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <span
                        className={[
                          'shrink-0 rounded-[6px] border px-2 py-1 text-[10px] font-semibold tracking-widest uppercase',
                          member.role === 'admin'
                            ? 'border-accent-indigo/22 bg-accent-indigo/10 text-accent-indigo/78'
                            : 'border-white/8 text-white/32',
                        ].join(' ')}
                      >
                        {member.role === 'admin' ? 'Admin' : member.role === 'editor' ? 'Editor' : 'Viewer'}
                      </span>
                    )}
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
  )
}
