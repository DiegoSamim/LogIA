import { useEffect, useMemo, useRef, useState } from 'react'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import type { ChatMessageDTO, ChatSessionDTO } from '@/data/dtos'
import { QUERY_FIXED_QUESTIONS } from '@/pages/Chat/constants'
import type { RegularChatFlowProps } from '@/pages/Chat/types'
import QueryConversationMessage, { type QueryConversationMessageItem } from '@/components/chat/QueryConversationMessage'
import QueryContextPanel from '@/components/chat/QueryContextPanel'
import { chatService } from '@/services/chat.service'
import { useQuerySessionsStore } from '@/store/useQuerySessionsStore'

const EMPTY_QUERY_SESSIONS: ChatSessionDTO[] = []
const EMPTY_MESSAGES: ChatMessageDTO[] = []

export default function RegularChatFlow({
  projectId,
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
  const selectedQuestion = QUERY_FIXED_QUESTIONS.find((item) => item.key === selectedQuestionKey) ?? QUERY_FIXED_QUESTIONS[0]

  const activeSession = activeSessionId
    ? querySessions.find((session) => session.id === activeSessionId) ?? null
    : null
  const activeRun = activeSession
    ? runsBySession[activeSession.id] ?? activeSession.latest_query_run ?? null
    : null
  const activeMessages = activeSession ? messagesBySession[activeSession.id] ?? EMPTY_MESSAGES : EMPTY_MESSAGES
  const activeRunBusy = activeRun ? activeRun.status === 'pending' || activeRun.status === 'running' : false
  const latestAnswerMessage = [...activeMessages]
    .reverse()
    .find((message) => message.message_type === 'query_answer')
  const latestPanelPayload = latestAnswerMessage?.metadata?.panel_payload ?? null
  const latestAnswerPayload = latestAnswerMessage?.metadata?.answer_payload ?? null
  const latestReferences = latestAnswerMessage?.metadata?.references ?? null

  useEffect(() => {
    const questionKey =
      (latestAnswerMessage?.metadata?.question_key as string | null | undefined) ??
      activeRun?.question_key
    if (questionKey && QUERY_FIXED_QUESTIONS.some((q) => q.key === questionKey)) {
      setSelectedQuestionKey(questionKey)
    }
  }, [activeSessionId, latestAnswerMessage?.id, activeRun?.id])

  useEffect(() => {
    if (!latestAnswerMessage) return

    const metadata = latestAnswerMessage.metadata
    const answerSource = metadata?.answer_source ?? 'unknown'
    const aiUsed = metadata?.ai_used === true

    console.log('[LogIA Query] resposta recebida', {
      messageId: latestAnswerMessage.id,
      questionKey: metadata?.question_key,
      answerSource,
      aiUsed,
      aiTrace: metadata?.ai_trace,
      hasAnswerPayload: Boolean(metadata?.answer_payload),
      hasPanelPayload: Boolean(metadata?.panel_payload),
      references: Array.isArray(metadata?.references) ? metadata.references.length : 0,
    })
  }, [latestAnswerMessage])

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
                <div className="flex min-w-0 flex-col gap-2">
                  <span className="text-[10px] font-semibold tracking-[0.18em] text-white/28 uppercase">Pergunta fixa</span>
                  <Autocomplete
                    disableClearable
                    options={QUERY_FIXED_QUESTIONS}
                    value={selectedQuestion}
                    getOptionLabel={(option) => option.label}
                    isOptionEqualToValue={(option, value) => option.key === value.key}
                    onChange={(_, nextQuestion) => {
                      if (nextQuestion) {
                        setSelectedQuestionKey(nextQuestion.key)
                      }
                    }}
                    disabled={activeRunBusy || submitting}
                    size="small"
                    popupIcon={null}
                    slotProps={{
                      paper: {
                        sx: {
                          mt: 1,
                          borderRadius: '16px',
                          border: '1px solid rgba(255,255,255,0.08)',
                          background: 'linear-gradient(180deg,rgba(19,22,30,0.98),rgba(13,15,20,0.98))',
                          boxShadow: '0 18px 48px rgba(0,0,0,0.45)',
                          color: 'rgba(255,255,255,0.88)',
                          overflow: 'hidden',
                        },
                      },
                      popper: {
                        sx: {
                          '& .MuiAutocomplete-listbox': {
                            p: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                          },
                          '& .MuiAutocomplete-option': {
                            minHeight: 'unset',
                            borderRadius: '12px',
                            px: 1.5,
                            py: 1.25,
                            fontSize: '0.875rem',
                            color: 'rgba(255,255,255,0.72)',
                            '&[aria-selected="true"]': {
                              backgroundColor: 'rgba(99,102,241,0.14)',
                              color: 'rgba(255,255,255,0.94)',
                            },
                            '&.Mui-focused': {
                              backgroundColor: 'rgba(255,255,255,0.05)',
                            },
                            '&[aria-selected="true"].Mui-focused': {
                              backgroundColor: 'rgba(99,102,241,0.18)',
                            },
                          },
                        },
                      },
                      clearIndicator: {
                        sx: {
                          color: 'rgba(255,255,255,0.34)',
                          '&:hover': { color: 'rgba(255,255,255,0.72)' },
                        },
                      },
                    }}
                    renderOption={(props, option) => (
                      <li {...props}>
                        <div className="flex min-w-0 items-start gap-2.5">
                          <span
                            className="mt-[6px] h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: option.color }}
                            aria-hidden="true"
                          />
                          <div className="min-w-0">
                            <p className="text-sm text-white/84">{option.label}</p>
                            <p className="mt-0.5 text-[11px] leading-5 text-white/42">{option.helper}</p>
                          </div>
                        </div>
                      </li>
                    )}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Selecione uma pergunta"
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            alignItems: 'center',
                            minHeight: '48px',
                            borderRadius: '18px',
                            backgroundColor: 'rgba(13,15,20,0.88)',
                            color: 'rgba(255,255,255,0.86)',
                            px: '6px',
                            py: '4px',
                            '& fieldset': {
                              borderColor: 'rgba(255,255,255,0.08)',
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(255,255,255,0.14)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: 'rgba(99,102,241,0.38)',
                              boxShadow: '0 0 0 3px rgba(99,102,241,0.12)',
                            },
                            '&.Mui-disabled': {
                              opacity: 0.6,
                              cursor: 'not-allowed',
                            },
                          },
                          '& .MuiOutlinedInput-input': {
                            color: 'rgba(255,255,255,0.86)',
                            fontSize: '0.875rem',
                            py: '9px',
                          },
                          '& .MuiOutlinedInput-input::placeholder': {
                            color: 'rgba(255,255,255,0.24)',
                            opacity: 1,
                          },
                        }}
                      />
                    )}
                  >
                  </Autocomplete>
                </div>

                <div className="flex shrink-0 flex-col gap-2">
                  <span className="text-[10px] font-semibold tracking-[0.18em] text-transparent uppercase select-none">_</span>
                  <div className="flex gap-2">
                    {activeRunBusy && (
                      <button
                        type="button"
                        onClick={() => { void handleCancelRun() }}
                        className="h-12 rounded-[18px] border border-rose-400/20 bg-rose-400/8 px-4 text-[11px] font-semibold tracking-[0.12em] text-rose-200 uppercase transition-[border-color,background-color,color] duration-150 hover:border-rose-300/36 hover:bg-rose-400/14"
                      >
                        Parar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => { void handleSubmitQuestion() }}
                      disabled={submitting || activeRunBusy}
                      className="h-12 rounded-[18px] bg-linear-to-r from-accent-indigo to-accent-violet px-5 text-xs font-semibold tracking-[0.18em] text-white uppercase transition-[filter,transform,opacity] duration-150 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {submitting ? 'Enviando...' : 'Perguntar'}
                    </button>
                  </div>
                </div>
              </div>
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
          <QueryContextPanel
            selectedQuestion={selectedQuestion}
            activeRun={activeRun}
            activeRunBusy={activeRunBusy}
            panelPayload={latestPanelPayload}
            fallbackAnswerPayload={latestAnswerPayload}
            references={latestReferences}
            onClose={() => onTogglePanel(false)}
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
