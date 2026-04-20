# LogIA

LogIA é uma plataforma de memória técnica para times de desenvolvimento.

O projeto combina:

- registro estruturado de contexto via chat
- histórico evolutivo de tarefas
- contexto expandido de projetos
- base vetorial com `knowledge_chunks`
- modo de consulta preparado para evolução com RAG/LLM

Hoje o sistema já cobre autenticação, projetos, página Sobre, tarefas, chat de registro e chat de consulta com sessões persistidas.

## Visão Geral

O produto foi pensado para resolver um problema comum em times de software: muito contexto importante fica espalhado em conversa, PR, commit, issue e memória pessoal.

O LogIA organiza esse conhecimento em três camadas:

1. dados estruturados de projeto e tarefa
2. histórico incremental de atualizações
3. chunks indexados para busca e consulta futura

## Stack

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Zustand
- MUI
- Tailwind CSS v4

### Backend

- FastAPI
- SQLAlchemy 2
- AsyncPG
- Alembic
- PostgreSQL 16 com `pgvector`
- Pydantic v2

## Estrutura do Repositório

```text
.
├── Backend/
│   ├── app/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   └── services/
│   ├── migrations/
│   ├── docker-compose.yml
│   └── requirements.txt
├── Frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── store/
│   └── package.json
├── docs/
├── dev.sh
└── Makefile
```

## Principais Fluxos

### 1. Projetos

Cada usuário pode criar projetos com:

- nome
- descrição
- repositório
- cor/status
- perfil expandido
- membros
- anexos

### 2. Página Sobre

A página Sobre concentra o contexto estruturado do projeto:

- objetivo
- escopo
- stack principal e categorizada
- arquitetura
- regras de negócio
- contexto do time
- links úteis

### 3. Registro de tarefas via chat

O modo `register` guia o usuário por perguntas para:

- criar uma nova tarefa
- atualizar uma tarefa existente
- gerar histórico de atualização
- anexar arquivos

Esse fluxo persiste dados em:

- `tasks`
- `task_updates`
- `task_checkpoints`
- `task_attachments`
- `chat_sessions`
- `chat_messages`
- `knowledge_chunks`

### 4. Consulta via chat

O modo `query` usa sessões persistidas por projeto para responder perguntas fixas como:

- o que foi feito na semana
- bloqueios registrados
- resumo técnico do projeto
- tarefas ainda em aberto

Hoje esse fluxo já possui:

- múltiplas sessões de consulta
- histórico real salvo em `chat_messages`
- runs de consulta em `query_runs`
- polling
- cancelamento
- recuperação após reload
- estrutura pronta para substituir resposta mock por RAG/LLM

## Modelagem de Dados

Os principais grupos de entidades são:

- identidade: `users`, `refresh_tokens`
- projeto: `projects`, `project_profiles`, `project_members`, `project_attachments`
- tarefa: `tasks`, `task_updates`, `task_checkpoints`, `task_attachments`
- chat: `chat_sessions`, `chat_messages`, `query_runs`
- memória técnica: `knowledge_chunks`

Documentação detalhada:

- [docs/database.md](/home/diego/programacao/LogIA/docs/database.md)

## Como Rodar o Projeto

## Pré-requisitos

- Python 3.12+
- Node.js
- Docker e Docker Compose

## Subida rápida

O caminho mais simples é usar o script principal:

```bash
./dev.sh
```

Esse script faz:

1. sobe o banco PostgreSQL com `pgvector`
2. aplica `alembic upgrade head`
3. inicia o backend em `http://localhost:8000`
4. inicia o frontend em `http://localhost:5173`

## Usando Makefile

```bash
make install
make dev
```

Comandos úteis:

```bash
make db
make backend
make frontend
make db-down
```

## Instalação manual

### Backend

```bash
cd Backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd Frontend
npm install
npm run dev -- --host
```

### Banco

```bash
docker compose -f Backend/docker-compose.yml up -d
```

## Variáveis de Ambiente

O backend usa `.env` em `Backend/.env`.

Campos esperados:

- `DATABASE_URL`
- `SECRET_KEY`
- `ALGORITHM`
- `ACCESS_TOKEN_EXPIRE_MINUTES`
- `REFRESH_TOKEN_EXPIRE_DAYS`
- `FRONTEND_URL`
- `EXTRA_ORIGINS`
- `APP_ENV`
- `UPLOAD_DIR`

Exemplo de banco local:

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/logia
```

## Rotas Principais da Aplicação

### Frontend

- `/`
- `/login`
- `/register`
- `/projects`
- `/projects/:projectId/sobre`
- `/dashboard`
- `/chat`
- `/tasks`
- `/tasks/:taskId`

### Backend

- `/api/v1/auth`
- `/api/v1/users`
- `/api/v1/projects`
- `/api/v1/tasks`
- `/api/v1/chat`
- `/health`

Observação:

As rotas de tarefas e chat são registradas sob `/api/v1`, com subpaths específicos definidos pelos routers.

## Estado Atual do Produto

O projeto já possui:

- autenticação com access token + refresh token
- gestão de projetos
- gestão de membros
- página Sobre editável
- CRUD de tarefas
- atualização incremental de tarefas
- anexos de projeto e tarefa
- chat de registro
- chat de consulta com sessões persistidas
- indexação de conhecimento em chunks

O próximo passo natural da plataforma é evoluir o executor de consulta mock para uma camada real de RAG/LLM reutilizando a estrutura já implementada.

## Qualidade e Observações

- As migrações Alembic devem sempre estar em `head` antes de rodar o backend.
- O banco local usa `pgvector/pgvector:pg16`.
- O modo consulta já está preparado para race conditions, polling, cancelamento e persistência local.
- A documentação de schema foi mantida em [docs/database.md](/home/diego/programacao/LogIA/docs/database.md).

