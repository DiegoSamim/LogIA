import StackBadge from '@/components/ui/StackBadge'
import type { ChatMessageViewModel, ProjectQuestion, SidePanelSection, TaskRegisterQuestion } from '@/pages/Chat/types'

export const REGISTER_COPY: {
  messages: ChatMessageViewModel[]
  panelSections: SidePanelSection[]
} = {
  messages: [
    {
      id: 'register-1',
      sender: 'assistant',
      tone: 'standard',
      content:
        'Vamos registrar sua sessão de trabalho. Me conte o que você desenvolveu, em qual parte do projeto atuou e se houve alguma decisão técnica importante.',
    },
    {
      id: 'register-2',
      sender: 'user',
      tone: 'highlight',
      content:
        'Hoje estruturei a base do fluxo de chat do LogIA, definindo os estados de registro e consulta e organizando a interface inicial para orientar o preenchimento das tarefas.',
    },
    {
      id: 'register-3',
      sender: 'assistant',
      tone: 'standard',
      content:
        'Ótimo. Para transformar isso em um registro útil, podemos detalhar o resultado entregue, a abordagem adotada e o que precisa ser continuado na próxima sessão.',
      suggestions: [
        'Quais componentes foram criados?',
        'Houve alguma decisão de UX importante?',
        'Existe algo bloqueando a continuação?',
      ],
    },
  ],
  panelSections: [
    {
      title: 'Preview do registro',
      content: (
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">Título sugerido</p>
            <p className="mt-2 text-sm font-semibold text-white/88">Base visual da experiência de chat</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Status</p>
              <p className="mt-2 text-xs text-amber-300">Em andamento</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Categoria</p>
              <p className="mt-2 text-xs text-white/74">ui_ux</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Stack</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {['React', 'TypeScript', 'Tailwind'].map((item) => (
                <StackBadge key={item} value={item} compact />
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Atividade recente',
      content: (
        <div className="space-y-3">
          {[
            ['Estrutura inicial da tela de projetos', '2h atrás'],
            ['Ajustes no header autenticado', '58 min atrás'],
            ['Fluxo de logout otimista', '21 min atrás'],
          ].map(([title, time]) => (
            <div key={title} className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-violet/70" />
              <div>
                <p className="text-xs text-white/72">{title}</p>
                <p className="mt-1 text-[11px] text-white/28">{time}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ],
}

export const QUERY_COPY: {
  messages: ChatMessageViewModel[]
  fixedQuestions: string[]
  panelSections: SidePanelSection[]
} = {
  messages: [
    {
      id: 'query-1',
      sender: 'assistant',
      tone: 'standard',
      content:
        'Com base no histórico disponível, o time já consolidou uma direção visual para a experiência de chat e separou claramente a fase de interface da fase de integração com backend.',
      orderedItems: [
        'Definir uma tela dual-mode com alternância entre registro e consulta.',
        'Manter um painel contextual à direita para apoiar leitura da sessão.',
        'Reutilizar o shell atual do app sem mudar o header global.',
      ],
      references: ['chat_sessions', 'chat_messages', 'tasks', 'project_profiles'],
    },
  ],
  fixedQuestions: [
    'O que fiz essa semana?',
    'Quais bloqueios já registrei?',
    'Resumo técnico do projeto',
    'Tarefas ainda em aberto',
  ],
  panelSections: [
    {
      title: 'Contexto da consulta',
      content: (
        <div className="space-y-4 text-xs text-white/56">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Fonte principal</p>
            <p className="mt-2 text-white/78">Histórico técnico do LogIA</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-[0.16em] text-white/28 uppercase">Escopo sugerido</p>
            <p className="mt-2 leading-relaxed">Conversas de registro, updates de tarefa e decisões sobre experiência visual do frontend.</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Atalhos de filtro',
      content: (
        <div className="flex flex-wrap gap-2">
          {['Frontend', 'UI/UX', 'Integração', 'Arquitetura'].map((item) => (
            <button
              key={item}
              type="button"
              className="rounded-full border border-white/10 bg-surface-high px-3 py-1.5 text-[11px] text-white/52 transition-colors duration-150 hover:border-accent-indigo/26 hover:text-white/82"
            >
              {item}
            </button>
          ))}
        </div>
      ),
    },
  ],
}

export const PROJECT_QUESTIONS: ProjectQuestion[] = [
  {
    field: 'name',
    question: 'Vamos começar. Qual será o nome do projeto?',
    placeholder: 'Ex: LogIA, Dashboard Financeiro, API de Pagamentos...',
    required: true,
  },
  {
    field: 'description',
    question: 'Ótimo! Descreva brevemente o que é esse projeto.',
    placeholder: 'Ex: Ferramenta de memória técnica para desenvolvedores via chat e RAG.',
    required: true,
  },
  {
    field: 'stack',
    question: 'Qual a stack principal? Você pode selecionar tecnologias conhecidas ou adicionar entradas personalizadas.',
    placeholder: 'Busque stacks como React, Python, PostgreSQL...',
    required: false,
    hint: 'Opcional',
  },
  {
    field: 'repository_url',
    question: 'Tem um repositório Git? Cole a URL aqui.',
    placeholder: 'https://github.com/usuario/projeto',
    required: false,
    hint: 'Opcional',
  },
  {
    field: 'goal',
    question: 'Qual o objetivo principal desse projeto?',
    placeholder: 'Ex: Permitir que devs consultem seu histórico técnico via busca semântica.',
    required: false,
    hint: 'Opcional',
  },
  {
    field: 'scope',
    question: 'Qual o escopo? O que está dentro e fora do projeto?',
    placeholder: 'Ex: Inclui chat de registro e consulta. Não inclui gestão de equipe.',
    required: false,
    hint: 'Opcional — última pergunta!',
  },
]

export const TASK_STATUS_OPTIONS = [
  { value: 'todo', label: 'A fazer' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'done', label: 'Concluída' },
  { value: 'blocked', label: 'Bloqueada' },
  { value: 'cancelled', label: 'Cancelada' },
] as const

export const CREATE_TASK_QUESTIONS: TaskRegisterQuestion[] = [
  {
    field: 'taskTitle',
    question: 'Qual o título da tarefa?',
    placeholder: 'Ex: Implementar fluxo de registro de tarefas no chat.',
  },
  {
    field: 'newStatus',
    question: 'Qual o status atual da tarefa?',
    placeholder: '',
  },
  {
    field: 'summary',
    question: 'O que foi feito nesta tarefa?',
    placeholder: 'Descreva de forma simples o que foi realizado.',
  },
]

export const UPDATE_TASK_QUESTIONS: TaskRegisterQuestion[] = [
  {
    field: 'summary',
    question: 'O que mudou nesta tarefa?',
    placeholder: 'Resuma o avanço ou ajuste feito nesta tarefa.',
  },
  {
    field: 'newStatus',
    question: 'Qual o novo status da tarefa?',
    placeholder: '',
  },
]
