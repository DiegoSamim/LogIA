# 📘 LogIA — Database Documentation

## 🧠 Overview

O LogIA é um sistema de **memória técnica para desenvolvedores**, baseado em:

- registro estruturado via chat
- histórico evolutivo de tarefas
- consulta inteligente via RAG (embeddings + LLM)

---

# 🧱 Entidades

---

## 👤 `users`
**Descrição:** Usuários do sistema (autenticação e identidade)

### Atributos
- `id (UUID)` → identificador único  
- `name (TEXT)` → nome do usuário  
- `email (TEXT UNIQUE)` → email único  
- `password_hash (TEXT)` → senha criptografada  
- `avatar_url (TEXT)` → URL da imagem  
- `is_active (BOOLEAN)` → status da conta  
- `created_at (TIMESTAMP)` → data de criação  
- `updated_at (TIMESTAMP)` → última atualização  

---

## 🔐 `refresh_tokens`
**Descrição:** Controle de sessão segura (JWT refresh)

### Atributos
- `id (UUID)` → identificador  
- `user_id (UUID)` → usuário dono do token  
- `token_hash (TEXT)` → hash do token  
- `expires_at (TIMESTAMP)` → expiração  
- `revoked_at (TIMESTAMP)` → revogação  
- `user_agent (TEXT)` → info do dispositivo  
- `ip_address (TEXT)` → IP  
- `created_at (TIMESTAMP)`  

---

## 📁 `projects`
**Descrição:** Projetos do usuário

### Atributos
- `id (UUID)`  
- `user_id (UUID)` → dono do projeto  
- `name (TEXT)` → nome  
- `description (TEXT)` → descrição  
- `repository_url (TEXT)`  
- `color (TEXT)`  
- `status (TEXT)`  
- `created_at (TIMESTAMP)`  
- `updated_at (TIMESTAMP)`  

---

## 📊 `project_profiles`
**Descrição:** Contexto expandido do projeto

### Atributos
- `id (UUID)`  
- `project_id (UUID)` → relação 1:1 com projeto  
- `summary (TEXT)` → resumo  
- `goal (TEXT)` → objetivo  
- `scope (TEXT)` → escopo  
- `main_stack (TEXT[])` → tecnologias  
- `architecture_summary (TEXT)`  
- `product_context (TEXT)`  
- `business_rules (TEXT)`  
- `team_context (TEXT)`  
- `default_language (TEXT)`  
- `documentation_url (TEXT)`  
- `figma_url (TEXT)`  
- `board_url (TEXT)`  
- `api_base_url (TEXT)`  
- `deployment_url (TEXT)`  
- `created_at (TIMESTAMP)`  

---

## 👥 `project_members`
**Descrição:** Relacionamento usuário ↔ projeto

### Atributos
- `id (UUID)`  
- `user_id (UUID)`  
- `project_id (UUID)`  
- `role (TEXT)` → papel no projeto  
- `created_at (TIMESTAMP)`  

---

## 🧩 `tasks`
**Descrição:** Tarefas registradas no sistema

### Atributos
- `id (UUID)`  
- `created_by (UUID)` → usuário criador  
- `project_id (UUID)`  
- `title (TEXT)`  
- `feature_or_ticket (TEXT)`  
- `what_was_done (TEXT)`  
- `technical_approach (TEXT)`  
- `category (TEXT)`  
- `status (TEXT)`  
- `priority (TEXT)`  
- `blocked_reason (TEXT)`  
- `next_steps (TEXT)`  
- `people_involved (TEXT)`  
- `tags (TEXT[])`  
- `started_at (TIMESTAMP)`  
- `completed_at (TIMESTAMP)`  
- `created_at (TIMESTAMP)`  
- `updated_at (TIMESTAMP)`  

---

## 🔄 `task_updates`
**Descrição:** Histórico de evolução das tarefas

### Atributos
- `id (UUID)`  
- `task_id (UUID)`  
- `created_by (UUID)`  
- `update_type (TEXT)`  
- `summary (TEXT)`  
- `details (TEXT)`  
- `old_status (TEXT)`  
- `new_status (TEXT)`  
- `created_at (TIMESTAMP)`  

---

## ✅ `task_checkpoints`
**Descrição:** Checklist interno da tarefa

### Atributos
- `id (UUID)`  
- `task_id (UUID)`  
- `description (TEXT)`  
- `is_done (BOOLEAN)`  
- `order_index (INT)`  
- `created_at (TIMESTAMP)`  
- `updated_at (TIMESTAMP)`  

---

## 📎 `task_attachments`
**Descrição:** Arquivos e imagens das tarefas

### Atributos
- `id (UUID)`  
- `task_id (UUID)`  
- `uploaded_by (UUID)`  
- `file_name (TEXT)`  
- `file_url (TEXT)`  
- `file_type (TEXT)`  
- `mime_type (TEXT)`  
- `file_size (INT)`  
- `created_at (TIMESTAMP)`  

---

## 💬 `chat_sessions`
**Descrição:** Sessões de chat (registro ou consulta)

### Atributos
- `id (UUID)`  
- `user_id (UUID)`  
- `project_id (UUID)`  
- `mode (TEXT)`  
- `title (TEXT)`  
- `status (TEXT)`  
- `started_at (TIMESTAMP)`  
- `ended_at (TIMESTAMP)`  
- `created_at (TIMESTAMP)`  
- `updated_at (TIMESTAMP)`  

---

## 🗨️ `chat_messages`
**Descrição:** Mensagens dentro das sessões

### Atributos
- `id (UUID)`  
- `session_id (UUID)`  
- `sender (TEXT)`  
- `message_type (TEXT)`  
- `content (TEXT)`  
- `metadata (JSONB)`  
- `created_at (TIMESTAMP)`  

---

## 🧠 `knowledge_chunks`
**Descrição:** Base vetorial para RAG

### Atributos
- `id (UUID)`  
- `task_id (UUID)`  
- `task_update_id (UUID)`  
- `project_id (UUID)`  
- `source_type (TEXT)`  
- `content (TEXT)` → texto indexado  
- `embedding (VECTOR)` → vetor semântico  
- `metadata (JSONB)` → filtros auxiliares  
- `created_at (TIMESTAMP)`  
- `updated_at (TIMESTAMP)`  

---

# 🎛️ Enums

---

## Task Status
- `todo`
- `in_progress`
- `done`
- `blocked`
- `cancelled`

---

## Task Category
- `feature`
- `bug_fix`
- `refactor`
- `test`
- `ui_ux`
- `docs`
- `infra`
- `research`

---

## Update Type
- `created`
- `progress`
- `status_change`
- `completion`
- `blocker`
- `edit`

---

## Chat Mode
- `register`
- `query`

---

## Sender
- `user`
- `assistant`
- `system`

---

## Session Status
- `active`
- `finished`
- `abandoned`

---

# 🔗 Relações

---

## Usuário
- `users 1:N projects`
- `users 1:N refresh_tokens`
- `users 1:N tasks`
- `users 1:N task_updates`
- `users 1:N task_attachments`
- `users 1:N chat_sessions`
- `users N:N projects (via project_members)`

---

## Projeto
- `projects 1:1 project_profiles`
- `projects 1:N tasks`
- `projects 1:N chat_sessions`
- `projects 1:N knowledge_chunks`
- `projects 1:N project_members`

---

## Tarefa
- `tasks 1:N task_updates`
- `tasks 1:N task_checkpoints`
- `tasks 1:N task_attachments`
- `tasks 1:N knowledge_chunks`

---

## Atualizações
- `task_updates 1:N knowledge_chunks`

---

## Chat
- `chat_sessions 1:N chat_messages`

---

## RAG
- `knowledge_chunks N:1 projects`
- `knowledge_chunks N:1 tasks`
- `knowledge_chunks N:1 task_updates`

---

# 🧠 Observação Final

O sistema é dividido em três camadas principais:

- **Dados estruturados:** `tasks`, `projects`
- **Histórico:** `task_updates`
- **Busca inteligente:** `knowledge_chunks`

Essa separação permite:
- consultas semânticas eficientes
- evolução do sistema sem refatoração pesada
- escalabilidade para features futuras