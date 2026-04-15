import { useEffect, useMemo, useRef, useState } from 'react'
import type { ProjectMemberDTO, TaskStatus } from '@/data/dtos'
import type { ChatSessionDTO, TaskDTO, TaskUpdateDTO } from '@/data/dtos'
import { chatService } from '@/services/chat.service'
import { projectService } from '@/services/project.service'
import { taskService } from '@/services/task.service'
import type { ChatMessageViewModel, SidePanelSection, TaskRegisterDraft, TaskRegisterFlowProps } from '@/pages/Chat/types'
import {
  buildActionSelectionMessage,
  buildCreateTaskSummary,
  buildInitialTaskRegisterMessages,
  buildNextQuestionMessage,
  buildTaskErrorMessage,
  buildTaskSuccessMessage,
  buildTaskUpdatePayload,
  buildUpdateTaskSummary,
  getActionLabel,
  getActiveQuestions,
  getSelectedTask,
  getTaskQuestions,
  getTaskRegisterProgress,
} from '@/pages/Chat/utils'
import ChatMessage from '@/components/chat/ChatMessage'
import SidePanel from '@/components/chat/SidePanel'
import LogoAvatar from '@/components/chat/LogoAvatar'
import TaskActionCard from '@/pages/Chat/components/TaskActionCard'
import TaskContextPanel from '@/pages/Chat/components/TaskContextPanel'
import TaskPickerCard from '@/pages/Chat/components/TaskPickerCard'
import AttachmentUploadStep from '@/pages/Chat/components/AttachmentUploadStep'
import TaskQuestionInput from '@/pages/Chat/components/TaskQuestionInput'
import TaskSummaryCard from '@/pages/Chat/components/TaskSummaryCard'

const EMPTY_DRAFT: TaskRegisterDraft = {
  action: null,
  taskId: null,
  title: '',
  category: null,
  status: null,
  priority: null,
  feature_or_ticket: '',
  what_was_done: '',
  technical_approach: '',
  next_steps: '',
  blocked_reason: '',
  people_involved: '',
  people_involved_member_ids: [],
  tags: [],
  checkpoints: [],
}

function formatPeopleInvolved(members: ProjectMemberDTO[], selectedIds: string[]) {
  return members
    .filter((member) => selectedIds.includes(member.user_id))
    .map((member) => `${member.user.name} <${member.user.email}>`)
    .join(', ')
}

function parsePeopleInvolvedToIds(members: ProjectMemberDTO[], rawValue: string | null) {
  const normalized = (rawValue ?? '').toLowerCase()
  if (!normalized.trim()) return []
  return members
    .filter((member) => {
      const email = member.user.email.toLowerCase()
      const name = member.user.name.toLowerCase()
      return normalized.includes(email) || normalized.includes(name)
    })
    .map((member) => member.user_id)
}

function formatRecentTaskDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Data indisponível'

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date).replace('.', '').toUpperCase()
}

function getStatusTone(status: TaskStatus) {
  if (status === 'done') return 'text-emerald-300'
  if (status === 'blocked') return 'text-rose-300'
  if (status === 'cancelled') return 'text-white/36'
  if (status === 'in_progress') return 'text-amber-300'
  return 'text-sky-300'
}

export default function TaskRegisterFlow({
  projectId,
  projectName,
  userInitials,
  isPanelOpen,
  onTogglePanel,
}: TaskRegisterFlowProps) {
  const [session, setSession] = useState<ChatSessionDTO | null>(null)
  const [tasks, setTasks] = useState<TaskDTO[]>([])
  const [projectMembers, setProjectMembers] = useState<ProjectMemberDTO[]>([])
  const [selectedTaskUpdates, setSelectedTaskUpdates] = useState<TaskUpdateDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<'loading' | 'choose-action' | 'pick-task' | 'questions' | 'summary' | 'saving' | 'attachments' | 'done' | 'error'>('loading')
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessageViewModel[]>([])
  const [draft, setDraft] = useState<TaskRegisterDraft>(EMPTY_DRAFT)
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [isBusy, setIsBusy] = useState(false)
  const [busyMessage, setBusyMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, phase, tasks])

  useEffect(() => {
    let active = true

    async function bootstrap() {
      if (!projectId) {
        setLoading(false)
        setPhase('error')
        return
      }

      setLoading(true)
      setError(null)

      try {
        const [sessionsResponse, tasksResponse, membersResponse] = await Promise.all([
          chatService.listByProject(projectId),
          taskService.listByProject(projectId),
          projectService.listMembers(projectId),
        ])

        if (!active) return

        const activeSession = sessionsResponse.data.find((item) => item.mode === 'register' && item.status === 'active')
        const sessionResponse = activeSession
          ? { data: activeSession }
          : await chatService.createSession(projectId, {
              mode: 'register',
              title: projectName ? `Registro de tarefas - ${projectName}` : 'Registro de tarefas',
            })

        if (!active) return

        setSession(sessionResponse.data)
        setTasks(tasksResponse.data)
        setProjectMembers(membersResponse.data)
        setMessages([
          ...buildInitialTaskRegisterMessages(projectName),
          buildActionSelectionMessage(),
        ])
        setPhase('choose-action')
      } catch {
        if (!active) return
        setError('Não foi possível iniciar a sessão de registro agora.')
        setPhase('error')
      } finally {
        if (active) setLoading(false)
      }
    }

    void bootstrap()
    return () => {
      active = false
    }
  }, [projectId, projectName])

  const allQuestions = useMemo(() => getTaskQuestions(draft.action), [draft.action])
  const activeQuestions = useMemo(() => getActiveQuestions(draft, allQuestions), [draft, allQuestions])
  const currentQuestion = activeQuestions[step]

  const selectedTask = getSelectedTask(tasks, draft.taskId)
  const progress = getTaskRegisterProgress({ action: draft.action, phase, draft })
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updated_at ?? b.created_at).getTime() - new Date(a.updated_at ?? a.created_at).getTime())
    .slice(0, 4)

  const panelSections: SidePanelSection[] = [
    {
      title: 'Registro em andamento',
      content: (
        <TaskContextPanel
          draft={draft}
          tasks={tasks}
          projectName={projectName}
          progress={progress}
          updates={selectedTaskUpdates}
        />
      ),
    },
    ...(recentTasks.length > 0
      ? [{
          title: `Últimas tarefas${tasks.length > 0 ? ` (${tasks.length})` : ''}`,
          content: (
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <article key={task.id} className="rounded-lg border border-white/6 bg-surface-base/64 px-3 py-3">
                  <p className="text-[12px] leading-5 text-white/78">{task.title}</p>
                  <div className="mt-3 grid grid-cols-[1fr_auto] gap-3">
                    <div>
                      <p className="text-[10px] font-semibold tracking-[0.16em] text-white/26 uppercase">Status</p>
                      <p className={`mt-1 text-[11px] font-medium ${getStatusTone(task.status)}`}>
                        {task.status === 'in_progress'
                          ? 'Em progresso'
                          : task.status === 'done'
                          ? 'Concluída'
                          : task.status === 'blocked'
                          ? 'Bloqueada'
                          : task.status === 'cancelled'
                          ? 'Cancelada'
                          : 'A fazer'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-semibold tracking-[0.16em] text-white/26 uppercase">Data</p>
                      <p className="mt-1 text-[11px] text-white/50">{formatRecentTaskDate(task.updated_at ?? task.created_at)}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ),
        }]
      : []),
  ]

  async function addSessionMessage(message: { sender: 'assistant' | 'user'; content: string; metadata?: Record<string, unknown> | null }) {
    if (!session) return
    try {
      await chatService.addMessage(session.id, {
        sender: message.sender,
        content: message.content,
        message_type: 'text',
        metadata: message.metadata ?? null,
      })
    } catch {
      // Best-effort only for this first version.
    }
  }

  function resetFlow(assistantMessage?: ChatMessageViewModel) {
    setDraft(EMPTY_DRAFT)
    setSelectedTaskUpdates([])
    setStep(0)
    setPhase('choose-action')
    setError(null)
    setMessages((prev) => [
      ...prev,
      assistantMessage ?? buildActionSelectionMessage(),
    ])
  }

  async function reloadTasks() {
    if (!projectId) return
    const { data } = await taskService.listByProject(projectId)
    setTasks(data)
  }

  async function reloadSelectedTaskUpdates(taskId: string | null) {
    if (!taskId) {
      setSelectedTaskUpdates([])
      return
    }

    try {
      const { data } = await taskService.listUpdates(taskId)
      setSelectedTaskUpdates(
        [...data].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
      )
    } catch {
      setSelectedTaskUpdates([])
    }
  }

  function startBusy(message: string) {
    setIsBusy(true)
    setBusyMessage(message)
  }

  function stopBusy() {
    setIsBusy(false)
    setBusyMessage(null)
  }

  async function handleSelectAction(action: 'create' | 'update') {
    if (isBusy || saving) return
    startBusy(action === 'create' ? 'Preparando o fluxo de criação da tarefa...' : 'Carregando a seleção de tarefas...')

    const userMessage: ChatMessageViewModel = {
      id: `user-action-${Date.now()}`,
      sender: 'user',
      tone: 'highlight',
      content: getActionLabel(action),
    }

    setMessages((prev) => [...prev, userMessage])
    await addSessionMessage({
      sender: 'user',
      content: userMessage.content,
      metadata: { type: 'task_register_action', action },
    })

    try {
      if (action === 'update') {
        setDraft((current) => ({ ...current, action }))
        setSelectedTaskUpdates([])
        setPhase('pick-task')
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-pick-${Date.now()}`,
            sender: 'assistant',
            tone: 'standard',
            content: 'Escolha a tarefa que você quer atualizar.',
          },
        ])
        return
      }

      const nextDraft = { ...EMPTY_DRAFT, action }
      setDraft(nextDraft)
      setSelectedTaskUpdates([])
      setStep(0)
      setPhase('questions')

      const questions = getActiveQuestions(nextDraft, getTaskQuestions(action))
      setMessages((prev) => [...prev, buildNextQuestionMessage(questions[0], 0)])
    } finally {
      stopBusy()
    }
  }

  async function handleSelectTask(taskId: string) {
    if (isBusy || saving) return
    const task = tasks.find((item) => item.id === taskId)
    if (!task) return
    startBusy('Carregando os dados atuais da tarefa...')

    try {
    const nextDraft: TaskRegisterDraft = {
      ...EMPTY_DRAFT,
      action: 'update',
      taskId,
      title: task.title,
        category: task.category,
        status: task.status,
        priority: task.priority,
        feature_or_ticket: task.feature_or_ticket ?? '',
        what_was_done: task.what_was_done ?? '',
      technical_approach: task.technical_approach ?? '',
      next_steps: task.next_steps ?? '',
      blocked_reason: task.blocked_reason ?? '',
      people_involved: task.people_involved ?? '',
      people_involved_member_ids: parsePeopleInvolvedToIds(projectMembers, task.people_involved),
      tags: task.tags ?? [],
      checkpoints: [],
    }

      setDraft(nextDraft)
      await reloadSelectedTaskUpdates(task.id)

      const userMessage: ChatMessageViewModel = {
        id: `user-task-${task.id}`,
        sender: 'user',
        tone: 'highlight',
        content: task.title,
      }

      setMessages((prev) => [...prev, userMessage])
      await addSessionMessage({
        sender: 'user',
        content: task.title,
        metadata: { type: 'task_selected', task_id: task.id },
      })

      setStep(0)
      setPhase('questions')
      const questions = getActiveQuestions(nextDraft, getTaskQuestions('update'))
      setMessages((prev) => [...prev, buildNextQuestionMessage(questions[0], 0)])
    } finally {
      stopBusy()
    }
  }

  /** Advances to the next question after any answer (text, enum, skip) */
  function advanceStep(newDraft: TaskRegisterDraft, userContent: string) {
    void addSessionMessage({
      sender: 'user',
      content: userContent,
      metadata: { type: 'task_answer', field: currentQuestion?.field },
    })

    const newMessages: ChatMessageViewModel = {
      id: `user-answer-${Date.now()}`,
      sender: 'user',
      tone: 'highlight',
      content: userContent,
    }
    setMessages((prev) => [...prev, newMessages])

    const newActive = getActiveQuestions(newDraft, allQuestions)
    const nextStep = step + 1

    if (nextStep < newActive.length) {
      setStep(nextStep)
      setMessages((prev) => [...prev, buildNextQuestionMessage(newActive[nextStep], nextStep)])
      return
    }

    setPhase('summary')
  }

  function handleTextSubmit(value: string) {
    if (!currentQuestion || !value.trim()) return
    const field = currentQuestion.field
    const newDraft = { ...draft, [field]: value.trim() }
    setDraft(newDraft)
    advanceStep(newDraft, value.trim())
  }

  function handleEnumSelect(value: string) {
    if (!currentQuestion) return
    setDraft((d) => ({ ...d, [currentQuestion.field]: value }))
  }

  function handleEnumSubmit() {
    if (!currentQuestion) return
    const currentValue = draft[currentQuestion.field as keyof TaskRegisterDraft]
    if (!currentValue) return
    const newDraft = { ...draft }
    const label = currentQuestion.enumOptions?.find((o) => o.value === currentValue)?.label ?? String(currentValue)
    advanceStep(newDraft, label)
  }

  function handleTagsSubmit(tags: string[]) {
    if (!currentQuestion) return
    const newDraft = { ...draft, tags }
    setDraft(newDraft)
    advanceStep(newDraft, tags.length > 0 ? tags.join(', ') : '(sem tags)')
  }

  function handlePeopleInvolvedSubmit(memberIds: string[]) {
    if (!currentQuestion) return
    const peopleInvolved = formatPeopleInvolved(projectMembers, memberIds)
    const newDraft = {
      ...draft,
      people_involved_member_ids: memberIds,
      people_involved: peopleInvolved,
    }
    setDraft(newDraft)
    advanceStep(
      newDraft,
      memberIds.length > 0
        ? projectMembers
            .filter((member) => memberIds.includes(member.user_id))
            .map((member) => member.user.name)
            .join(', ')
        : '(sem membros)',
    )
  }

  function handleChecklistSubmit(items: typeof draft.checkpoints) {
    if (!currentQuestion) return
    const newDraft = { ...draft, checkpoints: items }
    setDraft(newDraft)
    advanceStep(newDraft, items.length > 0 ? `${items.length} item${items.length > 1 ? 's' : ''}` : '(sem itens)')
  }

  function handleSkip() {
    if (!currentQuestion) return
    advanceStep(draft, '(pulado)')
  }

  function handleEditAnswers() {
    const action = draft.action
    if (!action) return
    setStep(0)
    setPhase('questions')
    const questions = getActiveQuestions(draft, getTaskQuestions(action))
    setMessages((prev) => [
      ...prev,
      {
        id: `assistant-edit-${Date.now()}`,
        sender: 'assistant',
        tone: 'standard',
        content: 'Perfeito. Vamos revisar suas respostas a partir da primeira pergunta.',
      },
      buildNextQuestionMessage(questions[0], 0),
    ])
  }

  async function handleConfirmSave() {
    if (!projectId || !draft.action || isBusy) return
    setSaving(true)
    startBusy('Salvando o registro da tarefa...')
    setPhase('saving')
    setError(null)

    try {
      let taskTitle = draft.title
      let persistedTaskId = draft.taskId
      const previousStatus = selectedTask?.status ?? null

      if (draft.action === 'create') {
        const { data } = await taskService.create(projectId, {
          title: draft.title,
          category: draft.category ?? undefined,
          status: draft.status ?? 'todo',
          priority: draft.priority ?? undefined,
          feature_or_ticket: draft.feature_or_ticket || null,
          what_was_done: draft.what_was_done || null,
          technical_approach: draft.technical_approach || null,
          next_steps: draft.next_steps || null,
          blocked_reason: draft.blocked_reason || null,
          people_involved: draft.people_involved || null,
          tags: draft.tags.length > 0 ? draft.tags : undefined,
        })
        taskTitle = data.title
        persistedTaskId = data.id

        await taskService.createUpdate(
          persistedTaskId,
          buildTaskUpdatePayload({
            draft,
            previousStatus: null,
            isCreate: true,
          }),
        )

        if (draft.checkpoints.length > 0) {
          await taskService.createCheckpoints(persistedTaskId, draft.checkpoints)
        }
      } else if (draft.taskId) {
        const { data } = await taskService.update(draft.taskId, {
          status: draft.status ?? selectedTask?.status,
          what_was_done: draft.what_was_done || null,
          technical_approach: draft.technical_approach || null,
          next_steps: draft.next_steps || null,
          blocked_reason: draft.blocked_reason || null,
          people_involved: draft.people_involved || null,
          tags: draft.tags.length > 0 ? draft.tags : null,
        })
        taskTitle = data.title
      }

      if (persistedTaskId && draft.action === 'update') {
        await taskService.createUpdate(
          persistedTaskId,
          buildTaskUpdatePayload({
            draft,
            previousStatus,
            isCreate: false,
          }),
        )
      }

      await addSessionMessage({
        sender: 'assistant',
        content: `Registro salvo para ${taskTitle}.`,
        metadata: {
          type: 'task_saved',
          action: draft.action,
          task_id: persistedTaskId,
          title: taskTitle,
        },
      })

      await reloadTasks()
      await reloadSelectedTaskUpdates(persistedTaskId ?? null)
      const successMessage = buildTaskSuccessMessage(draft.action, taskTitle)
      setMessages((prev) => [...prev, successMessage])

      if (draft.action === 'create') {
        setCreatedTaskId(persistedTaskId)
        setPhase('attachments')
      } else {
        setPhase('done')
        window.setTimeout(() => {
          resetFlow(buildActionSelectionMessage())
        }, 700)
      }
    } catch {
      setError('Não foi possível salvar o registro da tarefa.')
      setMessages((prev) => [...prev, buildTaskErrorMessage()])
      setPhase('summary')
    } finally {
      setSaving(false)
      stopBusy()
    }
  }

  if (!projectId) {
    return (
      <section className="chat-card-enter relative flex h-full min-h-0 flex-1 flex-col rounded-[5px] border border-white/7 bg-[linear-gradient(180deg,rgba(19,22,30,0.88),rgba(13,15,20,0.88))] backdrop-blur-xl">
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold tracking-[0.18em] text-accent-indigo/80 uppercase">Projeto necessário</p>
            <p className="mt-4 text-lg font-semibold text-white/88">Selecione um projeto antes de registrar tarefas.</p>
            <p className="mt-2 text-sm leading-6 text-white/54">O chat de registro usa o projeto atual para carregar tarefas existentes e salvar novos registros.</p>
          </div>
        </div>
      </section>
    )
  }

  // Current text/enum/tags values for the active question
  const currentTextField = (() => {
    if (!currentQuestion) return ''
    const v = draft[currentQuestion.field as keyof TaskRegisterDraft]
    if (Array.isArray(v) || v === null) return ''
    return (v as string) ?? ''
  })()

  const currentEnumValue = (() => {
    if (!currentQuestion || currentQuestion.inputType !== 'enum-single') return null
    const v = draft[currentQuestion.field as keyof TaskRegisterDraft]
    return typeof v === 'string' ? v : null
  })()

  const currentTagsValue = draft.tags
  const currentChecklistValue = draft.checkpoints
  const currentMemberValue = draft.people_involved_member_ids

  const summary = draft.action === 'create'
    ? buildCreateTaskSummary(draft)
    : buildUpdateTaskSummary(draft, tasks)

  return (
    <>
      <section className="chat-card-enter relative flex h-full min-h-0 flex-1 flex-col rounded-[5px] border border-white/7 bg-[linear-gradient(180deg,rgba(19,22,30,0.88),rgba(13,15,20,0.88))] backdrop-blur-xl">
        <div ref={scrollRef} className="chat-scroll flex-1 min-h-0 space-y-6 overflow-y-auto px-4 py-5 sm:px-5">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} userInitials={userInitials} />
          ))}

          {loading && (
            <div className="chat-card-enter flex items-start gap-4">
              <LogoAvatar />
              <article className="chat-message-glow rounded-[22px] border border-white/8 bg-surface-container/92 px-5 py-4 sm:px-6">
                <p className="text-[15px] leading-8 text-white/82">Preparando a sessão de registro e carregando as tarefas do projeto...</p>
              </article>
            </div>
          )}

          {phase === 'choose-action' && !loading && (
            <TaskActionCard
              onSelect={(action) => { void handleSelectAction(action) }}
              disableUpdate={tasks.length === 0}
              disabled={isBusy || saving}
            />
          )}

          {phase === 'pick-task' && (
            <TaskPickerCard
              tasks={tasks}
              selectedTaskId={draft.taskId}
              onSelect={(taskId) => { void handleSelectTask(taskId) }}
              disabled={isBusy || saving}
            />
          )}

          {phase === 'attachments' && createdTaskId && (
            <AttachmentUploadStep
              taskId={createdTaskId}
              onComplete={() => {
                setPhase('done')
                window.setTimeout(() => { resetFlow(buildActionSelectionMessage()) }, 700)
              }}
              onSkip={() => {
                setPhase('done')
                window.setTimeout(() => { resetFlow(buildActionSelectionMessage()) }, 700)
              }}
            />
          )}

          {(phase === 'summary' || phase === 'saving' || phase === 'done') && draft.action && (
            <TaskSummaryCard
              summary={summary}
              onConfirm={() => { void handleConfirmSave() }}
              onEdit={handleEditAnswers}
              saving={saving}
            />
          )}

          {error && (
            <div className="chat-card-enter rounded-[18px] border border-rose-400/18 bg-rose-400/7 px-4 py-3 text-sm text-rose-100/82">
              {error}
            </div>
          )}

          {isBusy && busyMessage && !loading && (
            <div className="chat-card-enter flex items-start gap-4">
              <LogoAvatar />
              <article className="chat-message-glow max-w-3xl rounded-[22px] border border-white/8 bg-surface-container/92 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-5 items-center gap-1.5">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-accent-indigo/90" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-accent-indigo/65 [animation-delay:120ms]" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-accent-indigo/40 [animation-delay:240ms]" />
                  </span>
                  <p className="text-[15px] leading-7 text-white/74">{busyMessage}</p>
                </div>
              </article>
            </div>
          )}
        </div>

        {phase === 'questions' && currentQuestion && (
          <TaskQuestionInput
            question={currentQuestion}
            textValue={currentTextField}
            onTextChange={(v) => setDraft((d) => ({ ...d, [currentQuestion.field]: v }))}
            enumValue={currentEnumValue}
            onEnumSelect={handleEnumSelect}
            tagsValue={currentTagsValue}
            onTagsChange={(tags) => setDraft((d) => ({ ...d, tags }))}
            checklistValue={currentChecklistValue}
            onChecklistChange={(items) => setDraft((d) => ({ ...d, checkpoints: items }))}
            memberValue={currentMemberValue}
            memberOptions={projectMembers}
            onMemberToggle={(userId) =>
              setDraft((d) => ({
                ...d,
                people_involved_member_ids: d.people_involved_member_ids.includes(userId)
                  ? d.people_involved_member_ids.filter((id) => id !== userId)
                  : [...d.people_involved_member_ids, userId],
              }))
            }
            onSubmit={() => {
              if (currentQuestion.inputType === 'enum-single') handleEnumSubmit()
              else if (currentQuestion.inputType === 'tags') handleTagsSubmit(currentTagsValue)
              else if (currentQuestion.inputType === 'checklist') handleChecklistSubmit(currentChecklistValue)
              else if (currentQuestion.inputType === 'member-multi') handlePeopleInvolvedSubmit(currentMemberValue)
              else handleTextSubmit(currentTextField)
            }}
            onSkip={handleSkip}
            disabled={
              currentQuestion.inputType === 'enum-single'
                ? !currentEnumValue
                : currentQuestion.inputType === 'tags' || currentQuestion.inputType === 'checklist'
                ? false
                : currentQuestion.inputType === 'member-multi'
                ? false
                : (!currentTextField.trim() && Boolean(currentQuestion.required))
            }
          />
        )}
      </section>

      <div
        className={[
          'chat-card-enter-delay hidden xl:flex h-full min-h-0 shrink-0 flex-col overflow-hidden rounded-[5px] border border-white/8 bg-surface-container/86 backdrop-blur-xl',
          'transition-[width] duration-220 ease-in-out',
          isPanelOpen ? 'w-[288px]' : 'w-10',
        ].join(' ')}
      >
        {isPanelOpen ? (
          <SidePanel sections={panelSections} onClose={() => onTogglePanel(false)} label="Registro de tarefa" />
        ) : (
          <button
            type="button"
            onClick={() => onTogglePanel(true)}
            aria-label="Abrir painel contextual"
            className="flex flex-1 items-center justify-center text-white/36 transition-colors duration-150 hover:text-white/68"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
      </div>
    </>
  )
}
