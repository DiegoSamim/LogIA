import type { TaskDTO, TaskStatus } from '@/data/dtos'

export interface ChatMessageViewModel {
  id: string
  sender: 'assistant' | 'user'
  content: string
  tone: 'standard' | 'highlight'
  suggestions?: string[]
  references?: string[]
  orderedItems?: string[]
}

export interface SidePanelSection {
  title: string
  content: React.ReactNode
}

export interface ProjectQuestion {
  field: 'name' | 'description' | 'stack' | 'repository_url' | 'goal' | 'scope'
  question: string
  placeholder: string
  required: boolean
  hint?: string
}

export interface ProjectDraft {
  name: string
  description: string
  stack: string[]
  repository_url: string
  goal: string
  scope: string
}

export type TaskRegisterAction = 'create' | 'update'

export type TaskRegisterPhase =
  | 'loading'
  | 'choose-action'
  | 'pick-task'
  | 'questions'
  | 'summary'
  | 'saving'
  | 'done'
  | 'error'

export type TaskRegisterQuestionField = 'taskTitle' | 'summary' | 'newStatus'

export interface TaskRegisterQuestion {
  field: TaskRegisterQuestionField
  question: string
  placeholder: string
}

export interface TaskRegisterDraft {
  action: TaskRegisterAction | null
  taskId: string | null
  taskTitle: string
  currentStatus: TaskStatus | null
  newStatus: TaskStatus | null
  summary: string
}

export interface TaskSummaryViewModel {
  title: string
  statusLabel: string
  summaryLabel: string
  summaryValue: string
  actionLabel: string
  taskName?: string
}

export interface TaskRegisterProgressItem {
  id: string
  label: string
  done: boolean
  active: boolean
}

export interface TaskRegisterFlowProps {
  projectId: string | null
  projectName: string | null
  userInitials: string
  isPanelOpen: boolean
  onTogglePanel: (open: boolean) => void
}

export interface NewProjectFlowProps {
  userInitials: string
  isPanelOpen: boolean
  onTogglePanel: (open: boolean) => void
}

export interface RegularChatFlowProps {
  userInitials: string
  isPanelOpen: boolean
  onTogglePanel: (open: boolean) => void
}

export type TaskLookup = Pick<TaskDTO, 'id' | 'title' | 'status'>
