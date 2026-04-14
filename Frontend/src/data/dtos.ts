/**
 * dtos.ts — Interfaces TypeScript derivadas do schema do banco de dados (docs/database.md)
 *
 * Convenções:
 *   // source: table.column  → campo vem direto da coluna indicada
 *   // computed: expr        → campo calculado no backend (JOIN / COUNT / MAX)
 *   // joined: table         → campo incluído via JOIN, não existe na tabela raiz
 *
 * Enums seguem exatamente os valores definidos no banco (inglês, snake_case).
 */

// ── Enums ───────────────────────────────────────────────────────────────────

/** tasks.status */
export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked' | 'cancelled'

/** tasks.category */
export type TaskCategory =
  | 'feature'
  | 'bug_fix'
  | 'refactor'
  | 'test'
  | 'ui_ux'
  | 'docs'
  | 'infra'
  | 'research'

/** task_updates.update_type */
export type UpdateType =
  | 'created'
  | 'progress'
  | 'status_change'
  | 'completion'
  | 'blocker'
  | 'edit'

/** chat_sessions.mode */
export type ChatMode = 'register' | 'query'

/** chat_messages.sender */
export type Sender = 'user' | 'assistant' | 'system'

/** chat_sessions.status */
export type SessionStatus = 'active' | 'finished' | 'abandoned'

// ── User ────────────────────────────────────────────────────────────────────

/**
 * DTO da tabela `users`.
 * Campos sensíveis (password_hash) nunca retornam na API — omitidos aqui.
 */
export interface UserDTO {
  id: string            // source: users.id
  name: string          // source: users.name
  email: string         // source: users.email
  avatar_url: string | null  // source: users.avatar_url
  is_active: boolean    // source: users.is_active
  created_at: string    // source: users.created_at
}

// ── Project ─────────────────────────────────────────────────────────────────

/**
 * DTO de listagem de projetos.
 * Combina `projects` + campos agregados de `project_profiles`, `chat_sessions` e `tasks`.
 * Usado nos cards da página /projects.
 */
export interface ProjectDTO {
  id: string                    // source: projects.id
  name: string                  // source: projects.name
  description: string           // source: projects.description
  status: string                // source: projects.status
  color: string                 // source: projects.color
  repository_url: string | null // source: projects.repository_url
  stack: string[]               // computed: project_profiles.main_stack (JOIN 1:1)
  last_session_at: string | null // computed: MAX(chat_sessions.started_at) WHERE project_id
  task_count: number            // computed: COUNT(tasks) WHERE project_id
  done_count: number            // computed: COUNT(tasks) WHERE project_id AND status='done'
  created_at: string            // source: projects.created_at
}

/**
 * DTO completo de `project_profiles`.
 * Relação 1:1 com projects. Armazena o contexto expandido do projeto.
 */
export interface ProjectProfileDTO {
  id: string                         // source: project_profiles.id
  project_id: string                 // source: project_profiles.project_id
  summary: string | null             // source: project_profiles.summary
  goal: string | null                // source: project_profiles.goal
  scope: string | null               // source: project_profiles.scope
  main_stack: string[]               // source: project_profiles.main_stack (TEXT[])
  architecture_summary: string | null // source: project_profiles.architecture_summary
  product_context: string | null     // source: project_profiles.product_context
  business_rules: string | null      // source: project_profiles.business_rules
  team_context: string | null        // source: project_profiles.team_context
  default_language: string | null    // source: project_profiles.default_language
  documentation_url: string | null   // source: project_profiles.documentation_url
  figma_url: string | null           // source: project_profiles.figma_url
  board_url: string | null           // source: project_profiles.board_url
  api_base_url: string | null        // source: project_profiles.api_base_url
  deployment_url: string | null      // source: project_profiles.deployment_url
  created_at: string                 // source: project_profiles.created_at
}

/**
 * DTO de membro de projeto.
 * Junta `project_members` + dados básicos do usuário.
 */
export interface ProjectMemberDTO {
  id: string          // source: project_members.id
  user_id: string     // source: project_members.user_id
  project_id: string  // source: project_members.project_id
  role: string        // source: project_members.role
  created_at: string  // source: project_members.created_at
  user: UserDTO       // joined: users (via user_id)
}

/**
 * DTO de detalhe completo do projeto.
 * Usado na página Sobre — inclui profile e membros.
 */
export interface ProjectDetailDTO extends ProjectDTO {
  profile: ProjectProfileDTO | null  // joined: project_profiles (1:1)
  members: ProjectMemberDTO[]        // joined: project_members + users
}

// ── Task ────────────────────────────────────────────────────────────────────

/**
 * DTO completo da tabela `tasks`.
 */
export interface TaskDTO {
  id: string                          // source: tasks.id
  project_id: string                  // source: tasks.project_id
  created_by: string                  // source: tasks.created_by
  title: string                       // source: tasks.title
  feature_or_ticket: string | null    // source: tasks.feature_or_ticket
  what_was_done: string | null        // source: tasks.what_was_done
  technical_approach: string | null   // source: tasks.technical_approach
  category: TaskCategory              // source: tasks.category
  status: TaskStatus                  // source: tasks.status
  priority: string | null             // source: tasks.priority
  blocked_reason: string | null       // source: tasks.blocked_reason
  next_steps: string | null           // source: tasks.next_steps
  people_involved: string | null      // source: tasks.people_involved
  tags: string[]                      // source: tasks.tags (TEXT[])
  started_at: string | null           // source: tasks.started_at
  completed_at: string | null         // source: tasks.completed_at
  created_at: string                  // source: tasks.created_at
  updated_at: string                  // source: tasks.updated_at
}

/**
 * DTO de atualização de tarefa (`task_updates`).
 * Representa uma entrada no histórico evolutivo de uma tarefa.
 */
export interface TaskUpdateDTO {
  id: string                  // source: task_updates.id
  task_id: string             // source: task_updates.task_id
  created_by: string          // source: task_updates.created_by
  update_type: UpdateType     // source: task_updates.update_type
  summary: string | null      // source: task_updates.summary
  details: string | null      // source: task_updates.details
  old_status: string | null   // source: task_updates.old_status
  new_status: string | null   // source: task_updates.new_status
  created_at: string          // source: task_updates.created_at
}

/**
 * DTO de checkpoint de tarefa (`task_checkpoints`).
 * Item individual do checklist interno de uma tarefa.
 */
export interface TaskCheckpointDTO {
  id: string           // source: task_checkpoints.id
  task_id: string      // source: task_checkpoints.task_id
  description: string  // source: task_checkpoints.description
  is_done: boolean     // source: task_checkpoints.is_done
  order_index: number  // source: task_checkpoints.order_index
  created_at: string   // source: task_checkpoints.created_at
  updated_at: string   // source: task_checkpoints.updated_at
}

export interface CreateTaskRequest {
  title: string
  feature_or_ticket?: string | null
  what_was_done?: string | null
  technical_approach?: string | null
  category?: TaskCategory
  status?: TaskStatus
  priority?: string | null
  blocked_reason?: string | null
  next_steps?: string | null
  people_involved?: string | null
  tags?: string[]
  started_at?: string | null
  completed_at?: string | null
}

export interface UpdateTaskRequest {
  title?: string
  feature_or_ticket?: string | null
  what_was_done?: string | null
  technical_approach?: string | null
  category?: TaskCategory
  status?: TaskStatus
  priority?: string | null
  blocked_reason?: string | null
  next_steps?: string | null
  people_involved?: string | null
  tags?: string[] | null
  started_at?: string | null
  completed_at?: string | null
}

// ── Chat ────────────────────────────────────────────────────────────────────

/**
 * DTO de sessão de chat (`chat_sessions`).
 * Representa uma conversa completa no modo registro ou consulta.
 */
export interface ChatSessionDTO {
  id: string                  // source: chat_sessions.id
  user_id: string             // source: chat_sessions.user_id
  project_id: string          // source: chat_sessions.project_id
  mode: ChatMode              // source: chat_sessions.mode
  title: string | null        // source: chat_sessions.title
  status: SessionStatus       // source: chat_sessions.status
  started_at: string          // source: chat_sessions.started_at
  ended_at: string | null     // source: chat_sessions.ended_at
  created_at: string          // source: chat_sessions.created_at
  updated_at: string          // source: chat_sessions.updated_at
}

/**
 * DTO de mensagem de chat (`chat_messages`).
 * Representa uma mensagem dentro de uma ChatSession.
 */
export interface ChatMessageDTO {
  id: string                              // source: chat_messages.id
  session_id: string                      // source: chat_messages.session_id
  sender: Sender                          // source: chat_messages.sender
  message_type: string                    // source: chat_messages.message_type
  content: string                         // source: chat_messages.content
  metadata: Record<string, unknown> | null // source: chat_messages.metadata (JSONB)
  created_at: string                      // source: chat_messages.created_at
}

export interface CreateChatSessionRequest {
  mode: ChatMode
  title?: string | null
}

export interface CreateChatMessageRequest {
  sender: Sender
  message_type?: string
  content: string
  metadata?: Record<string, unknown> | null
}
