import StackAutocomplete from '@/components/ui/StackAutocomplete'
import type { ProjectFormState } from '@/types/sobre'
import { normalizeStack } from '@/lib/sobre'
import ColorField from './ColorField'
import DashboardSection from './DashboardSection'
import StatusField from './StatusField'
import TextAreaField from './TextAreaField'
import TextField from './TextField'

export default function AboutEditContent({
  form,
  onFieldChange,
}: {
  form: ProjectFormState
  onFieldChange: (field: keyof ProjectFormState, value: string) => void
}) {
  return (
    <div className="px-5 py-5 sm:px-7 sm:py-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <DashboardSection title="Visão geral" subtitle="Campos principais da tabela projects." className="bg-surface-container/92">
          <div className="grid gap-4">
            <TextField label="Nome" value={form.name} onChange={(value) => onFieldChange('name', value)} />
            <TextAreaField label="Descrição" value={form.description} onChange={(value) => onFieldChange('description', value)} rows={4} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Repositório" value={form.repository_url} onChange={(value) => onFieldChange('repository_url', value)} placeholder="https://github.com/..." />
              <ColorField label="Cor" value={form.color} onChange={(value) => onFieldChange('color', value)} placeholder="#6366F1" />
            </div>
            <StatusField value={form.status} onChange={(value) => onFieldChange('status', value)} />
          </div>
        </DashboardSection>

        <DashboardSection title="Contexto e objetivo" subtitle="Informações de alto nível para a visão editorial do projeto.">
          <div className="grid gap-4">
            <TextAreaField label="Resumo" value={form.summary} onChange={(value) => onFieldChange('summary', value)} rows={4} />
            <TextAreaField label="Objetivo" value={form.goal} onChange={(value) => onFieldChange('goal', value)} rows={4} />
            <TextAreaField label="Escopo" value={form.scope} onChange={(value) => onFieldChange('scope', value)} rows={4} />
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">Stack principal</span>
              <StackAutocomplete
                value={normalizeStack(form.main_stack)}
                onChange={(value) => onFieldChange('main_stack', value.join(', '))}
                placeholder="Busque stacks como React, Python, PostgreSQL..."
                allowCustom
              />
            </div>
          </div>
        </DashboardSection>

        <DashboardSection title="Arquitetura e regras" subtitle="Contexto técnico e regras importantes do domínio.">
          <div className="grid gap-4">
            <TextAreaField label="Resumo da arquitetura" value={form.architecture_summary} onChange={(value) => onFieldChange('architecture_summary', value)} rows={5} />
            <TextAreaField label="Contexto do produto" value={form.product_context} onChange={(value) => onFieldChange('product_context', value)} rows={4} />
            <TextAreaField label="Regras de negócio" value={form.business_rules} onChange={(value) => onFieldChange('business_rules', value)} rows={4} />
          </div>
        </DashboardSection>

        <DashboardSection title="Time, linguagem e links" subtitle="Dados auxiliares e referências externas.">
          <div className="grid gap-4">
            <TextAreaField label="Contexto do time" value={form.team_context} onChange={(value) => onFieldChange('team_context', value)} rows={4} />
            <TextField label="Linguagem padrão" value={form.default_language} onChange={(value) => onFieldChange('default_language', value)} placeholder="pt-BR, en-US..." />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Documentação" value={form.documentation_url} onChange={(value) => onFieldChange('documentation_url', value)} placeholder="https://..." />
              <TextField label="Figma" value={form.figma_url} onChange={(value) => onFieldChange('figma_url', value)} placeholder="https://..." />
              <TextField label="Board" value={form.board_url} onChange={(value) => onFieldChange('board_url', value)} placeholder="https://..." />
              <TextField label="API base URL" value={form.api_base_url} onChange={(value) => onFieldChange('api_base_url', value)} placeholder="https://api..." />
              <TextField label="Deploy URL" value={form.deployment_url} onChange={(value) => onFieldChange('deployment_url', value)} placeholder="https://..." />
            </div>
          </div>
        </DashboardSection>
      </div>
    </div>
  )
}
