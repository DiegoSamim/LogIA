import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChatSessionDTO, TaskDTO } from '@/data/dtos'
import { chatService } from '@/services/chat.service'
import { taskService } from '@/services/task.service'
import type { ChatMessageViewModel, SidePanelSection, TaskRegisterDraft, TaskRegisterFlowProps } from '@/pages/Chat/types'
import { buildActionSelectionMessage, buildCreateTaskSummary, buildInitialTaskRegisterMessages, buildNextQuestionMessage, buildTaskErrorMessage, buildTaskSuccessMessage, buildUpdateTaskSummary, getActionLabel, getSelectedTask, getTaskFieldValue, getTaskQuestions, getTaskRegisterProgress } from '@/pages/Chat/utils'
import ChatMessage from '@/pages/Chat/components/ChatMessage'
import SidePanel from '@/pages/Chat/components/SidePanel'
import TaskActionCard from '@/pages/Chat/components/TaskActionCard'
import TaskContextPanel from '@/pages/Chat/components/TaskContextPanel'
import TaskPickerCard from '@/pages/Chat/components/TaskPickerCard'
import TaskQuestionInput from '@/pages/Chat/components/TaskQuestionInput'
import TaskSummaryCard from '@/pages/Chat/components/TaskSummaryCard'
import LogoAvatar from '@/pages/Chat/components/LogoAvatar'

const EMPTY_DRAFT: TaskRegisterDraft = {
  action: null,
  taskId: null,
  taskTitle: '',
  currentStatus: null,
  newStatus: null,
  summary: '',
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
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState<'loading' | 'choose-action' | 'pick-task' | 'questions' | 'summary' | 'saving' | 'done' | 'error'>('loading')
  const [messages, setMessages] = useState<ChatMessageViewModel[]>([])
  const [draft, setDraft] = useState<TaskRegisterDraft>(EMPTY_DRAFT)
  const [step, setStep] = useState(0)
  const [inputValue, setInputValue] = useState('')
  const [saving, setSaving] = useState(false)
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
        const [sessionsResponse, tasksResponse] = await Promise.all([
          chatService.listByProject(projectId),
          taskService.listByProject(projectId),
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

  const currentQuestions = useMemo(() => getTaskQuestions(draft.action), [draft.action])
  const currentQuestion = currentQuestions[step]
  const selectedTask = getSelectedTask(tasks, draft.taskId)
  const progress = getTaskRegisterProgress({ action: draft.action, phase, draft })

  const panelSections: SidePanelSection[] = [
    {
      title: 'Registro em andamento',
      content: (
        <TaskContextPanel
          draft={draft}
          tasks={tasks}
          projectName={projectName}
          progress={progress}
        />
      ),
    },
    {
      title: 'Sessão',
      content: (
        <div className="space-y-2 text-xs text-white/56">
          <p className="text-white/78">{session ? 'Sessão ativa de registro pronta para novos lançamentos.' : 'Sessão ainda não iniciada.'}</p>
          <p>{tasks.length} {tasks.length === 1 ? 'tarefa encontrada' : 'tarefas encontradas'} neste projeto.</p>
        </div>
      ),
    },
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
    setStep(0)
    setInputValue('')
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

  async function handleSelectAction(action: 'create' | 'update') {
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

    if (action === 'update') {
      setDraft((current) => ({ ...current, action }))
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

    const nextDraft = {
      ...EMPTY_DRAFT,
      action,
    }
    setDraft(nextDraft)
    setStep(0)
    setInputValue(getTaskFieldValue(nextDraft, currentQuestions[0]?.field ?? 'taskTitle'))
    setPhase('questions')

    const firstQuestion = getTaskQuestions(action)[0]
    setMessages((prev) => [...prev, buildNextQuestionMessage(firstQuestion, 0)])
  }

  async function handleSelectTask(taskId: string) {
    const task = getSelectedTask(tasks, taskId)
    if (!task) return

    setDraft((current) => ({
      ...current,
      action: 'update',
      taskId,
      currentStatus: task.status,
      newStatus: task.status,
      taskTitle: task.title,
    }))

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
    setInputValue('')
    setPhase('questions')
    setMessages((prev) => [...prev, buildNextQuestionMessage(getTaskQuestions('update')[0], 0)])
  }

  async function handleSubmitAnswer() {
    if (!currentQuestion) return
    const value = inputValue.trim()
    if (!value) return

    const userMessage: ChatMessageViewModel = {
      id: `user-answer-${Date.now()}`,
      sender: 'user',
      tone: 'highlight',
      content: currentQuestion.field === 'newStatus' ? selectedTask && draft.action === 'update' && value === selectedTask.status ? `${value} (mantido)` : value : value,
    }

    setMessages((prev) => [...prev, userMessage])
    await addSessionMessage({
      sender: 'user',
      content: value,
      metadata: { type: 'task_answer', field: currentQuestion.field },
    })

    const nextDraft = { ...draft }
    if (currentQuestion.field === 'taskTitle') nextDraft.taskTitle = value
    if (currentQuestion.field === 'summary') nextDraft.summary = value
    if (currentQuestion.field === 'newStatus') nextDraft.newStatus = value as TaskDTO['status']

    setDraft(nextDraft)
    const nextStep = step + 1
    const nextQuestions = getTaskQuestions(nextDraft.action)

    if (nextStep < nextQuestions.length) {
      setStep(nextStep)
      setInputValue(getTaskFieldValue(nextDraft, nextQuestions[nextStep].field))
      setMessages((prev) => [...prev, buildNextQuestionMessage(nextQuestions[nextStep], nextStep)])
      return
    }

    setInputValue('')
    setPhase('summary')
  }

  function handleEditAnswers() {
    const action = draft.action
    if (!action) return
    setStep(0)
    setInputValue(getTaskFieldValue(draft, getTaskQuestions(action)[0].field))
    setPhase('questions')
    setMessages((prev) => [
      ...prev,
      {
        id: `assistant-edit-${Date.now()}`,
        sender: 'assistant',
        tone: 'standard',
        content: 'Perfeito. Vamos revisar suas respostas a partir da primeira pergunta.',
      },
      buildNextQuestionMessage(getTaskQuestions(action)[0], 0),
    ])
  }

  async function handleConfirmSave() {
    if (!projectId || !draft.action) return
    setSaving(true)
    setPhase('saving')
    setError(null)

    try {
      let taskTitle = draft.taskTitle

      if (draft.action === 'create') {
        const { data } = await taskService.create(projectId, {
          title: draft.taskTitle,
          status: draft.newStatus ?? 'todo',
          what_was_done: draft.summary,
        })
        taskTitle = data.title
      } else if (draft.taskId) {
        const { data } = await taskService.update(draft.taskId, {
          status: draft.newStatus ?? selectedTask?.status,
          what_was_done: draft.summary,
        })
        taskTitle = data.title
      }

      await addSessionMessage({
        sender: 'assistant',
        content: `Registro salvo para ${taskTitle}.`,
        metadata: {
          type: 'task_saved',
          action: draft.action,
          task_id: draft.taskId,
          title: taskTitle,
        },
      })

      await reloadTasks()
      const successMessage = buildTaskSuccessMessage(draft.action, taskTitle)
      setMessages((prev) => [...prev, successMessage])
      setPhase('done')

      window.setTimeout(() => {
        resetFlow(buildActionSelectionMessage())
      }, 700)
    } catch {
      setError('Não foi possível salvar o registro da tarefa.')
      setMessages((prev) => [...prev, buildTaskErrorMessage()])
      setPhase('summary')
    } finally {
      setSaving(false)
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
            <TaskActionCard onSelect={(action) => { void handleSelectAction(action) }} disableUpdate={tasks.length === 0} />
          )}

          {phase === 'pick-task' && (
            <TaskPickerCard tasks={tasks} selectedTaskId={draft.taskId} onSelect={(taskId) => { void handleSelectTask(taskId) }} />
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
        </div>

        {phase === 'questions' && currentQuestion && (
          <TaskQuestionInput
            question={currentQuestion}
            value={inputValue}
            onChange={setInputValue}
            onSubmit={() => { void handleSubmitAnswer() }}
            disabled={!inputValue.trim()}
          />
        )}
      </section>

      <div
        className={[
          'chat-card-enter-delay hidden xl:flex h-full min-h-0 shrink-0 flex-col overflow-hidden rounded-[5px] border border-white/8 bg-surface-container/86 backdrop-blur-xl',
          'transition-[width] duration-[220ms] ease-in-out',
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
