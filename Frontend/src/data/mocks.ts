/**
 * mocks.ts — Dados de teste para desenvolvimento e prototipagem.
 *
 * Todos os objetos respeitam as interfaces definidas em dtos.ts.
 * Substituir pelo retorno real da API quando o backend estiver integrado.
 */

import type {
  UserDTO,
  ProjectDTO,
  ProjectDetailDTO,
  TaskDTO,
  ChatSessionDTO,
} from './dtos'

// ── Usuário ──────────────────────────────────────────────────────────────────

export const MOCK_USER: UserDTO = {
  id: 'user-001',
  name: 'Diego Samim',
  email: 'diego@logia.dev',
  avatar_url: null,
  is_active: true,
  created_at: '2024-01-15T10:00:00Z',
}

export const MOCK_USER_2: UserDTO = {
  id: 'user-002',
  name: 'Ana Silva',
  email: 'ana@logia.dev',
  avatar_url: null,
  is_active: true,
  created_at: '2024-01-20T14:00:00Z',
}

// ── Projetos (listagem) ───────────────────────────────────────────────────────

export const MOCK_PROJECTS: ProjectDTO[] = [
  {
    id: 'proj-001',
    name: 'API de Autenticação',
    description:
      'JWT com refresh tokens, controle de sessão e revogação segura. Implementação de middleware de roles.',
    status: 'active',
    color: '#6366F1',
    repository_url: 'https://github.com/org/auth-api',
    stack: ['Node.js', 'TypeScript', 'PostgreSQL'],
    last_session_at: '2024-04-08T10:30:00Z',
    task_count: 14,
    done_count: 11,
    created_at: '2024-02-01T09:00:00Z',
  },
  {
    id: 'proj-002',
    name: 'Painel de Métricas',
    description:
      'Dashboard de latência e throughput de endpoints. Gráficos em tempo real com polling e cache de curta duração.',
    status: 'review',
    color: '#8B5CF6',
    repository_url: 'https://github.com/org/metrics-panel',
    stack: ['React', 'Recharts', 'Redis'],
    last_session_at: '2024-04-07T16:00:00Z',
    task_count: 9,
    done_count: 7,
    created_at: '2024-02-15T11:00:00Z',
  },
  {
    id: 'proj-003',
    name: 'Pipeline de Ingestão',
    description:
      'Processamento assíncrono de eventos com Dead Letter Queue e retry exponencial. Integração com S3.',
    status: 'active',
    color: '#6366F1',
    repository_url: null,
    stack: ['Python', 'RabbitMQ', 'Docker'],
    last_session_at: '2024-04-08T09:15:00Z',
    task_count: 6,
    done_count: 3,
    created_at: '2024-03-01T08:00:00Z',
  },
]

// ── Projeto detalhe (página Sobre) ───────────────────────────────────────────

export const MOCK_PROJECT_DETAIL: ProjectDetailDTO = {
  // ── campos de ProjectDTO ──
  id: 'proj-beta-01',
  name: 'LogIA-Beta-01',
  description:
    'Diário técnico inteligente para desenvolvedores. Registre o que você fez em linguagem natural e consulte seu histórico via busca semântica (RAG).',
  status: 'active',
  color: '#6366F1',
  repository_url: 'https://github.com/DiegoSamim/LogIA',
  stack: ['React', 'TypeScript', 'FastAPI', 'PostgreSQL', 'pgvector', 'OpenAI'],
  last_session_at: '2024-04-08T11:45:00Z',
  task_count: 22,
  done_count: 14,
  created_at: '2024-01-15T10:00:00Z',

  // ── profile (project_profiles 1:1) ──
  profile: {
    id: 'profile-beta-01',
    project_id: 'proj-beta-01',

    summary:
      'O LogIA é uma ferramenta de memória técnica para desenvolvedores. O fluxo central é um chat que alterna entre dois modos: Registro (o usuário narra o que fez e a IA estrutura) e Consulta (o usuário pergunta e a IA busca no histórico via embeddings). Toda sessão é persistida e indexada para recuperação futura.',

    goal:
      'Eliminar a perda de contexto entre sessões de trabalho. O desenvolvedor nunca mais precisa lembrar "como resolvi aquele bug semana passada" — basta perguntar ao LogIA.',

    scope:
      'MVP: autenticação, gestão de projetos, chat dual-mode (registro e consulta), pipeline de indexação vetorial. Fora de escopo: analytics avançados, integrações externas (Jira, GitHub Issues).',

    main_stack: ['React', 'TypeScript', 'FastAPI', 'PostgreSQL', 'pgvector', 'OpenAI'],

    architecture_summary:
      'Frontend React comunica com FastAPI via REST. O pipeline de registro persiste mensagens em `chat_messages`, extrai entidades para `tasks`, e gera embeddings via OpenAI que são salvos em `knowledge_chunks` (pgvector). O modo consulta faz busca vetorial semântica e monta contexto para o LLM.',

    product_context:
      'Mercado de ferramentas de produtividade para devs. Posicionamento entre o Notion (muito genérico) e o Linear (focado só em tasks) — o LogIA é específico para memória técnica em linguagem natural.',

    business_rules:
      'Um projeto pertence a um único usuário dono. Membros adicionados via `project_members` têm acesso de leitura por padrão. Sessões de registro geram tarefas automaticamente. Consultas não persistem tarefas.',

    team_context:
      'Equipe solo em fase de MVP. Diego (Lead Dev) responsável por arquitetura, frontend e integração IA. Ana (AI Engineer) responsável pelo pipeline de embeddings e prompt engineering.',

    default_language: 'pt-BR',

    documentation_url: 'https://docs.logia.dev',
    figma_url: 'https://figma.com/file/logia-design',
    board_url: 'https://linear.app/logia',
    api_base_url: 'https://api.logia.dev/v1',
    deployment_url: 'https://app.logia.dev',

    created_at: '2024-01-15T10:00:00Z',
  },

  // ── membros ──
  members: [
    {
      id: 'member-001',
      user_id: 'user-001',
      project_id: 'proj-beta-01',
      role: 'Lead Dev',
      created_at: '2024-01-15T10:00:00Z',
      user: MOCK_USER,
    },
    {
      id: 'member-002',
      user_id: 'user-002',
      project_id: 'proj-beta-01',
      role: 'AI Engineer',
      created_at: '2024-01-20T14:00:00Z',
      user: MOCK_USER_2,
    },
  ],
}

// ── Tarefas ──────────────────────────────────────────────────────────────────

export const MOCK_TASKS: TaskDTO[] = [
  {
    id: 'task-001',
    project_id: 'proj-beta-01',
    created_by: 'user-001',
    title: 'Implementar pipeline de embeddings',
    feature_or_ticket: 'LOGIA-12',
    what_was_done:
      'Criado serviço que extrai chunks de texto das sessões de registro e gera embeddings via OpenAI text-embedding-3-small. Salvo em knowledge_chunks com pgvector.',
    technical_approach:
      'Batch processing assíncrono via FastAPI BackgroundTasks. Chunks de 512 tokens com 50 tokens de overlap para preservar contexto.',
    category: 'feature',
    status: 'done',
    priority: 'high',
    blocked_reason: null,
    next_steps: 'Adicionar retry com backoff exponencial para falhas na API OpenAI.',
    people_involved: null,
    tags: ['rag', 'embeddings', 'openai'],
    started_at: '2024-03-10T09:00:00Z',
    completed_at: '2024-03-12T18:00:00Z',
    created_at: '2024-03-10T09:00:00Z',
    updated_at: '2024-03-12T18:00:00Z',
  },
  {
    id: 'task-002',
    project_id: 'proj-beta-01',
    created_by: 'user-001',
    title: 'Sistema de autenticação JWT + refresh tokens',
    feature_or_ticket: 'LOGIA-05',
    what_was_done:
      'Implementado login com JWT de 15min + refresh token de 7 dias. Revogação via tabela refresh_tokens com hash do token.',
    technical_approach:
      'Access token no header Authorization. Refresh token em httpOnly cookie. Middleware FastAPI valida e renova automaticamente.',
    category: 'feature',
    status: 'done',
    priority: 'high',
    blocked_reason: null,
    next_steps: null,
    people_involved: null,
    tags: ['auth', 'jwt', 'security'],
    started_at: '2024-02-05T10:00:00Z',
    completed_at: '2024-02-08T16:00:00Z',
    created_at: '2024-02-05T10:00:00Z',
    updated_at: '2024-02-08T16:00:00Z',
  },
  {
    id: 'task-003',
    project_id: 'proj-beta-01',
    created_by: 'user-001',
    title: 'Modo Consulta — busca semântica no histórico',
    feature_or_ticket: 'LOGIA-18',
    what_was_done: null,
    technical_approach:
      'Cosine similarity via pgvector <=> operator. Top-5 chunks enviados como contexto ao LLM. Prompt template fixo por tipo de pergunta.',
    category: 'feature',
    status: 'in_progress',
    priority: 'high',
    blocked_reason: null,
    next_steps: 'Implementar re-ranking dos resultados por data e relevância.',
    people_involved: 'Ana Silva (AI Engineer)',
    tags: ['rag', 'query', 'llm'],
    started_at: '2024-04-05T09:00:00Z',
    completed_at: null,
    created_at: '2024-04-05T09:00:00Z',
    updated_at: '2024-04-08T10:00:00Z',
  },
  {
    id: 'task-004',
    project_id: 'proj-beta-01',
    created_by: 'user-001',
    title: 'Testes de integração do pipeline RAG',
    feature_or_ticket: 'LOGIA-21',
    what_was_done: null,
    technical_approach: null,
    category: 'test',
    status: 'todo',
    priority: 'medium',
    blocked_reason: null,
    next_steps: 'Aguardar finalização do Modo Consulta (task-003).',
    people_involved: null,
    tags: ['test', 'rag'],
    started_at: null,
    completed_at: null,
    created_at: '2024-04-08T09:00:00Z',
    updated_at: '2024-04-08T09:00:00Z',
  },
]

// ── Sessões de chat ──────────────────────────────────────────────────────────

export const MOCK_CHAT_SESSIONS: ChatSessionDTO[] = [
  {
    id: 'session-001',
    user_id: 'user-001',
    project_id: 'proj-beta-01',
    mode: 'register',
    title: 'Implementação do pipeline de embeddings',
    status: 'finished',
    started_at: '2024-03-10T09:00:00Z',
    ended_at: '2024-03-10T10:30:00Z',
    created_at: '2024-03-10T09:00:00Z',
    updated_at: '2024-03-10T10:30:00Z',
  },
  {
    id: 'session-002',
    user_id: 'user-001',
    project_id: 'proj-beta-01',
    mode: 'query',
    title: 'Como foi implementado o pipeline de auth?',
    status: 'finished',
    started_at: '2024-04-07T14:00:00Z',
    ended_at: '2024-04-07T14:12:00Z',
    created_at: '2024-04-07T14:00:00Z',
    updated_at: '2024-04-07T14:12:00Z',
  },
]
