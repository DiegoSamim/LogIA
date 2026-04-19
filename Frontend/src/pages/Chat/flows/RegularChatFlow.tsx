import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChatMessageDTO, ChatSessionDTO, QueryRunStatus } from '@/data/dtos'
import { QUERY_FIXED_QUESTIONS, QUERY_PANEL_SECTIONS } from '@/pages/Chat/constants'
import type { RegularChatFlowProps, SidePanelSection } from '@/pages/Chat/types'
import QueryConversationMessage, { type QueryConversationMessageItem } from '@/components/chat/QueryConversationMessage'
import SidePanel from '@/components/chat/SidePanel'
import { chatService } from '@/services/chat.service'
import { useQuerySessionsStore } from '@/store/useQuerySessionsStore'

const EMPTY_QUERY_SESSIONS: ChatSessionDTO[] = []
const EMPTY_MESSAGES: ChatMessageDTO[] = []

function getRunLabel(status: QueryRunStatus | null | undefined) {
  if (status === 'pending') return 'Na fila'
  if (status === 'running') return 'Respondendo'
  if (status === 'failed') return 'Erro'
  if (status === 'cancelled') return 'Cancelada'
  if (status === 'completed') return 'Respondida'
  return 'Pronta'
}

function formatSessionDate(value: string | null | undefined) {
  if (!value) return 'Agora'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Agora'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export default function RegularChatFlow({
  projectId,
  projectName,
  userInitials,
  isPanelOpen,
  onTogglePanel,
}: RegularChatFlowProps) {
  const activeSessionIdByProject = useQuerySessionsStore((state) => state.activeSessionIdByProject)
  const sessionsByProject = useQuerySessionsStore((state) => state.sessionsByProject)
  const messagesBySession = useQuerySessionsStore((state) => state.messagesBySession)
  const runsBySession = useQuerySessionsStore((state) => state.runsBySession)
  const setProjectSessions = useQuerySessionsStore((state) => state.setProjectSessions)
  const upsertSession = useQuerySessionsStore((state) => state.upsertSession)
  const setActiveSession = useQuerySessionsStore((state) => state.setActiveSession)
  const setSessionMessages = useQuerySessionsStore((state) => state.setSessionMessages)
  const appendSessionMessages = useQuerySessionsStore((state) => state.appendSessionMessages)
  const setSessionRun = useQuerySessionsStore((state) => state.setSessionRun)

  const activeSessionId = projectId ? activeSessionIdByProject[projectId] ?? null : null
  const querySessions = projectId ? sessionsByProject[projectId] ?? EMPTY_QUERY_SESSIONS : EMPTY_QUERY_SESSIONS

  const [loadingSessions, setLoadingSessions] = useState(true)
  const [loadingMessagesForSession, setLoadingMessagesForSession] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedQuestionKey, setSelectedQuestionKey] = useState<string>(QUERY_FIXED_QUESTIONS[0].key)
  const [flowError, setFlowError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pollControllersRef = useRef<Record<string, AbortController>>({})
  const messageRequestSeqRef = useRef<Record<string, number>>({})

  const activeSession = activeSessionId
    ? querySessions.find((session) => session.id === activeSessionId) ?? null
    : null
  const activeRun = activeSession
    ? runsBySession[activeSession.id] ?? activeSession.latest_query_run ?? null
    : null
  const activeMessages = activeSession ? messagesBySession[activeSession.id] ?? EMPTY_MESSAGES : EMPTY_MESSAGES
  const activeRunBusy = activeRun ? activeRun.status === 'pending' || activeRun.status === 'running' : false

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [activeMessages.length, activeRun?.id, activeRun?.status, activeSessionId])

  useEffect(() => {
    let active = true

    async function bootstrap() {
      if (!projectId) {
        setLoadingSessions(false)
        return
      }

      setLoadingSessions(true)
      setFlowError(null)

      try {
        const { data } = await chatService.listByProject(projectId)
        if (!active) return
        setProjectSessions(projectId, data)
      } catch {
        if (!active) return
        setFlowError('Não foi possível carregar as sessões de consulta agora.')
      } finally {
        if (active) setLoadingSessions(false)
      }
    }

    void bootstrap()
    return () => {
      active = false
    }
  }, [projectId, setProjectSessions])

  useEffect(() => {
    return () => {
      Object.values(pollControllersRef.current).forEach((controller) => controller.abort())
      pollControllersRef.current = {}
    }
  }, [])

  useEffect(() => {
    if (!projectId) return

    async function loadSessionMessages(sessionId: string) {
      const nextSeq = (messageRequestSeqRef.current[sessionId] ?? 0) + 1
      messageRequestSeqRef.current[sessionId] = nextSeq
      setLoadingMessagesForSession(sessionId)

      try {
        const { data } = await chatService.listMessages(sessionId)
        if (messageRequestSeqRef.current[sessionId] !== nextSeq) return
        setSessionMessages(sessionId, data)
      } catch {
        if (messageRequestSeqRef.current[sessionId] !== nextSeq) return
        setFlowError('Não foi possível carregar o histórico desta sessão.')
      } finally {
        if (messageRequestSeqRef.current[sessionId] === nextSeq) {
          setLoadingMessagesForSession((current) => (current === sessionId ? null : current))
        }
      }
    }

    if (activeSessionId) {
      void loadSessionMessages(activeSessionId)
    }
  }, [activeSessionId, projectId, setSessionMessages])

  useEffect(() => {
    if (!projectId) return

    querySessions.forEach((session) => {
      const run = runsBySession[session.id] ?? session.latest_query_run ?? null
      if (!run || (run.status !== 'pending' && run.status !== 'running')) return
      if (pollControllersRef.current[run.id]) return

      const controller = new AbortController()
      pollControllersRef.current[run.id] = controller

      const poll = async () => {
        try {
          const { data } = await chatService.getQueryRun(run.id, controller.signal)
          if (controller.signal.aborted) return

          setSessionRun(session.id, data)

          if (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled') {
            delete pollControllersRef.current[run.id]
            const { data: messages } = await chatService.listMessages(session.id, controller.signal)
            if (controller.signal.aborted) return
            setSessionMessages(session.id, messages)
            return
          }

          window.setTimeout(() => {
            void poll()
          }, 900)
        } catch {
          if (controller.signal.aborted) return
          window.setTimeout(() => {
            void poll()
          }, 1400)
        }
      }

      void poll()
    })
  }, [projectId, querySessions, runsBySession, setSessionMessages, setSessionRun])

  async function handleSubmitQuestion() {
    if (!projectId || submitting) return

    const question = QUERY_FIXED_QUESTIONS.find((item) => item.key === selectedQuestionKey)
    if (!question) return

    if (activeSession && activeRunBusy) return

    setSubmitting(true)
    setFlowError(null)

    try {
      const { data } = await chatService.startQueryRun(projectId, {
        session_id: activeSession?.id ?? null,
        question_key: question.key,
        question_text: question.label,
      })

      upsertSession(projectId, data.session)
      appendSessionMessages(data.session.id, [data.question_message])
      setSessionRun(data.session.id, data.run)
      setActiveSession(projectId, data.session.id)
    } catch (error) {
      const detail = (error as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail
      setFlowError(detail ?? 'Não foi possível iniciar a consulta agora.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCancelRun() {
    if (!activeRun || !activeSession || !activeRunBusy) return

    try {
      pollControllersRef.current[activeRun.id]?.abort()
      delete pollControllersRef.current[activeRun.id]

      const { data } = await chatService.cancelQueryRun(activeRun.id)
      setSessionRun(activeSession.id, data.run)
      if (data.cancellation_message) {
        appendSessionMessages(activeSession.id, [data.cancellation_message])
      }
    } catch {
      setFlowError('Não foi possível cancelar a consulta em andamento.')
    }
  }

  const conversationItems = useMemo<QueryConversationMessageItem[]>(() => {
    if (!activeSession) return []

    const items = activeMessages.map<QueryConversationMessageItem>((message) => {
      const isCurrentQuestion = activeRun?.question_message_id === message.id
      const state: QueryConversationMessageItem['state'] =
        message.message_type === 'query_error'
          ? 'error'
          : message.message_type === 'query_cancelled'
          ? 'cancelled'
          : isCurrentQuestion && activeRunBusy
          ? 'sending'
          : 'default'

      return {
        id: message.id,
        sender: message.sender,
        content: message.content,
        messageType: message.message_type,
        metadata: message.metadata,
        state,
      }
    })

    if (activeRunBusy) {
      items.push({
        id: `${activeRun?.id}-pending`,
        sender: 'assistant',
        content: '',
        messageType: 'query_pending',
        metadata: {
          question_key: activeRun?.question_key,
          run_id: activeRun?.id,
        },
        state: 'pending',
      })
    }

    return items
  }, [activeMessages, activeRun, activeRunBusy, activeSession])

  const dynamicPanelSections: SidePanelSection[] = [
    {
      title: 'Sessão ativa',
      content: (
        <div className="space-y-4 text-xs text-white/56">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Projeto</p>
            <p className="mt-2 text-white/78">{projectName ?? 'Projeto atual'}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Sessão</p>
            <p className="mt-2 text-white/78">{activeSession?.title ?? 'Nova consulta'}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Status</p>
              <p className="mt-2 text-white/76">{getRunLabel(activeRun?.status ?? null)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Atualizado</p>
              <p className="mt-2 text-white/76">{formatSessionDate(activeSession?.updated_at)}</p>
            </div>
          </div>
        </div>
      ),
    },
    ...QUERY_PANEL_SECTIONS,
  ]

  if (!projectId) {
    return (
      <section className="chat-card-enter relative flex h-full min-h-0 flex-1 flex-col rounded-[5px] border border-white/7 bg-[linear-gradient(180deg,rgba(19,22,30,0.88),rgba(13,15,20,0.88))] backdrop-blur-xl">
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold tracking-[0.18em] text-accent-indigo/80 uppercase">Projeto necessário</p>
            <p className="mt-4 text-lg font-semibold text-white/88">Selecione um projeto antes de iniciar consultas.</p>
            <p className="mt-2 text-sm leading-6 text-white/54">A consulta usa o projeto atual para recuperar sessões, mensagens e contexto indexado no backend.</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="chat-card-enter relative flex h-full min-h-0 flex-1 flex-col rounded-[5px] border border-white/7 bg-[linear-gradient(180deg,rgba(19,22,30,0.88),rgba(13,15,20,0.88))] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4 border-b border-white/6 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-[0.18em] text-white/28 uppercase">Modo consulta</p>
            <h2 className="mt-1 truncate text-[16px] font-semibold text-white/90">
              {activeSession?.title ?? 'Nova consulta'}
            </h2>
            <p className="mt-1 text-[12px] text-white/38">
              {activeSession
                ? `${conversationItems.length} mensagens · ${getRunLabel(activeRun?.status ?? null)}`
                : 'Escolha uma pergunta fixa para abrir uma nova sessão persistida.'}
            </p>
          </div>

          {activeRunBusy ? (
            <button
              type="button"
              onClick={() => { void handleCancelRun() }}
              className="shrink-0 rounded-[12px] border border-rose-400/20 bg-rose-400/8 px-3.5 py-2 text-[11px] font-semibold tracking-[0.12em] text-rose-200 uppercase transition-[border-color,background-color,color] duration-150 hover:border-rose-300/36 hover:bg-rose-400/14"
            >
              Parar
            </button>
          ) : null}
        </div>

        <div ref={scrollRef} className="chat-scroll flex-1 min-h-0 space-y-6 overflow-y-auto px-4 py-5 sm:px-5">
          {loadingSessions ? (
            <div className="rounded-[22px] border border-white/8 bg-surface-container/72 px-5 py-5 text-sm text-white/48">
              Carregando sessões de consulta...
            </div>
          ) : conversationItems.length > 0 ? (
            conversationItems.map((message) => (
              <QueryConversationMessage
                key={message.id}
                message={message}
                userInitials={userInitials}
              />
            ))
          ) : (
            <div className="rounded-[22px] border border-dashed border-white/8 bg-surface-container/52 px-5 py-5">
              <p className="text-[10px] font-semibold tracking-[0.18em] text-white/28 uppercase">Consulta guiada</p>
              <p className="mt-3 text-[15px] leading-8 text-white/76">
                Selecione uma das perguntas fixas abaixo para abrir uma sessão de consulta. O histórico ficará salvo por projeto e poderá ser retomado depois pelo menu esquerdo.
              </p>
            </div>
          )}

          {loadingMessagesForSession === activeSessionId && activeSessionId ? (
            <div className="rounded-[20px] border border-white/8 bg-surface-container/72 px-4 py-4 text-sm text-white/44">
              Carregando histórico desta sessão...
            </div>
          ) : null}
        </div>

        <div className="mt-auto border-t border-white/6 px-3 py-3 sm:px-4">
          <div className="rounded-3xl border border-white/8 bg-surface-container/86 p-3 shadow-[0_16px_42px_rgba(0,0,0,0.24)]">
            <div className="flex flex-col gap-3">
              {flowError ? (
                <div className="rounded-[14px] border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-[12px] text-rose-100">
                  {flowError}
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
                <label className="flex min-w-0 flex-col gap-2">
                  <span className="text-[10px] font-semibold tracking-[0.18em] text-white/28 uppercase">Pergunta fixa</span>
                  <select
                    value={selectedQuestionKey}
                    onChange={(event) => setSelectedQuestionKey(event.target.value)}
                    disabled={activeRunBusy || submitting}
                    className="h-12 rounded-[18px] border border-white/8 bg-surface-base/88 px-4 text-sm text-white/88 outline-none transition-[border-color,box-shadow] duration-150 focus:border-accent-indigo/38 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {QUERY_FIXED_QUESTIONS.map((question) => (
                      <option key={question.key} value={question.key}>
                        {question.label}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={() => { void handleSubmitQuestion() }}
                  disabled={submitting || activeRunBusy}
                  className="h-12 shrink-0 rounded-[18px] bg-linear-to-r from-accent-indigo to-accent-violet px-5 text-xs font-semibold tracking-[0.18em] text-white uppercase transition-[filter,transform,opacity] duration-150 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {submitting ? 'Enviando...' : 'Perguntar'}
                </button>
              </div>

              <p className="px-1 text-[11px] leading-5 text-white/34">
                {QUERY_FIXED_QUESTIONS.find((item) => item.key === selectedQuestionKey)?.helper}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div
        className={[
          'chat-card-enter-delay hidden xl:flex h-full min-h-0 shrink-0 flex-col overflow-hidden rounded-[5px] border border-white/8 bg-surface-container/86 backdrop-blur-xl',
          'transition-[width] duration-220 ease-in-out',
          isPanelOpen ? 'w-[288px]' : 'w-10',
        ].join(' ')}
      >
        {isPanelOpen ? (
          <SidePanel
            sections={dynamicPanelSections}
            onClose={() => onTogglePanel(false)}
            label="Contexto da sessão"
          />
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
