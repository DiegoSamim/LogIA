import type { TaskCategory, TaskPriority, TaskStatus } from '@/data/dtos'

export type TaskTimeFilter = 'all' | 'today' | '7d' | '30d'

export interface TaskFilterState {
  statuses: TaskStatus[]
  categories: TaskCategory[]
  priorities: TaskPriority[]
  stacks: string[]
  dateFrom: string
  dateTo: string
}

export const EMPTY_TASK_FILTERS: TaskFilterState = {
  statuses: [],
  categories: [],
  priorities: [],
  stacks: [],
  dateFrom: '',
  dateTo: '',
}

export function formatRelativeDate(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  const hours = Math.floor(diffMs / 3600000)
  const days = Math.floor(diffMs / 86400000)

  if (mins < 1) return 'Agora mesmo'
  if (mins < 60) return `Há ${mins} min`
  if (hours < 24) return hours === 1 ? 'Há 1 hora' : `Há ${hours} horas`
  if (days === 1) return 'Há 1 dia'
  if (days < 7) return `Há ${days} dias`
  if (days < 30) return `Há ${Math.floor(days / 7)} semanas`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatAbsoluteDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
