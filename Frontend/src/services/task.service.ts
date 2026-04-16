import api from './api'
import type {
  CreateCheckpointsBatchRequest,
  CreateTaskRequest,
  CreateTaskUpdateRequest,
  TaskAttachmentDTO,
  TaskCheckpointDTO,
  TaskDTO,
  TaskUpdateDTO,
  UpdateTaskRequest,
} from '@/data/dtos'
import type { ChecklistItem } from '@/pages/Chat/types'

export const taskService = {
  listByProject: (projectId: string) => api.get<TaskDTO[]>(`/projects/${projectId}/tasks`),
  getById: (taskId: string) => api.get<TaskDTO>(`/tasks/${taskId}`),
  create: (projectId: string, data: CreateTaskRequest) =>
    api.post<TaskDTO>(`/projects/${projectId}/tasks`, data),
  update: (taskId: string, data: UpdateTaskRequest) =>
    api.put<TaskDTO>(`/tasks/${taskId}`, data),
  deleteTask: (taskId: string) => api.delete(`/tasks/${taskId}`),
  listUpdates: (taskId: string) => api.get<TaskUpdateDTO[]>(`/tasks/${taskId}/updates`),
  createUpdate: (taskId: string, data: CreateTaskUpdateRequest) =>
    api.post<TaskUpdateDTO>(`/tasks/${taskId}/updates`, data),
  listCheckpoints: (taskId: string) =>
    api.get<TaskCheckpointDTO[]>(`/tasks/${taskId}/checkpoints`),
  toggleCheckpoint: (taskId: string, checkpointId: string, is_done: boolean) =>
    api.patch<TaskCheckpointDTO>(`/tasks/${taskId}/checkpoints/${checkpointId}`, { is_done }),
  createCheckpoints: (taskId: string, items: ChecklistItem[]) => {
    const payload: CreateCheckpointsBatchRequest = {
      items: items.map((item, i) => ({ description: item.description, order_index: i })),
    }
    return api.post<TaskCheckpointDTO[]>(`/tasks/${taskId}/checkpoints/batch`, payload)
  },
  listAttachments: (taskId: string) =>
    api.get<TaskAttachmentDTO[]>(`/tasks/${taskId}/attachments`),
  uploadAttachment: (taskId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<TaskAttachmentDTO>(`/tasks/${taskId}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  deleteAttachment: (taskId: string, attachmentId: string) =>
    api.delete(`/tasks/${taskId}/attachments/${attachmentId}`),
}
