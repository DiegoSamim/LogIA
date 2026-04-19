import api from './api'
import type {
  CancelQueryRunResponse,
  ChatMessageDTO,
  ChatSessionDTO,
  CreateChatMessageRequest,
  CreateChatSessionRequest,
  QueryRunDTO,
  StartQueryRunRequest,
  StartQueryRunResponse,
} from '@/data/dtos'

export const chatService = {
  listByProject: (projectId: string) =>
    api.get<ChatSessionDTO[]>(`/projects/${projectId}/sessions`),
  createSession: (projectId: string, data: CreateChatSessionRequest) =>
    api.post<ChatSessionDTO>(`/projects/${projectId}/sessions`, data),
  listMessages: (sessionId: string, signal?: AbortSignal) =>
    api.get<ChatMessageDTO[]>(`/sessions/${sessionId}/messages`, { signal }),
  addMessage: (sessionId: string, data: CreateChatMessageRequest) =>
    api.post<ChatMessageDTO>(`/sessions/${sessionId}/messages`, data),
  finishSession: (sessionId: string) =>
    api.patch<ChatSessionDTO>(`/sessions/${sessionId}/finish`),
  startQueryRun: (projectId: string, data: StartQueryRunRequest) =>
    api.post<StartQueryRunResponse>(`/projects/${projectId}/query-runs`, data),
  getQueryRun: (runId: string, signal?: AbortSignal) =>
    api.get<QueryRunDTO>(`/query-runs/${runId}`, { signal }),
  cancelQueryRun: (runId: string) =>
    api.post<CancelQueryRunResponse>(`/query-runs/${runId}/cancel`),
}
