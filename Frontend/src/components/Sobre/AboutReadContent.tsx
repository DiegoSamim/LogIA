import StackBadge from '@/components/ui/StackBadge'
import { EXPAND_THRESHOLD, avatarColor, initials } from '@/lib/sobre'
import type { ProjectMemberDTO } from '@/data/dtos'
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
}: {
  displayProfile: DisplayProfile
  architectureCards: ArchitectureCardModel[]
  links: LinkItem[]
  members: ProjectMemberDTO[]
  expandedFields: Record<string, boolean>
  onToggleExpandField: (label: string, value: string) => void
  onOpenCardModal: (label: string, value: string) => void
  onStartEditing: () => void
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
              <EmptyCta label="Adicionar contexto e objetivo" onClick={onStartEditing} />
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
              <EmptyCta label="Adicionar arquitetura e regras" onClick={onStartEditing} />
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
              <EmptyCta label="Adicionar stack" onClick={onStartEditing} />
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
              <EmptyCta label="Adicionar links" onClick={onStartEditing} />
            )}
          </DashboardSection>

          <DashboardSection title="Time de Desenvolvimento" subtitle="Pessoas diretamente envolvidas no contexto deste projeto.">
            {members.length > 0 ? (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 rounded-2xl border border-white/7 bg-surface-high/50 px-3.5 py-3"
                  >
                    <div
                      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: avatarColor(member.user_id) }}
                    >
                      {initials(member.user.name)}
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-surface-container bg-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white/90">{member.user.name}</p>
                      <p className="truncate text-xs text-white/38">
                        {member.role === 'owner' ? 'Lead do projeto' : 'Membro do time'}
                      </p>
                    </div>
                    <span
                      className={
                        member.role === 'owner'
                          ? 'shrink-0 rounded-full border border-accent-indigo/24 bg-accent-indigo/10 px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-accent-indigo/80 uppercase'
                          : 'shrink-0 rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-medium tracking-[0.12em] text-white/34 uppercase'
                      }
                    >
                      {member.role}
                    </span>
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
