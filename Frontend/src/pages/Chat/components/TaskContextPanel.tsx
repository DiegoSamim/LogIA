import type { TaskRegisterDraft, TaskRegisterProgressItem, TaskLookup } from '@/pages/Chat/types'
import { getSelectedTask, getTaskStatusLabel } from '@/pages/Chat/utils'

export default function TaskContextPanel({
  draft,
  tasks,
  projectName,
  progress,
}: {
  draft: TaskRegisterDraft
  tasks: TaskLookup[]
  projectName: string | null
  progress: TaskRegisterProgressItem[]
}) {
  const selectedTask = getSelectedTask(tasks, draft.taskId)

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

      {draft.action === 'create' && draft.taskTitle && (
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Título</p>
          <p className="mt-1 text-xs text-white/76">{draft.taskTitle}</p>
        </div>
      )}

      {draft.action === 'update' && selectedTask && (
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Tarefa selecionada</p>
          <p className="mt-1 text-xs text-white/76">{selectedTask.title}</p>
          <p className="mt-1 text-[11px] text-white/36">{getTaskStatusLabel(selectedTask.status)}</p>
        </div>
      )}

      {draft.currentStatus && (
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Status atual</p>
          <p className="mt-1 text-xs text-white/76">{getTaskStatusLabel(draft.currentStatus)}</p>
        </div>
      )}

      {draft.newStatus && (
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Novo status</p>
          <p className="mt-1 text-xs text-white/76">{getTaskStatusLabel(draft.newStatus)}</p>
        </div>
      )}

      {draft.summary && (
        <div>
          <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Resumo</p>
          <p className="mt-1 text-xs leading-5 text-white/60">{draft.summary}</p>
        </div>
      )}

      {!draft.action && !draft.taskTitle && !draft.summary && (
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
    </div>
  )
}
