import api from './api'
import type {
  ChatMessageDTO,
  ChatSessionDTO,
  CreateChatMessageRequest,
  CreateChatSessionRequest,
} from '@/data/dtos'

export const chatService = {
  listByProject: (projectId: string) =>
    api.get<ChatSessionDTO[]>(`/projects/${projectId}/sessions`),
  createSession: (projectId: string, data: CreateChatSessionRequest) =>
    api.post<ChatSessionDTO>(`/projects/${projectId}/sessions`, data),
  listMessages: (sessionId: string) =>
    api.get<ChatMessageDTO[]>(`/sessions/${sessionId}/messages`),
  addMessage: (sessionId: string, data: CreateChatMessageRequest) =>
    api.post<ChatMessageDTO>(`/sessions/${sessionId}/messages`, data),
  finishSession: (sessionId: string) =>
    api.patch<ChatSessionDTO>(`/sessions/${sessionId}/finish`),
}
