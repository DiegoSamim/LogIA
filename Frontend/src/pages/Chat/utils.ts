import type { ChatMessageViewModel, ProjectDraft, ProjectQuestion, TaskLookup, TaskRegisterDraft, TaskRegisterProgressItem, TaskRegisterQuestion, TaskSummaryViewModel } from '@/pages/Chat/types'
import { CREATE_TASK_QUESTIONS, TASK_STATUS_OPTIONS, UPDATE_TASK_QUESTIONS } from '@/pages/Chat/constants'

export function getProjectDraftValue(draft: ProjectDraft, field: ProjectQuestion['field']): string {
  if (field === 'stack') return draft.stack.join(', ')
  return draft[field] ?? ''
}

export function getTaskQuestions(action: TaskRegisterDraft['action']): TaskRegisterQuestion[] {
  return action === 'create' ? CREATE_TASK_QUESTIONS : UPDATE_TASK_QUESTIONS
}

export function getTaskStatusLabel(status: string): string {
  return TASK_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status
}

export function getSelectedTask(tasks: TaskLookup[], taskId: string | null) {
  return tasks.find((task) => task.id === taskId) ?? null
}

export function buildInitialTaskRegisterMessages(projectName: string | null): ChatMessageViewModel[] {
  return [
    {
      id: 'task-register-0',
      sender: 'assistant',
      tone: 'standard',
      content: projectName
        ? `Vamos registrar uma tarefa no projeto ${projectName}. Você pode criar uma nova tarefa ou atualizar uma já existente.`
        : 'Vamos registrar uma tarefa. Você pode criar uma nova tarefa ou atualizar uma já existente.',
    },
  ]
}

export function buildActionSelectionMessage(): ChatMessageViewModel {
  return {
    id: `assistant-action-${Date.now()}`,
    sender: 'assistant',
    tone: 'standard',
    content: 'Como você quer seguir neste registro?',
  }
}

export function buildNextQuestionMessage(question: TaskRegisterQuestion, step: number): ChatMessageViewModel {
  return {
    id: `assistant-question-${step}-${question.field}`,
    sender: 'assistant',
    tone: 'standard',
    content: question.question,
  }
}

export function buildCreateTaskSummary(draft: TaskRegisterDraft): TaskSummaryViewModel {
  return {
    title: 'Título',
    statusLabel: getTaskStatusLabel(draft.newStatus ?? 'todo'),
    summaryLabel: 'Resumo',
    summaryValue: draft.summary,
    actionLabel: 'Criar nova tarefa',
    taskName: draft.taskTitle,
  }
}

export function buildUpdateTaskSummary(draft: TaskRegisterDraft, tasks: TaskLookup[]): TaskSummaryViewModel {
  const task = getSelectedTask(tasks, draft.taskId)
  return {
    title: 'Tarefa',
    statusLabel: getTaskStatusLabel(draft.newStatus ?? task?.status ?? 'todo'),
    summaryLabel: 'Resumo do update',
    summaryValue: draft.summary,
    actionLabel: 'Atualizar tarefa existente',
    taskName: task?.title ?? 'Tarefa selecionada',
  }
}

export function getTaskRegisterProgress({
  action,
  phase,
  draft,
}: {
  action: TaskRegisterDraft['action']
  phase: string
  draft: TaskRegisterDraft
}): TaskRegisterProgressItem[] {
  const items: TaskRegisterProgressItem[] = [
    {
      id: 'action',
      label: 'Escolha da ação',
      done: Boolean(action),
      active: phase === 'choose-action',
    },
  ]

  if (action === 'update') {
    items.push({
      id: 'task',
      label: 'Seleção da tarefa',
      done: Boolean(draft.taskId),
      active: phase === 'pick-task',
    })
  }

  const questions = getTaskQuestions(action)
  items.push(
    ...questions.map((question, index) => {
      const done =
        question.field === 'taskTitle'
          ? Boolean(draft.taskTitle)
          : question.field === 'summary'
          ? Boolean(draft.summary)
          : Boolean(draft.newStatus)
      return {
        id: question.field,
        label:
          question.field === 'taskTitle'
            ? 'Título'
            : question.field === 'summary'
            ? 'Resumo'
            : 'Status',
        done,
        active: phase === 'questions' && !done && questions.slice(0, index).every((item) => {
          if (item.field === 'taskTitle') return Boolean(draft.taskTitle)
          if (item.field === 'summary') return Boolean(draft.summary)
          return Boolean(draft.newStatus)
        }),
      }
    }),
  )

  items.push({
    id: 'summary',
    label: 'Confirmação final',
    done: phase === 'done',
    active: phase === 'summary' || phase === 'saving',
  })

  return items
}

export function getTaskFieldValue(draft: TaskRegisterDraft, field: TaskRegisterQuestion['field']): string {
  if (field === 'taskTitle') return draft.taskTitle
  if (field === 'summary') return draft.summary
  return draft.newStatus ?? ''
}

export function buildTaskSuccessMessage(action: TaskRegisterDraft['action'], taskTitle: string): ChatMessageViewModel {
  return {
    id: `assistant-success-${Date.now()}`,
    sender: 'assistant',
    tone: 'standard',
    content:
      action === 'create'
        ? `Tarefa "${taskTitle}" salva com sucesso. Você pode registrar outra tarefa nesta mesma sessão.`
        : `Atualização da tarefa "${taskTitle}" salva com sucesso. Você pode continuar registrando nesta sessão.`,
  }
}

export function buildTaskErrorMessage(): ChatMessageViewModel {
  return {
    id: `assistant-error-${Date.now()}`,
    sender: 'assistant',
    tone: 'standard',
    content: 'Não consegui salvar este registro agora. Revise os campos e tente novamente.',
  }
}

export function getActionLabel(action: TaskRegisterDraft['action']): string {
  return action === 'create' ? 'Criar nova tarefa' : 'Atualizar tarefa existente'
}
