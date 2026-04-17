import type { BuiltTaskUpdatePayload, ChatMessageViewModel, ProjectDraft, ProjectQuestion, TaskLookup, TaskRegisterDraft, TaskRegisterProgressItem, TaskRegisterQuestion, TaskSummaryField, TaskSummaryViewModel } from '@/pages/Chat/types'
import { CREATE_TASK_QUESTIONS, STATUS_CHIP_OPTIONS, UPDATE_TASK_QUESTIONS } from '@/pages/Chat/constants'

export function getProjectDraftValue(draft: ProjectDraft, field: ProjectQuestion['field']): string {
  if (field === 'stack') return draft.stack.join(', ')
  return draft[field] ?? ''
}

/** Returns the full question list for the given action, filtering out conditional questions based on draft */
export function getActiveQuestions(draft: TaskRegisterDraft, allQuestions: TaskRegisterQuestion[]): TaskRegisterQuestion[] {
  return allQuestions.filter((q) => !q.condition || q.condition(draft))
}

export function getTaskQuestions(action: TaskRegisterDraft['action']): TaskRegisterQuestion[] {
  return action === 'create' ? CREATE_TASK_QUESTIONS : UPDATE_TASK_QUESTIONS
}

export function getTaskStatusLabel(status: string): string {
  return STATUS_CHIP_OPTIONS.find((option) => option.value === status)?.label ?? status
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
  const updatePayload = buildTaskUpdatePayload({
    draft,
    previousStatus: null,
    isCreate: true,
  })

  const topFields: TaskSummaryField[] = [
    { label: 'Ação', value: 'Criar nova tarefa', compact: true, tone: 'strong' },
    { label: 'Título', value: draft.title, compact: true, tone: 'strong' },
    { label: 'Status', value: getTaskStatusLabel(draft.status ?? 'todo'), compact: true },
    { label: 'Update gerado', value: getUpdateTypeLabel(updatePayload.update_type), compact: true },
  ]

  const detailFields: TaskSummaryField[] = [
    { label: 'Resumo da tarefa', value: draft.task_summary, multiline: true },
    { label: 'Categoria', value: draft.category ? draft.category.replace('_', ' ') : '', compact: true },
    { label: 'Prioridade', value: draft.priority ?? '', compact: true },
    { label: 'Ticket ou feature', value: draft.feature_or_ticket, compact: true },
    { label: 'Abordagem técnica', value: draft.technical_approach, multiline: true },
    { label: 'Próximos passos', value: draft.next_steps, multiline: true },
    { label: 'Motivo do bloqueio', value: draft.blocked_reason, multiline: true },
    { label: 'Pessoas envolvidas', value: draft.people_involved, compact: true },
    { label: 'Tags', value: draft.tags, kind: 'tags' as const },
    ...(draft.checkpoints.length > 0
      ? [{ label: 'Checklist', value: `${draft.checkpoints.length} item${draft.checkpoints.length > 1 ? 's' : ''}`, compact: true }]
      : []),
    { label: 'Horas trabalhadas', value: draft.hours_worked && parseFloat(draft.hours_worked) > 0 ? `${parseFloat(draft.hours_worked).toFixed(1)} h` : '', compact: true },
  ].filter((field) =>
    Array.isArray(field.value) ? field.value.length > 0 : field.value.trim().length > 0,
  )

  const skippedFields = [
    !draft.category ? 'Categoria' : null,
    !draft.priority ? 'Prioridade' : null,
    !draft.feature_or_ticket.trim() ? 'Ticket ou feature' : null,
    !draft.technical_approach.trim() ? 'Abordagem técnica' : null,
    !draft.next_steps.trim() ? 'Próximos passos' : null,
    !draft.blocked_reason.trim() ? 'Motivo do bloqueio' : null,
    !draft.people_involved.trim() ? 'Pessoas envolvidas' : null,
    draft.tags.length === 0 ? 'Tags' : null,
    draft.checkpoints.length === 0 ? 'Checklist' : null,
    !draft.hours_worked || parseFloat(draft.hours_worked) <= 0 ? 'Horas trabalhadas' : null,
  ].filter(Boolean) as string[]

  return {
    actionLabel: 'Criar nova tarefa',
    topFields,
    detailFields,
    skippedFields,
  }
}

export function buildUpdateTaskSummary(draft: TaskRegisterDraft, tasks: TaskLookup[]): TaskSummaryViewModel {
  const task = getSelectedTask(tasks, draft.taskId)
  const updatePayload = buildTaskUpdatePayload({
    draft,
    previousStatus: task?.status ?? null,
    isCreate: false,
  })

  const topFields: TaskSummaryField[] = [
    { label: 'Ação', value: 'Atualizar tarefa existente', compact: true, tone: 'strong' },
    { label: 'Tarefa', value: task?.title ?? draft.title ?? 'Tarefa selecionada', compact: true, tone: 'strong' },
    { label: 'Status', value: getTaskStatusLabel(draft.status ?? task?.status ?? 'todo'), compact: true },
    { label: 'Update gerado', value: getUpdateTypeLabel(updatePayload.update_type), compact: true },
  ]

  const detailFields: TaskSummaryField[] = [
    { label: 'O que foi alterado', value: draft.update_summary, multiline: true },
    ...(draft.update_task_summary === 'yes'
      ? [{ label: 'Resumo da tarefa', value: draft.task_summary, multiline: true }]
      : []),
    { label: 'Abordagem técnica', value: draft.technical_approach, multiline: true },
    { label: 'Próximos passos', value: draft.next_steps, multiline: true },
    { label: 'Motivo do bloqueio', value: draft.blocked_reason, multiline: true },
    { label: 'Tags', value: draft.tags, kind: 'tags' as const },
    { label: 'Horas adicionais', value: draft.hours_worked && parseFloat(draft.hours_worked) > 0 ? `${parseFloat(draft.hours_worked).toFixed(1)} h` : '', compact: true },
  ].filter((field) =>
    Array.isArray(field.value) ? field.value.length > 0 : field.value.trim().length > 0,
  )

  const skippedFields = [
    draft.update_task_summary !== 'yes' ? 'Resumo da tarefa' : null,
    !draft.technical_approach.trim() ? 'Abordagem técnica' : null,
    !draft.next_steps.trim() ? 'Próximos passos' : null,
    !draft.blocked_reason.trim() ? 'Motivo do bloqueio' : null,
    draft.tags.length === 0 ? 'Tags' : null,
  ].filter(Boolean) as string[]

  return {
    actionLabel: 'Atualizar tarefa existente',
    topFields,
    detailFields,
    skippedFields,
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

  const requiredFields = action === 'create'
    ? [{ id: 'title', label: 'Título', done: Boolean(draft.title) }]
    : [{ id: 'update_summary', label: 'O que foi alterado', done: Boolean(draft.update_summary) }]

  items.push(...requiredFields.map((f) => ({
    ...f,
    active: phase === 'questions' && !f.done,
  })))

  items.push({
    id: 'summary',
    label: 'Confirmação final',
    done: phase === 'done',
    active: phase === 'summary' || phase === 'saving',
  })

  return items
}

export function getTaskFieldValue(draft: TaskRegisterDraft, field: TaskRegisterQuestion['field']): string {
  if (field === 'checkpoints') return ''
  const v = draft[field as keyof TaskRegisterDraft]
  if (Array.isArray(v)) return ''
  return (v as string | null) ?? ''
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

export function getUpdateTypeLabel(updateType: string): string {
  if (updateType === 'created') return 'Criação'
  if (updateType === 'completion') return 'Conclusão'
  if (updateType === 'blocker') return 'Bloqueio'
  if (updateType === 'status_change') return 'Mudança de status'
  if (updateType === 'edit') return 'Edição'
  return 'Progresso'
}

export function buildTaskUpdatePayload({
  draft,
  previousStatus,
  isCreate,
}: {
  draft: TaskRegisterDraft
  previousStatus: string | null
  isCreate: boolean
}): BuiltTaskUpdatePayload {
  const nextStatus = draft.status ?? null
  const summary = isCreate
    ? draft.task_summary.trim() || null
    : draft.update_summary.trim() || null
  const detailsParts = [
    draft.technical_approach.trim() ? `Abordagem técnica: ${draft.technical_approach.trim()}` : '',
    draft.next_steps.trim() ? `Próximos passos: ${draft.next_steps.trim()}` : '',
    draft.blocked_reason.trim() ? `Motivo do bloqueio: ${draft.blocked_reason.trim()}` : '',
  ].filter(Boolean)

  let updateType: BuiltTaskUpdatePayload['update_type'] = 'progress'
  if (isCreate) {
    updateType = 'created'
  } else if (nextStatus === 'done' && previousStatus !== 'done') {
    updateType = 'completion'
  } else if (nextStatus === 'blocked' && previousStatus !== 'blocked') {
    updateType = 'blocker'
  } else if (nextStatus && previousStatus && nextStatus !== previousStatus) {
    updateType = 'status_change'
  }

  return {
    update_type: updateType,
    summary,
    details: detailsParts.length > 0 ? detailsParts.join('\n\n') : null,
    old_status: isCreate ? null : (previousStatus as BuiltTaskUpdatePayload['old_status']),
    new_status: nextStatus as BuiltTaskUpdatePayload['new_status'],
  }
}
