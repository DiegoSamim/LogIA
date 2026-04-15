import type { ProjectMemberDTO } from '@/data/dtos'
import { avatarColor, formatStatus, initials } from '@/lib/sobre'
import type { DisplayProfile, ProjectDetail } from '@/types/sobre'

export default function AboutHero({
  project,
  displayProfile,
  members,
  accentColor,
  editing,
  saving,
  canSave,
  canEditProject,
  error,
  onCancel,
  onSave,
  onEdit,
  onDelete,
}: {
  project: ProjectDetail
  displayProfile: DisplayProfile
  members: ProjectMemberDTO[]
  accentColor: string
  editing: boolean
  saving: boolean
  canSave: boolean
  canEditProject: boolean
  error: string | null
  onCancel: () => void
  onSave: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="border-b border-white/6 px-5 py-6 sm:px-7">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-[0.28em] text-accent-violet/84 uppercase">
            Detalhes do projeto
          </p>

          <div className="mt-3 flex items-center gap-2">
            <span
              className="rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.16em] uppercase"
              style={{ borderColor: `${accentColor}44`, color: accentColor, backgroundColor: `${accentColor}14` }}
            >
              {formatStatus(project.status)}
            </span>
          </div>

          <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight text-white/96 sm:text-4xl">
            {project.name}
          </h1>
          <p className="mt-4 max-w-4xl text-base leading-8 text-white/56">{displayProfile.description.value}</p>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/30">
            {project.task_count > 0 && (
              <span>{project.done_count}/{project.task_count} tarefas concluídas</span>
            )}
            <span>
              Criado em {new Date(project.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            {project.last_session_at && (
              <span>· Última sessão {new Date(project.last_session_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-3 xl:w-[260px]">
          {members.length > 0 && (
            <div className="flex -space-x-2 xl:justify-start">
              {members.slice(0, 5).map((member) => (
                <div
                  key={member.id}
                  title={`${member.user.name} — ${member.role}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-surface-container text-[11px] font-bold text-white shadow-[0_8px_20px_rgba(0,0,0,0.25)]"
                  style={{ backgroundColor: avatarColor(member.user_id) }}
                >
                  {initials(member.user.name)}
                </div>
              ))}
              {members.length > 5 && (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-surface-container bg-surface-high text-[11px] font-semibold text-white/50">
                  +{members.length - 5}
                </div>
              )}
            </div>
          )}

          {displayProfile.summary.value && (
            <div className="rounded-[18px] border border-white/7 bg-surface-base/70 p-4">
              <p className="text-[10px] font-semibold tracking-[0.18em] text-white/28 uppercase">Resumo</p>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/82">{displayProfile.summary.value}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={saving}
                  className="flex-1 rounded-btn border border-white/10 bg-surface-high px-4 py-2.5 text-xs font-medium text-white/52 transition-[border-color,color] duration-150 hover:border-white/18 hover:text-white/76 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving || !canSave}
                  className="flex-1 rounded-btn bg-linear-to-r from-accent-indigo to-accent-violet px-4 py-2.5 text-xs font-semibold tracking-[0.16em] text-white uppercase transition-[filter,transform,opacity] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </>
            ) : canEditProject ? (
              <>
                <button
                  type="button"
                  onClick={onDelete}
                  className="flex-1 rounded-btn border border-red-500/16 bg-red-500/8 px-4 py-2.5 text-xs font-semibold tracking-[0.16em] text-red-300 uppercase transition-[border-color,background-color,color] duration-150 hover:border-red-500/28 hover:bg-red-500/12 hover:text-red-200"
                >
                  Excluir
                </button>
                <button
                  type="button"
                  onClick={onEdit}
                  className="flex-1 rounded-btn bg-linear-to-r from-accent-indigo to-accent-violet px-4 py-2.5 text-xs font-semibold tracking-[0.16em] text-white uppercase transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98]"
                >
                  Editar
                </button>
              </>
            ) : (
              <div className="w-full rounded-[18px] border border-white/7 bg-surface-base/70 px-4 py-3 text-xs text-white/42">
                Apenas o criador do projeto pode editar os dados gerais. Admins adicionais podem gerenciar membros abaixo.
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-5 rounded-[14px] border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  )
}
