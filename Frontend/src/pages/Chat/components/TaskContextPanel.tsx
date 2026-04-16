import type { TaskDTO } from '@/data/dtos'
import type { TaskRegisterDraft, TaskRegisterProgressItem, TaskLookup, TaskUpdatePreview } from '@/pages/Chat/types'
import { STATUS_CHIP_OPTIONS } from '@/pages/Chat/constants'
import { getSelectedTask, getUpdateTypeLabel } from '@/pages/Chat/utils'

function StatusChip({ status }: { status: string }) {
  const option = STATUS_CHIP_OPTIONS.find((o) => o.value === status)
  const colorClass = option?.colorClass ?? 'text-white/40 bg-white/6 border-white/10'
  return (
    <span className={`inline-flex items-center rounded-[5px] border px-1.5 py-0.5 text-[10px] font-medium ${colorClass}`}>
      {option?.label ?? status}
    </span>
  )
}

export default function TaskContextPanel({
  draft,
  tasks,
  projectName,
  progress,
  updates = [],
}: {
  draft: TaskRegisterDraft
  tasks: TaskLookup[] | TaskDTO[]
  projectName: string | null
  progress: TaskRegisterProgressItem[]
  updates?: TaskUpdatePreview[]
}) {
  const selectedTask = getSelectedTask(tasks as TaskLookup[], draft.taskId)

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Projeto</p>
        <p className="mt-1 text-xs text-white/76">{projectName ?? 'Sem projeto selecionado'}</p>
      </div>

      <div>
        <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Ação</p>
        <p className="mt-1 text-xs text-white/76">
          {draft.action === 'create' ? 'Criando nova tarefa' : draft.action === 'update' ? 'Atualizando tarefa existente' : 'Aguardando escolha'}
        </p>
      </div>

      {draft.action === 'create' && draft.title && (
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Título</p>
          <p className="mt-1 text-xs text-white/76">{draft.title}</p>
        </div>
      )}

      {draft.action === 'update' && selectedTask && (
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Tarefa selecionada</p>
          <p className="mt-1 text-xs text-white/76">{selectedTask.title}</p>
          <div className="mt-1.5">
            <StatusChip status={selectedTask.status} />
          </div>
        </div>
      )}

      {draft.status && draft.action === 'update' && (
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Novo status</p>
          <div className="mt-1.5">
            <StatusChip status={draft.status} />
          </div>
        </div>
      )}

      {draft.status && draft.action === 'create' && (
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Status</p>
          <div className="mt-1.5">
            <StatusChip status={draft.status} />
          </div>
        </div>
      )}

      {draft.task_summary && draft.action === 'create' && (
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Resumo da tarefa</p>
          <p className="mt-1 text-xs leading-5 text-white/60">{draft.task_summary}</p>
        </div>
      )}

      {draft.update_summary && draft.action === 'update' && (
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">O que foi alterado</p>
          <p className="mt-1 text-xs leading-5 text-white/60">{draft.update_summary}</p>
        </div>
      )}

      {draft.update_task_summary === 'yes' && draft.task_summary && draft.action === 'update' && (
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Resumo atualizado</p>
          <p className="mt-1 text-xs leading-5 text-white/60">{draft.task_summary}</p>
        </div>
      )}

      {draft.tags.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Tags</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {draft.tags.map((tag) => (
              <span key={tag} className="rounded-[5px] border border-accent-indigo/16 bg-accent-indigo/7 px-1.5 py-0.5 text-[10px] text-accent-indigo/72">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {!draft.action && !draft.title && !draft.task_summary && !draft.update_summary && (
        <p className="text-xs text-white/28 italic">As respostas aparecerão aqui conforme você preenche.</p>
      )}

      <div className="border-t border-white/6 pt-4">
        <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Progresso</p>
        <div className="mt-3 space-y-2">
          {progress.map((item) => (
            <div key={item.id} className="flex items-center gap-2.5">
              <span
                className={[
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold',
                  item.done
                    ? 'bg-accent-indigo/80 text-white'
                    : item.active
                    ? 'border border-accent-indigo/60 text-accent-indigo/80'
                    : 'border border-white/12 text-white/24',
                ].join(' ')}
              >
                {item.done ? '✓' : '•'}
              </span>
              <span className={['text-[11px]', item.active ? 'text-white/72' : item.done ? 'text-white/40' : 'text-white/22'].join(' ')}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {draft.action === 'update' && updates.length > 0 && (
        <div className="border-t border-white/6 pt-4">
          <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Últimos updates</p>
          <div className="mt-3 space-y-3">
            {updates.slice(0, 3).map((update) => (
              <div key={update.id} className="rounded-[8px] border border-white/6 bg-surface-base/64 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-medium text-white/68">{getUpdateTypeLabel(update.update_type)}</p>
                  <p className="text-[10px] text-white/34">
                    {new Intl.DateTimeFormat('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                    }).format(new Date(update.created_at))}
                  </p>
                </div>
                {update.summary && (
                  <p className="mt-2 line-clamp-3 text-[11px] leading-5 text-white/56">{update.summary}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
