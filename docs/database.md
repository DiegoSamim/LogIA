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
- `created_at (TIMESTAMP)` → data de emissão  

---

## 📁 `projects`
**Descrição:** Projetos do usuário

### Atributos
- `id (UUID)` → identificador do projeto  
- `user_id (UUID)` → dono do projeto  
- `name (TEXT)` → nome do projeto  
- `description (TEXT)` → descrição breve  
- `repository_url (TEXT)` → URL do repositório  
- `color (TEXT)` → cor visual do projeto  
- `status (TEXT)` → estado atual  
- `created_at (TIMESTAMP)` → data de criação  
- `updated_at (TIMESTAMP)` → última atualização  

---

## 📊 `project_profiles`
**Descrição:** Contexto expandido do projeto

### Atributos
- `id (UUID)` → identificador do perfil  
- `project_id (UUID)` → relação 1:1 com projeto  
- `summary (TEXT)` → resumo  
- `goal (TEXT)` → objetivo  
- `scope (TEXT)` → escopo  
- `main_stack (TEXT[])` → stack consolidada do projeto, mantida por compatibilidade  
- `frontend_stack (TEXT[])` → tecnologias de frontend  
- `backend_stack (TEXT[])` → tecnologias de backend  
- `infra_stack (TEXT[])` → tecnologias de infraestrutura/cloud  
- `database_stack (TEXT[])` → tecnologias de persistência, busca e cache  
- `other_stack (TEXT[])` → tecnologias legadas ou não categorizadas  
- `architecture_summary (TEXT)` → visão geral legada da arquitetura  
- `architecture_frontend (TEXT)` → arquitetura da camada de frontend  
- `architecture_backend (TEXT)` → arquitetura da camada de backend  
- `architecture_integrations (TEXT)` → integrações e serviços externos  
- `architecture_data (TEXT)` → modelagem de dados, persistência e fluxo de leitura/escrita  
- `architecture_infra (TEXT)` → infraestrutura, deploy e operação  
- `product_context (TEXT)` → contexto do produto  
- `business_rules (TEXT)` → visão geral legada das regras de negócio  
- `business_rules_core (TEXT)` → regras principais do domínio  
- `business_rules_permissions (TEXT)` → regras de permissão e papéis  
- `business_rules_validations (TEXT)` → validações de negócio  
- `business_rules_constraints (TEXT)` → restrições e exceções do domínio  
- `team_context (TEXT)` → contexto do time  
- `default_language (TEXT)` → idioma padrão  
- `documentation_url (TEXT)` → link da documentação  
- `figma_url (TEXT)` → link do design  
- `board_url (TEXT)` → link do board  
- `api_base_url (TEXT)` → base da API  
- `deployment_url (TEXT)` → URL publicada  
- `created_at (TIMESTAMP)` → data de criação  

---

## 📂 `project_attachments`
**Descrição:** Arquivos e imagens anexados ao contexto do projeto

### Atributos
- `id (UUID)` → identificador do arquivo  
- `project_id (UUID)` → projeto relacionado  
- `uploaded_by (UUID)` → usuário que enviou  
- `file_name (TEXT)` → nome do arquivo  
- `file_url (TEXT)` → URL de acesso  
- `file_type (TEXT)` → tipo lógico do arquivo  
- `mime_type (TEXT)` → tipo MIME  
- `file_size (INT)` → tamanho em bytes  
- `created_at (TIMESTAMP)` → data do upload  

---

## 👥 `project_members`
**Descrição:** Relacionamento usuário ↔ projeto

### Atributos
- `id (UUID)` → identificador do vínculo  
- `user_id (UUID)` → usuário relacionado  
- `project_id (UUID)` → projeto relacionado  
- `role (TEXT)` → papel no projeto  
- `created_at (TIMESTAMP)` → data de entrada  

---

## 🧩 `tasks`
**Descrição:** Tarefas registradas no sistema

### Atributos
- `id (UUID)` → identificador da tarefa  
- `created_by (UUID)` → usuário criador  
- `project_id (UUID)` → projeto da tarefa  
- `title (TEXT)` → título da tarefa  
- `feature_or_ticket (TEXT)` → referência externa  
- `what_was_done (TEXT)` → resumo do trabalho  
- `technical_approach (TEXT)` → abordagem técnica  
- `category (TEXT)` → tipo da tarefa  
- `status (TEXT)` → status atual  
- `priority (TEXT)` → prioridade definida  
- `blocked_reason (TEXT)` → motivo do bloqueio  
- `next_steps (TEXT)` → próximos passos  
- `people_involved (TEXT)` → pessoas envolvidas  
- `tags (TEXT[])` → marcadores livres  
- `hours_worked (FLOAT)` → horas trabalhadas registradas para a tarefa  
- `started_at (TIMESTAMP)` → início da execução  
- `completed_at (TIMESTAMP)` → conclusão da tarefa  
- `created_at (TIMESTAMP)` → data de criação  
- `updated_at (TIMESTAMP)` → última atualização  

---

## 🔄 `task_updates`
**Descrição:** Histórico de evolução das tarefas

### Atributos
- `id (UUID)` → identificador do update  
- `task_id (UUID)` → tarefa atualizada  
- `created_by (UUID)` → autor do update  
- `update_type (TEXT)` → tipo de atualização  
- `summary (TEXT)` → resumo curto  
- `details (TEXT)` → detalhes adicionais  
- `old_status (TEXT)` → status anterior  
- `new_status (TEXT)` → novo status  
- `created_at (TIMESTAMP)` → data do registro  

---

## ✅ `task_checkpoints`
**Descrição:** Checklist interno da tarefa

### Atributos
- `id (UUID)` → identificador do item  
- `task_id (UUID)` → tarefa relacionada  
- `description (TEXT)` → descrição do checkpoint  
- `is_done (BOOLEAN)` → item concluído  
- `order_index (INT)` → ordem de exibição  
- `created_at (TIMESTAMP)` → data de criação  
- `updated_at (TIMESTAMP)` → última atualização  

---

## 📎 `task_attachments`
**Descrição:** Arquivos e imagens das tarefas

### Atributos
- `id (UUID)` → identificador do arquivo  
- `task_id (UUID)` → tarefa relacionada  
- `uploaded_by (UUID)` → usuário que enviou  
- `file_name (TEXT)` → nome do arquivo  
- `file_url (TEXT)` → URL de acesso  
- `file_type (TEXT)` → tipo lógico do arquivo  
- `mime_type (TEXT)` → tipo MIME  
- `file_size (INT)` → tamanho em bytes  
- `created_at (TIMESTAMP)` → data do upload  

---

## 💬 `chat_sessions`
**Descrição:** Sessões de chat (registro ou consulta)

### Atributos
- `id (UUID)` → identificador da sessão  
- `user_id (UUID)` → usuário da sessão  
- `project_id (UUID)` → projeto associado  
- `mode (TEXT)` → modo do chat  
- `title (TEXT)` → título da sessão  
- `status (TEXT)` → estado da sessão  
- `started_at (TIMESTAMP)` → início da sessão  
- `ended_at (TIMESTAMP)` → fim da sessão  
- `created_at (TIMESTAMP)` → data de criação  
- `updated_at (TIMESTAMP)` → última atualização  

---

## 🗨️ `chat_messages`
**Descrição:** Mensagens dentro das sessões

### Atributos
- `id (UUID)` → identificador da mensagem  
- `session_id (UUID)` → sessão de origem  
- `sender (TEXT)` → remetente da mensagem  
- `message_type (TEXT)` → tipo da mensagem  
- `content (TEXT)` → conteúdo textual  
- `metadata (JSONB)` → dados auxiliares  
- `created_at (TIMESTAMP)` → data do envio  

---

## 🧠 `knowledge_chunks`
**Descrição:** Base vetorial para RAG

### Atributos
- `id (UUID)` → identificador do chunk  
- `task_id (UUID)` → tarefa vinculada  
- `task_update_id (UUID)` → update vinculado  
- `project_id (UUID)` → projeto vinculado  
- `source_type (TEXT)` → origem do conteúdo  
- `content (TEXT)` → texto indexado  
- `embedding (VECTOR)` → vetor semântico  
- `metadata (JSONB)` → filtros auxiliares  
- `created_at (TIMESTAMP)` → data de criação  
- `updated_at (TIMESTAMP)` → última atualização  

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
- `users 1:N project_attachments`
- `users 1:N task_attachments`
- `users 1:N chat_sessions`
- `users N:N projects (via project_members)`

---

## Projeto
- `projects 1:1 project_profiles`
- `projects 1:N project_attachments`
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
