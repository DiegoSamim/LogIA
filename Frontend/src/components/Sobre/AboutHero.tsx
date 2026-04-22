import { formatStatus } from '@/lib/sobre'
import type { DisplayProfile, ProjectDetail } from '@/types/sobre'

export default function AboutHero({
  project,
  displayProfile,
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
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-[0.28em] text-accent-violet/84 uppercase">
            Detalhes do projeto
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span
              className="rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.16em] uppercase"
              style={{ borderColor: `${accentColor}44`, color: accentColor, backgroundColor: `${accentColor}14` }}
            >
              {formatStatus(project.status)}
            </span>
            {displayProfile.defaultLanguage.value && (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium tracking-widest text-white/48">
                {displayProfile.defaultLanguage.value}
              </span>
            )}
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white/96 sm:text-4xl">
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

        <div className="flex shrink-0 justify-end">
          <div className="flex flex-wrap gap-2">
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={saving}
                  className="rounded-btn border border-white/10 bg-surface-high px-4 py-2.5 text-xs font-medium text-white/52 transition-[border-color,color] duration-150 hover:border-white/18 hover:text-white/76 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  disabled={saving || !canSave}
                  className="rounded-btn bg-linear-to-r from-accent-indigo to-accent-violet px-4 py-2.5 text-xs font-semibold tracking-[0.16em] text-white uppercase transition-[filter,transform,opacity] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </>
            ) : canEditProject ? (
              <>
                <button
                  type="button"
                  onClick={onDelete}
                  className="rounded-btn border border-red-500/16 bg-red-500/8 px-4 py-2.5 text-xs font-semibold tracking-[0.16em] text-red-300 uppercase transition-[border-color,background-color,color] duration-150 hover:border-red-500/28 hover:bg-red-500/12 hover:text-red-200"
                >
                  Excluir
                </button>
                <button
                  type="button"
                  onClick={onEdit}
                  className="rounded-btn bg-linear-to-r from-accent-indigo to-accent-violet px-4 py-2.5 text-xs font-semibold tracking-[0.16em] text-white uppercase transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98]"
                >
                  Editar
                </button>
              </>
            ) : (
              <div className="max-w-sm rounded-[18px] border border-white/7 bg-surface-base/70 px-4 py-3 text-xs text-white/42">
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
