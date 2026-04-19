import type {
  ChatMessageDTO,
  ChatSessionDTO,
  ProjectMemberDTO,
  QueryRunDTO,
  TaskCategory,
  TaskDTO,
  TaskPriority,
  TaskStatus,
  TaskUpdateDTO,
  UpdateType,
} from '@/data/dtos'

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

export interface QueryQuestionOption {
  key: string
  label: string
  helper: string
  color: string
}

export type QuerySessionVisualState = 'idle' | 'loading' | 'receiving' | 'error' | 'cancelled'

export interface QuerySessionState {
  session: ChatSessionDTO
  run: QueryRunDTO | null
  messages: ChatMessageDTO[]
  visualState: QuerySessionVisualState
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
  | 'attachments'
  | 'done'
  | 'error'

export type TaskRegisterQuestionField =
  | 'title'
  | 'category'
  | 'status'
  | 'priority'
  | 'feature_or_ticket'
  | 'task_summary'
  | 'update_summary'
  | 'update_task_summary'
  | 'technical_approach'
  | 'next_steps'
  | 'blocked_reason'
  | 'people_involved'
  | 'tags'
  | 'checkpoints'
  | 'hours_worked'

export interface ChecklistItem {
  description: string
}

export interface AttachmentUploadState {
  id: string
  file: File
  name: string
  type: 'pdf' | 'image'
  size: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  url?: string
}

export interface EnumChipOption {
  value: string
  label: string
  /** Tailwind classes for the chip: text, bg, border colors */
  colorClass: string
}

export interface TaskRegisterQuestion {
  field: TaskRegisterQuestionField
  question: string
  placeholder?: string
  required?: boolean
  inputType: 'text' | 'textarea' | 'enum-single' | 'tags' | 'checklist' | 'member-multi'
  enumOptions?: EnumChipOption[]
  /** If present, only show this question when condition returns true */
  condition?: (draft: TaskRegisterDraft) => boolean
}

export interface TaskRegisterDraft {
  action: TaskRegisterAction | null
  taskId: string | null
  title: string
  category: TaskCategory | null
  status: TaskStatus | null
  priority: TaskPriority | null
  feature_or_ticket: string
  task_summary: string
  update_summary: string
  update_task_summary: 'yes' | 'no' | null
  technical_approach: string
  next_steps: string
  blocked_reason: string
  people_involved: string
  people_involved_member_ids: string[]
  tags: string[]
  checkpoints: ChecklistItem[]
  hours_worked: string
}

export interface TaskSummaryViewModel {
  actionLabel: string
  topFields: TaskSummaryField[]
  detailFields: TaskSummaryField[]
  skippedFields: string[]
}

export interface TaskSummaryField {
  label: string
  value: string | string[]
  compact?: boolean
  multiline?: boolean
  tone?: 'default' | 'strong' | 'muted'
  kind?: 'text' | 'tags'
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
  projectId: string | null
  projectName: string | null
  userInitials: string
  isPanelOpen: boolean
  onTogglePanel: (open: boolean) => void
}

export type TaskLookup = Pick<TaskDTO, 'id' | 'title' | 'status' | 'what_was_done' | 'hours_worked'>
export type ProjectMemberLookup = Pick<ProjectMemberDTO, 'id' | 'user_id' | 'role' | 'user'>

export type TaskUpdatePreview = Pick<TaskUpdateDTO, 'id' | 'summary' | 'new_status' | 'old_status' | 'created_at' | 'update_type'>

export interface BuiltTaskUpdatePayload {
  update_type: UpdateType
  summary: string | null
  details: string | null
  old_status: TaskStatus | null
  new_status: TaskStatus | null
}
