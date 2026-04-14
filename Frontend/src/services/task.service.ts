import api from './api'
import type { CreateTaskRequest, TaskDTO, UpdateTaskRequest } from '@/data/dtos'

export const taskService = {
  listByProject: (projectId: string) => api.get<TaskDTO[]>(`/projects/${projectId}/tasks`),
  create: (projectId: string, data: CreateTaskRequest) =>
    api.post<TaskDTO>(`/projects/${projectId}/tasks`, data),
  update: (taskId: string, data: UpdateTaskRequest) =>
    api.put<TaskDTO>(`/tasks/${taskId}`, data),
}
