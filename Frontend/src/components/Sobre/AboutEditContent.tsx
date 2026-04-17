import StackAutocomplete from '@/components/ui/StackAutocomplete'
import type { ProjectFormState } from '@/types/sobre'
import ColorField from './ColorField'
import DashboardSection from './DashboardSection'
import StatusField from './StatusField'
import TextAreaField from './TextAreaField'
import TextField from './TextField'

const STACK_FIELDS = [
  {
    field: 'frontend_stack',
    label: 'Frontend',
    placeholder: 'React, Vite, Angular, React Native...',
    category: 'frontend_stack',
  },
  {
    field: 'backend_stack',
    label: 'Backend',
    placeholder: 'Node.js, FastAPI, NestJS, Django...',
    category: 'backend_stack',
  },
  {
    field: 'infra_stack',
    label: 'Infra/Cloud',
    placeholder: 'AWS, Docker, Kubernetes, Terraform...',
    category: 'infra_stack',
  },
  {
    field: 'database_stack',
    label: 'Banco de Dados',
    placeholder: 'PostgreSQL, Redis, MongoDB, SQL Server...',
    category: 'database_stack',
  },
  {
    field: 'other_stack',
    label: 'Outras tecnologias',
    placeholder: 'Itens legados, libs específicas ou termos customizados...',
    category: 'other_stack',
  },
] as const

export default function AboutEditContent({
  form,
  onFieldChange,
}: {
  form: ProjectFormState
  onFieldChange: <K extends keyof ProjectFormState>(field: K, value: ProjectFormState[K]) => void
}) {
  const hasStructuredArchitecture = Boolean(
    form.architecture_frontend ||
      form.architecture_backend ||
      form.architecture_integrations ||
      form.architecture_data ||
      form.architecture_infra,
  )
  const hasStructuredRules = Boolean(
    form.business_rules_core ||
      form.business_rules_permissions ||
      form.business_rules_validations ||
      form.business_rules_constraints,
  )

  return (
    <div className="px-5 py-5 sm:px-7 sm:py-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">

        {/* Left column — mirrors read mode left column */}
        <div className="flex flex-col gap-5">
          <DashboardSection id="edit-overview" title="Visão geral" subtitle="Dados principais do projeto para identificação e navegação.">
            <div className="grid gap-4">
              <TextField label="Nome" value={form.name} onChange={(value) => onFieldChange('name', value)} />
              <TextAreaField label="Descrição" value={form.description} onChange={(value) => onFieldChange('description', value)} rows={3} />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Repositório" value={form.repository_url} onChange={(value) => onFieldChange('repository_url', value)} placeholder="https://github.com/..." />
                <ColorField label="Cor" value={form.color} onChange={(value) => onFieldChange('color', value)} placeholder="#6366F1" />
              </div>
              <StatusField value={form.status} onChange={(value) => onFieldChange('status', value)} />
            </div>
          </DashboardSection>

          <DashboardSection id="edit-context" title="Contexto e direção" subtitle="Resumo executivo, objetivo e escopo para alinhar o entendimento do projeto.">
            <div className="grid gap-4">
              <TextAreaField label="Resumo do projeto" value={form.summary} onChange={(value) => onFieldChange('summary', value)} rows={3} />
              <TextAreaField label="Objetivo principal" value={form.goal} onChange={(value) => onFieldChange('goal', value)} rows={3} />
              <TextAreaField label="Escopo" value={form.scope} onChange={(value) => onFieldChange('scope', value)} rows={3} />
            </div>
          </DashboardSection>

          <DashboardSection id="edit-architecture" title="Arquitetura do sistema" subtitle="Separe a visão técnica por blocos para deixar a leitura mais escaneável.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {!hasStructuredArchitecture && form.architecture_summary && (
                <div className="col-span-full rounded-2xl border border-amber-400/14 bg-amber-400/6 px-4 py-3.5 text-sm leading-6 text-white/68">
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-amber-200/70 uppercase">Resumo legado atual</p>
                  <p className="mt-2">{form.architecture_summary}</p>
                </div>
              )}
              <TextAreaField label="Frontend" value={form.architecture_frontend} onChange={(value) => onFieldChange('architecture_frontend', value)} rows={5} />
              <TextAreaField label="Backend" value={form.architecture_backend} onChange={(value) => onFieldChange('architecture_backend', value)} rows={5} />
              <TextAreaField label="Integrações" value={form.architecture_integrations} onChange={(value) => onFieldChange('architecture_integrations', value)} rows={5} />
              <TextAreaField label="Dados" value={form.architecture_data} onChange={(value) => onFieldChange('architecture_data', value)} rows={5} />
              <TextAreaField label="Infraestrutura" value={form.architecture_infra} onChange={(value) => onFieldChange('architecture_infra', value)} rows={5} />
              <TextAreaField label="Contexto do produto" value={form.product_context} onChange={(value) => onFieldChange('product_context', value)} rows={5} />
            </div>
          </DashboardSection>

          <DashboardSection id="edit-rules" title="Regras e operação" subtitle="Organize decisões do domínio por tipo para consulta rápida do time.">
            <div className="grid gap-4 md:grid-cols-2">
              {!hasStructuredRules && form.business_rules && (
                <div className="col-span-full rounded-2xl border border-amber-400/14 bg-amber-400/6 px-4 py-3.5 text-sm leading-6 text-white/68">
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-amber-200/70 uppercase">Regras legadas atuais</p>
                  <p className="mt-2">{form.business_rules}</p>
                </div>
              )}
              <TextAreaField label="Regras principais" value={form.business_rules_core} onChange={(value) => onFieldChange('business_rules_core', value)} rows={5} />
              <TextAreaField label="Permissões e papéis" value={form.business_rules_permissions} onChange={(value) => onFieldChange('business_rules_permissions', value)} rows={5} />
              <TextAreaField label="Validações" value={form.business_rules_validations} onChange={(value) => onFieldChange('business_rules_validations', value)} rows={5} />
              <TextAreaField label="Restrições e exceções" value={form.business_rules_constraints} onChange={(value) => onFieldChange('business_rules_constraints', value)} rows={5} />
              <TextAreaField label="Contexto do time" value={form.team_context} onChange={(value) => onFieldChange('team_context', value)} rows={5} />
            </div>
          </DashboardSection>
        </div>

        {/* Right sidebar — mirrors read mode sidebar */}
        <div className="flex flex-col gap-5">
          <DashboardSection id="edit-stack" title="Stack principal" subtitle="Tecnologias separadas por categoria para facilitar leitura e filtros futuros.">
            <div className="grid gap-4">
              {STACK_FIELDS.map(({ field, label, placeholder, category }) => (
                <div key={field} className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">{label}</span>
                  <StackAutocomplete
                    value={form[field]}
                    onChange={(value) => onFieldChange(field, value)}
                    placeholder={placeholder}
                    category={category}
                    allowCustom
                  />
                </div>
              ))}
            </div>
          </DashboardSection>

          <DashboardSection id="edit-links" title="Idioma e links" subtitle="Referências externas e convenções de comunicação do projeto.">
            <div className="grid gap-4">
              <TextField label="Linguagem padrão" value={form.default_language} onChange={(value) => onFieldChange('default_language', value)} placeholder="pt-BR, en-US..." />
              <TextField label="Documentação" value={form.documentation_url} onChange={(value) => onFieldChange('documentation_url', value)} placeholder="https://..." />
              <TextField label="Figma" value={form.figma_url} onChange={(value) => onFieldChange('figma_url', value)} placeholder="https://..." />
              <TextField label="Quadro" value={form.board_url} onChange={(value) => onFieldChange('board_url', value)} placeholder="https://..." />
              <TextField label="Base da API" value={form.api_base_url} onChange={(value) => onFieldChange('api_base_url', value)} placeholder="https://api..." />
              <TextField label="Ambiente publicado" value={form.deployment_url} onChange={(value) => onFieldChange('deployment_url', value)} placeholder="https://..." />
            </div>
          </DashboardSection>
        </div>
      </div>
    </div>
  )
}
