import StackBadge from '@/components/ui/StackBadge'
import { avatarColor, formatMemberRole, initials } from '@/lib/sobre'
import type { ProjectMemberDTO, ProjectMemberRole, UserLookupDTO } from '@/data/dtos'
import type { DisplayProfile, LinkItem, LinkType } from '@/types/sobre'
import ClampedText from './ClampedText'
import DashboardSection from './DashboardSection'
import EmptyCta from './EmptyCta'
import ExpandableInfoCard from './ExpandableInfoCard'
import LinkRow from './LinkRow'
import { LinkTypeIcon } from './icons'

const LINK_ICON_MAP: Record<string, LinkType> = {
  'Repositório': 'github',
  'Documentação': 'book',
  'Figma': 'figma',
  'Quadro do projeto': 'grid',
  'Base da API': 'terminal',
  'Ambiente publicado': 'globe',
}

export default function AboutReadContent({
  displayProfile,
  links,
  members,
  expandedFields,
  onToggleExpandField,
  onOpenCardModal,
  onStartEditing,
  canEditProject,
  canManageMembers,
  currentUserId,
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
  links: LinkItem[]
  members: ProjectMemberDTO[]
  expandedFields: Record<string, boolean>
  onToggleExpandField: (label: string, value: string) => void
  onOpenCardModal: (label: string, value: string) => void
  onStartEditing: (sectionId?: string) => void
  canEditProject: boolean
  canManageMembers: boolean
  currentUserId: string | null
  memberEmailQuery: string
  selectedRole: Exclude<ProjectMemberRole, 'admin'>
  memberLookup: UserLookupDTO | null
  memberSearchLoading: boolean
  memberMutationLoading: string | null
  memberError: string | null
  onMemberEmailChange: (value: string) => void
  onRoleChange: (role: Exclude<ProjectMemberRole, 'admin'>) => void
  onSearchMember: () => void
  onAddMember: () => void
  onUpdateMemberRole: (memberId: string, role: Exclude<ProjectMemberRole, 'admin'>) => void
  onRemoveMember: (memberId: string) => void
}) {
  const roleOptions: Exclude<ProjectMemberRole, 'admin'>[] = ['editor', 'viewer']

  function EditBadge({ sectionId }: { sectionId: string }) {
    if (!canEditProject) return null
    return (
      <button
        type="button"
        onClick={() => onStartEditing(sectionId)}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium text-white/28 transition-[color,background-color] duration-150 hover:bg-white/5 hover:text-white/58"
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        Editar
      </button>
    )
  }

  const overviewEmpty =
    !displayProfile.summary.value &&
    !displayProfile.scope.value &&
    !displayProfile.goal.value &&
    !displayProfile.productContext.value &&
    !displayProfile.teamContext.value

  return (
    <div className="px-5 py-5 sm:px-7 sm:py-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left column */}
        <div className="flex min-w-0 flex-col gap-5">

          {/* Resumo do projeto */}
          <DashboardSection id="read-overview" title="Resumo do projeto" subtitle="Visão editorial com contexto, objetivo e escopo em um formato mais direto." badge={<EditBadge sectionId="edit-context" />}>
            <div>
              {/* Resumo */}
              <div className="pb-5">
                <p className="mb-2 text-[10px] font-semibold tracking-[0.18em] text-white/28 uppercase">Resumo</p>
                {displayProfile.summary.value ? (
                  <h2 className="text-2xl font-semibold tracking-tight text-white/94">
                    {displayProfile.summary.value}
                  </h2>
                ) : (
                  <p className="text-sm italic text-white/22">Não preenchido</p>
                )}
              </div>

              <div className="border-t border-white/6" />

              {/* Escopo */}
              <div className="py-5">
                <p className="mb-2 text-[10px] font-semibold tracking-[0.18em] text-white/28 uppercase">Escopo</p>
                {displayProfile.scope.value ? (
                  <ClampedText
                    value={displayProfile.scope.value}
                    label="Escopo"
                    onExpand={onToggleExpandField}
                    expanded={Boolean(expandedFields.Escopo)}
                    rows={3}
                  />
                ) : (
                  <p className="text-sm italic text-white/22">Não preenchido</p>
                )}
              </div>

              <div className="border-t border-white/6" />

              {/* Objetivo principal */}
              <div className="py-5">
                <p className="mb-2 text-[10px] font-semibold tracking-[0.18em] text-white/28 uppercase">Objetivo principal</p>
                {displayProfile.goal.value ? (
                  <div className="relative overflow-hidden rounded-[18px] border border-accent-indigo/24 bg-[linear-gradient(180deg,rgba(10,12,16,0.92),rgba(13,15,20,0.92))] px-5 py-5 shadow-[inset_3px_0_0_0_rgba(99,102,241,0.92)]">
                    <p className="text-base leading-8 text-white/82">{displayProfile.goal.value}</p>
                  </div>
                ) : (
                  <p className="text-sm italic text-white/22">Não preenchido</p>
                )}
              </div>

              <div className="border-t border-white/6" />

              {/* Contexto do produto e do time */}
              <div className="pt-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <ExpandableInfoCard
                    title="Contexto do produto"
                    value={displayProfile.productContext.value}
                    onExpand={onOpenCardModal}
                    accent="sky"
                  />
                  <ExpandableInfoCard
                    title="Contexto do time"
                    value={displayProfile.teamContext.value}
                    onExpand={onOpenCardModal}
                    accent="emerald"
                  />
                </div>
                {canEditProject && overviewEmpty && (
                  <div className="mt-4">
                    <EmptyCta label="Adicionar contexto e objetivo" onClick={onStartEditing} />
                  </div>
                )}
              </div>
            </div>
          </DashboardSection>

          {/* Arquitetura do sistema */}
          <DashboardSection id="read-architecture" title="Arquitetura do sistema" subtitle="Blocos técnicos organizados por área para leitura rápida do desenho da solução." badge={<EditBadge sectionId="edit-architecture" />}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {displayProfile.architectureSections.map((card) => (
                <ExpandableInfoCard
                  key={card.title}
                  title={card.title}
                  value={card.description}
                  onExpand={onOpenCardModal}
                  accent={card.accent}
                />
              ))}
            </div>
            {canEditProject && displayProfile.architectureSections.every((c) => !c.description.trim()) && (
              <div className="mt-4">
                <EmptyCta label="Adicionar arquitetura do sistema" onClick={onStartEditing} />
              </div>
            )}
          </DashboardSection>

          {/* Decisões técnicas e regras */}
          <DashboardSection id="read-rules" title="Decisões técnicas e regras do projeto" subtitle="Regras do domínio, permissões e restrições apresentadas em cartões escaneáveis." badge={<EditBadge sectionId="edit-rules" />}>
            <div className="grid gap-4 md:grid-cols-2">
              {displayProfile.businessRuleSections.map((card) => (
                <ExpandableInfoCard
                  key={card.title}
                  title={card.title}
                  value={card.description}
                  onExpand={onOpenCardModal}
                  accent={card.accent}
                />
              ))}
            </div>
            {canEditProject && displayProfile.businessRuleSections.every((c) => !c.description.trim()) && (
              <div className="mt-4">
                <EmptyCta label="Adicionar regras de negócio" onClick={onStartEditing} />
              </div>
            )}
          </DashboardSection>
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-5">

          {/* Stack principal */}
          <DashboardSection id="read-stack" title="Stack principal" subtitle="Tecnologias organizadas por categoria para leitura e filtros futuros." badge={<EditBadge sectionId="edit-stack" />}>
            <div className="space-y-3.5">
              {displayProfile.stackGroups.map((group) => (
                <div key={group.key} className="rounded-2xl border border-white/7 bg-surface-base/58 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold tracking-[0.18em] text-white/74 uppercase">{group.title}</p>
                      <p className="mt-1 text-xs text-white/34">{group.description}</p>
                    </div>
                    <span className="rounded-full border border-white/8 bg-white/4 px-2.5 py-1 text-[10px] font-semibold text-white/52">
                      {group.items.length}
                    </span>
                  </div>
                  <div className="mt-3">
                    {group.items.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {group.items.map((item) => (
                          <StackBadge key={`${group.key}-${item}`} value={item} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs italic text-white/22">Nenhuma tecnologia adicionada</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {canEditProject && displayProfile.stackGroups.every((g) => g.items.length === 0) && (
              <div className="mt-4">
                <EmptyCta label="Adicionar stack por categoria" onClick={onStartEditing} />
              </div>
            )}
          </DashboardSection>

          {/* Links úteis */}
          <DashboardSection id="read-links" title="Links úteis" subtitle="Atalhos importantes para navegação rápida entre artefatos." badge={<EditBadge sectionId="edit-links" />}>
            <div className="flex flex-col gap-2">
              {links.map((link) =>
                link.url ? (
                  <LinkRow key={link.label} label={link.label} url={link.url} />
                ) : (
                  <div
                    key={link.label}
                    className="flex items-center gap-3 rounded-2xl border border-white/5 bg-surface-base/40 px-4 py-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-card border border-white/6 bg-surface-base/58 text-white/16">
                      <LinkTypeIcon type={LINK_ICON_MAP[link.label] ?? 'globe'} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white/30">{link.label}</p>
                      <p className="mt-0.5 text-[11px] italic text-white/22">Não preenchido</p>
                    </div>
                  </div>
                )
              )}
            </div>
          </DashboardSection>

          {/* Equipe do projeto */}
          <DashboardSection id="read-team" title="Equipe do projeto" subtitle="Pessoas envolvidas no contexto e na operação deste projeto.">
            {canManageMembers && (
              <div className="mb-3 space-y-3 rounded-[14px] border border-accent-indigo/14 bg-accent-indigo/5 p-3.5">
                <p className="text-[10px] font-semibold tracking-[0.18em] text-accent-indigo/70 uppercase">Adicionar membro</p>

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

                <div className="grid grid-cols-2 gap-0.5 rounded-lg border border-white/8 bg-surface-base/60 p-0.5">
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
                      {formatMemberRole(role)}
                    </button>
                  ))}
                </div>

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
                Apenas administradores podem adicionar, remover ou alterar o papel dos membros.
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
                        <div className="relative">
                          <select
                            value={member.role}
                            onChange={(e) => onUpdateMemberRole(member.id, e.target.value as Exclude<ProjectMemberRole, 'admin'>)}
                            disabled={memberMutationLoading === member.id || member.user_id === currentUserId || member.role === 'admin'}
                            className="appearance-none rounded-lg border border-white/10 bg-surface-base py-1.5 pl-2 pr-6 text-[10px] font-medium text-white/60 outline-none transition-opacity disabled:opacity-45"
                          >
                            <option value="editor">Editor</option>
                            <option value="viewer">Visualizador</option>
                            {member.role === 'admin' && <option value="admin">Administrador</option>}
                          </select>
                          <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-white/28">
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                              <path d="M1 2.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onRemoveMember(member.id)}
                          disabled={memberMutationLoading === member.id || member.user_id === currentUserId}
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
                        {formatMemberRole(member.role)}
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
