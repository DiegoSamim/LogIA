import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatMessageDTO, ChatSessionDTO, QueryRunDTO } from '@/data/dtos'

type QuerySyncEvent =
  | { type: 'set_active_session'; projectId: string; sessionId: string | null }
  | { type: 'set_project_sessions'; projectId: string; sessions: ChatSessionDTO[] }
  | { type: 'upsert_session'; projectId: string; session: ChatSessionDTO }
  | { type: 'remove_session'; projectId: string; sessionId: string }
  | { type: 'set_session_messages'; sessionId: string; messages: ChatMessageDTO[] }
  | { type: 'append_session_messages'; sessionId: string; messages: ChatMessageDTO[] }
  | { type: 'set_session_run'; sessionId: string; run: QueryRunDTO | null }
  | { type: 'reset_project_query'; projectId: string }

interface QueryStoreOptions {
  broadcast?: boolean
}

interface QuerySessionsState {
  activeSessionIdByProject: Record<string, string | null>
  sessionsByProject: Record<string, ChatSessionDTO[]>
  messagesBySession: Record<string, ChatMessageDTO[]>
  runsBySession: Record<string, QueryRunDTO | null>
  setActiveSession: (projectId: string, sessionId: string | null, options?: QueryStoreOptions) => void
  setProjectSessions: (projectId: string, sessions: ChatSessionDTO[], options?: QueryStoreOptions) => void
  upsertSession: (projectId: string, session: ChatSessionDTO, options?: QueryStoreOptions) => void
  removeSession: (projectId: string, sessionId: string, options?: QueryStoreOptions) => void
  setSessionMessages: (sessionId: string, messages: ChatMessageDTO[], options?: QueryStoreOptions) => void
  appendSessionMessages: (sessionId: string, messages: ChatMessageDTO[], options?: QueryStoreOptions) => void
  setSessionRun: (sessionId: string, run: QueryRunDTO | null, options?: QueryStoreOptions) => void
  resetProjectQuery: (projectId: string, options?: QueryStoreOptions) => void
}

const CHANNEL_NAME = 'logia-query-sessions'
let syncInitialized = false
let channel: BroadcastChannel | null = null

function getChannel() {
  if (typeof window === 'undefined') return null
  if (!('BroadcastChannel' in window)) return null
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME)
  return channel
}

function broadcast(event: QuerySyncEvent) {
  getChannel()?.postMessage(event)
}

function sortSessions(sessions: ChatSessionDTO[]) {
  return [...sessions].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
  )
}

function applyRunToSessions(
  sessionsByProject: Record<string, ChatSessionDTO[]>,
  sessionId: string,
  run: QueryRunDTO | null,
) {
  const next: Record<string, ChatSessionDTO[]> = {}

  Object.entries(sessionsByProject).forEach(([projectId, sessions]) => {
    next[projectId] = sessions.map((session) => (
      session.id === sessionId
        ? { ...session, latest_query_run: run }
        : session
    ))
  })

  return next
}

function mergeMessages(existing: ChatMessageDTO[], incoming: ChatMessageDTO[]) {
  const map = new Map(existing.map((message) => [message.id, message]))
  incoming.forEach((message) => {
    map.set(message.id, message)
  })
  return [...map.values()].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )
}

export const useQuerySessionsStore = create<QuerySessionsState>()(
  persist(
    (set) => ({
      activeSessionIdByProject: {},
      sessionsByProject: {},
      messagesBySession: {},
      runsBySession: {},
      setActiveSession: (projectId, sessionId, options) => {
        set((state) => ({
          activeSessionIdByProject: {
            ...state.activeSessionIdByProject,
            [projectId]: sessionId,
          },
        }))
        if (options?.broadcast !== false) {
          broadcast({ type: 'set_active_session', projectId, sessionId })
        }
      },
      setProjectSessions: (projectId, sessions, options) => {
        const querySessions = sortSessions(sessions.filter((session) => session.mode === 'query'))
        set((state) => {
          const nextRunsBySession = { ...state.runsBySession }
          querySessions.forEach((session) => {
            nextRunsBySession[session.id] = session.latest_query_run ?? nextRunsBySession[session.id] ?? null
          })

          const activeSessionId = state.activeSessionIdByProject[projectId]
          const activeStillExists = activeSessionId
            ? querySessions.some((session) => session.id === activeSessionId)
            : true

          return {
            sessionsByProject: {
              ...state.sessionsByProject,
              [projectId]: querySessions,
            },
            runsBySession: nextRunsBySession,
            activeSessionIdByProject: {
              ...state.activeSessionIdByProject,
              [projectId]: activeStillExists ? activeSessionId ?? null : null,
            },
          }
        })
        if (options?.broadcast !== false) {
          broadcast({ type: 'set_project_sessions', projectId, sessions: querySessions })
        }
      },
      upsertSession: (projectId, session, options) => {
        if (session.mode !== 'query') return
        set((state) => {
          const existing = state.sessionsByProject[projectId] ?? []
          const found = existing.some((item) => item.id === session.id)
          const nextSessions = sortSessions(
            found
              ? existing.map((item) => (item.id === session.id ? session : item))
              : [session, ...existing],
          )

          return {
            sessionsByProject: {
              ...state.sessionsByProject,
              [projectId]: nextSessions,
            },
            runsBySession: {
              ...state.runsBySession,
              [session.id]: session.latest_query_run ?? state.runsBySession[session.id] ?? null,
            },
          }
        })
        if (options?.broadcast !== false) {
          broadcast({ type: 'upsert_session', projectId, session })
        }
      },
      removeSession: (projectId, sessionId, options) => {
        set((state) => {
          const existing = state.sessionsByProject[projectId] ?? []
          const activeId = state.activeSessionIdByProject[projectId] ?? null
          return {
            sessionsByProject: {
              ...state.sessionsByProject,
              [projectId]: existing.filter((s) => s.id !== sessionId),
            },
            activeSessionIdByProject: {
              ...state.activeSessionIdByProject,
              [projectId]: activeId === sessionId ? null : activeId,
            },
          }
        })
        if (options?.broadcast !== false) {
          broadcast({ type: 'remove_session', projectId, sessionId })
        }
      },
      setSessionMessages: (sessionId, messages, options) => {
        set((state) => ({
          messagesBySession: {
            ...state.messagesBySession,
            [sessionId]: mergeMessages([], messages),
          },
        }))
        if (options?.broadcast !== false) {
          broadcast({ type: 'set_session_messages', sessionId, messages })
        }
      },
      appendSessionMessages: (sessionId, messages, options) => {
        set((state) => ({
          messagesBySession: {
            ...state.messagesBySession,
            [sessionId]: mergeMessages(state.messagesBySession[sessionId] ?? [], messages),
          },
        }))
        if (options?.broadcast !== false) {
          broadcast({ type: 'append_session_messages', sessionId, messages })
        }
      },
      setSessionRun: (sessionId, run, options) => {
        set((state) => ({
          runsBySession: {
            ...state.runsBySession,
            [sessionId]: run,
          },
          sessionsByProject: applyRunToSessions(state.sessionsByProject, sessionId, run),
        }))
        if (options?.broadcast !== false) {
          broadcast({ type: 'set_session_run', sessionId, run })
        }
      },
      resetProjectQuery: (projectId, options) => {
        set((state) => ({
          activeSessionIdByProject: {
            ...state.activeSessionIdByProject,
            [projectId]: null,
          },
        }))
        if (options?.broadcast !== false) {
          broadcast({ type: 'reset_project_query', projectId })
        }
      },
    }),
    {
      name: 'logia-query-sessions',
      partialize: (state) => ({
        activeSessionIdByProject: state.activeSessionIdByProject,
        sessionsByProject: state.sessionsByProject,
        messagesBySession: state.messagesBySession,
        runsBySession: state.runsBySession,
      }),
    },
  ),
)

function initializeSync() {
  if (syncInitialized || typeof window === 'undefined') return
  syncInitialized = true

  getChannel()?.addEventListener('message', (event: MessageEvent<QuerySyncEvent>) => {
    const payload = event.data
    if (!payload) return

    const state = useQuerySessionsStore.getState()
    switch (payload.type) {
      case 'set_active_session':
        state.setActiveSession(payload.projectId, payload.sessionId, { broadcast: false })
        break
      case 'set_project_sessions':
        state.setProjectSessions(payload.projectId, payload.sessions, { broadcast: false })
        break
      case 'upsert_session':
        state.upsertSession(payload.projectId, payload.session, { broadcast: false })
        break
      case 'remove_session':
        state.removeSession(payload.projectId, payload.sessionId, { broadcast: false })
        break
      case 'set_session_messages':
        state.setSessionMessages(payload.sessionId, payload.messages, { broadcast: false })
        break
      case 'append_session_messages':
        state.appendSessionMessages(payload.sessionId, payload.messages, { broadcast: false })
        break
      case 'set_session_run':
        state.setSessionRun(payload.sessionId, payload.run, { broadcast: false })
        break
      case 'reset_project_query':
        state.resetProjectQuery(payload.projectId, { broadcast: false })
        break
      default:
        break
    }
  })
}

initializeSync()
