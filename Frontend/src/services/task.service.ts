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
  create: (projectId: string, data: CreateTaskRequest) =>
    api.post<TaskDTO>(`/projects/${projectId}/tasks`, data),
  update: (taskId: string, data: UpdateTaskRequest) =>
    api.put<TaskDTO>(`/tasks/${taskId}`, data),
  listUpdates: (taskId: string) => api.get<TaskUpdateDTO[]>(`/tasks/${taskId}/updates`),
  createUpdate: (taskId: string, data: CreateTaskUpdateRequest) =>
    api.post<TaskUpdateDTO>(`/tasks/${taskId}/updates`, data),
  createCheckpoints: (taskId: string, items: ChecklistItem[]) => {
    const payload: CreateCheckpointsBatchRequest = {
      items: items.map((item, i) => ({ description: item.description, order_index: i })),
    }
    return api.post<TaskCheckpointDTO[]>(`/tasks/${taskId}/checkpoints/batch`, payload)
  },
  uploadAttachment: (taskId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<TaskAttachmentDTO>(`/tasks/${taskId}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
