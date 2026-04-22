/* eslint-disable react-refresh/only-export-components */
import StackBadge from '@/components/ui/StackBadge'
import type {
  ChatMessageViewModel,
  EnumChipOption,
  ProjectQuestion,
  QueryQuestionOption,
  SidePanelSection,
  TaskRegisterQuestion,
} from '@/pages/Chat/types'

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

export const QUERY_FIXED_QUESTIONS: QueryQuestionOption[] = [
  {
    key: 'weekly-progress',
    label: 'O que fiz essa semana?',
    helper: 'Consolida os registros mais recentes e highlights do projeto.',
    color: '#6366F1',
  },
  {
    key: 'recorded-blockers',
    label: 'Quais bloqueios já registrei?',
    helper: 'Recupera impedimentos documentados no histórico técnico.',
    color: '#F43F5E',
  },
  {
    key: 'technical-summary',
    label: 'Resumo técnico do projeto',
    helper: 'Agrupa snapshots e updates com foco em decisões e implementação.',
    color: '#8B5CF6',
  },
  {
    key: 'open-tasks',
    label: 'Tarefas ainda em aberto',
    helper: 'Mostra tarefas abertas e contexto do que falta avançar.',
    color: '#F59E0B',
  },
]

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

// ── Enum chip options ───────────────────────────────────────────────────────

export const STATUS_CHIP_OPTIONS: EnumChipOption[] = [
  { value: 'todo',        label: 'A fazer',       colorClass: 'text-slate-300   bg-slate-400/10  border-slate-400/20' },
  { value: 'in_progress', label: 'Em andamento',  colorClass: 'text-indigo-300  bg-indigo-400/10 border-indigo-400/20' },
  { value: 'done',        label: 'Concluída',     colorClass: 'text-green-300   bg-green-400/10  border-green-400/20' },
  { value: 'blocked',     label: 'Bloqueada',     colorClass: 'text-orange-300  bg-orange-400/10 border-orange-400/20' },
  { value: 'cancelled',   label: 'Cancelada',     colorClass: 'text-red-300     bg-red-400/10    border-red-400/20' },
]

export const CATEGORY_CHIP_OPTIONS: EnumChipOption[] = [
  { value: 'feature',   label: 'Feature',   colorClass: 'text-indigo-300  bg-indigo-400/10 border-indigo-400/20' },
  { value: 'bug_fix',   label: 'Bug Fix',   colorClass: 'text-red-300     bg-red-400/10    border-red-400/20' },
  { value: 'refactor',  label: 'Refactor',  colorClass: 'text-amber-300   bg-amber-400/10  border-amber-400/20' },
  { value: 'test',      label: 'Teste',     colorClass: 'text-cyan-300    bg-cyan-400/10   border-cyan-400/20' },
  { value: 'ui_ux',     label: 'UI/UX',     colorClass: 'text-violet-300  bg-violet-400/10 border-violet-400/20' },
  { value: 'docs',      label: 'Docs',      colorClass: 'text-slate-300   bg-slate-400/10  border-slate-400/20' },
  { value: 'infra',     label: 'Infra',     colorClass: 'text-orange-300  bg-orange-400/10 border-orange-400/20' },
  { value: 'research',  label: 'Pesquisa',  colorClass: 'text-teal-300    bg-teal-400/10   border-teal-400/20' },
]

export const PRIORITY_CHIP_OPTIONS: EnumChipOption[] = [
  { value: 'critical', label: 'Crítica', colorClass: 'text-red-300    bg-red-400/10    border-red-400/20' },
  { value: 'high',     label: 'Alta',    colorClass: 'text-orange-300 bg-orange-400/10 border-orange-400/20' },
  { value: 'medium',   label: 'Média',   colorClass: 'text-amber-300  bg-amber-400/10  border-amber-400/20' },
  { value: 'low',      label: 'Baixa',   colorClass: 'text-green-300  bg-green-400/10  border-green-400/20' },
]

export const SUMMARY_UPDATE_DECISION_OPTIONS: EnumChipOption[] = [
  { value: 'no',  label: 'Manter resumo atual', colorClass: 'text-slate-300 bg-slate-400/10 border-slate-400/20' },
  { value: 'yes', label: 'Atualizar resumo',    colorClass: 'text-indigo-300 bg-indigo-400/10 border-indigo-400/20' },
]

// kept for backwards-compat with utils.ts getTaskStatusLabel
export const TASK_STATUS_OPTIONS = STATUS_CHIP_OPTIONS

// ── Task questions ──────────────────────────────────────────────────────────

export const CREATE_TASK_QUESTIONS: TaskRegisterQuestion[] = [
  {
    field: 'title',
    question: 'Qual o título da tarefa?',
    placeholder: 'Ex: Implementar fluxo de registro de tarefas no chat.',
    required: true,
    inputType: 'textarea',
  },
  {
    field: 'category',
    question: 'Qual a categoria da tarefa?',
    inputType: 'enum-single',
    enumOptions: CATEGORY_CHIP_OPTIONS,
  },
  {
    field: 'status',
    question: 'Qual o status atual da tarefa?',
    inputType: 'enum-single',
    enumOptions: STATUS_CHIP_OPTIONS,
  },
  {
    field: 'blocked_reason',
    question: 'Por que a tarefa está bloqueada?',
    placeholder: 'Descreva o motivo do bloqueio.',
    inputType: 'textarea',
    condition: (draft) => draft.status === 'blocked',
  },
  {
    field: 'priority',
    question: 'Qual a prioridade da tarefa?',
    inputType: 'enum-single',
    enumOptions: PRIORITY_CHIP_OPTIONS,
  },
  {
    field: 'feature_or_ticket',
    question: 'Há referência de ticket ou feature? Cole aqui se tiver.',
    placeholder: 'Ex: PROJ-123, #42, link do Linear...',
    inputType: 'text',
  },
  {
    field: 'task_summary',
    question: 'Qual é o resumo da tarefa?',
    placeholder: 'Descreva de forma geral e estável o objetivo ou entrega principal desta tarefa.',
    inputType: 'textarea',
  },
  {
    field: 'technical_approach',
    question: 'Como foi implementado tecnicamente?',
    placeholder: 'Ex: Criamos um hook customizado para gerenciar o estado do fluxo de perguntas...',
    inputType: 'textarea',
  },
  {
    field: 'next_steps',
    question: 'Quais os próximos passos para essa tarefa?',
    placeholder: 'Ex: Integrar com o backend, adicionar testes...',
    inputType: 'textarea',
  },
  {
    field: 'people_involved',
    question: 'Quem mais está envolvido nessa tarefa?',
    inputType: 'member-multi',
  },
  {
    field: 'tags',
    question: 'Quais stacks, tecnologias ou ferramentas foram usadas nesta tarefa?',
    placeholder: 'Selecione no componente ou digite tecnologias e ferramentas manualmente...',
    inputType: 'tags',
  },
  {
    field: 'checkpoints',
    question: 'Quer adicionar itens ao checklist desta tarefa?',
    placeholder: 'Ex: Implementar endpoint, Escrever testes, Revisar PR...',
    inputType: 'checklist',
  },
  {
    field: 'hours_worked',
    question: 'Quantas horas foram trabalhadas nessa tarefa?',
    placeholder: 'Ex: 2.5 (em horas)',
    inputType: 'text',
  },
]

export const UPDATE_TASK_QUESTIONS: TaskRegisterQuestion[] = [
  {
    field: 'update_summary',
    question: 'O que foi alterado ou atualizado nesta tarefa?',
    placeholder: 'Descreva exatamente a novidade desta atualização.',
    required: true,
    inputType: 'textarea',
  },
  {
    field: 'update_task_summary',
    question: 'Você quer atualizar o resumo da tarefa também?',
    inputType: 'enum-single',
    enumOptions: SUMMARY_UPDATE_DECISION_OPTIONS,
  },
  {
    field: 'task_summary',
    question: 'Atualize o resumo da tarefa, se necessário.',
    placeholder: 'Edite o resumo geral da tarefa. Este campo começa com o texto atual.',
    inputType: 'textarea',
    condition: (draft) => draft.update_task_summary === 'yes',
  },
  {
    field: 'status',
    question: 'O status mudou? Selecione o novo status.',
    inputType: 'enum-single',
    enumOptions: STATUS_CHIP_OPTIONS,
  },
  {
    field: 'blocked_reason',
    question: 'Por que a tarefa está bloqueada?',
    placeholder: 'Descreva o motivo do bloqueio.',
    inputType: 'textarea',
    condition: (draft) => draft.status === 'blocked',
  },
  {
    field: 'technical_approach',
    question: 'Algum detalhe técnico relevante nessa atualização?',
    placeholder: 'Ex: Mudamos a estratégia de cache para...',
    inputType: 'textarea',
  },
  {
    field: 'next_steps',
    question: 'Quais os próximos passos?',
    placeholder: 'Ex: Revisar PR, testar no staging...',
    inputType: 'textarea',
  },
  {
    field: 'tags',
    question: 'Quais stacks, tecnologias ou ferramentas foram usadas ou revisadas nesta atualização?',
    placeholder: 'Selecione no componente ou digite stacks e ferramentas manualmente...',
    inputType: 'tags',
  },
  {
    field: 'hours_worked',
    question: 'Quantas horas adicionais foram trabalhadas nessa atualização?',
    placeholder: 'Ex: 1.5 (em horas)',
    inputType: 'text',
  },
]
