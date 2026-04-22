import { useState } from 'react'
import type {
  QueryAnswerPayload,
  QueryAnswerReference,
  QueryPanelPayload,
  QueryRunDTO,
} from '@/data/dtos'
import { useNavigate } from 'react-router-dom'
import { CATEGORY_CHIP_OPTIONS, PRIORITY_CHIP_OPTIONS } from '@/pages/Chat/constants'
import type { QueryQuestionOption } from '@/pages/Chat/types'

type Tone = NonNullable<QueryPanelPayload['metrics'][number]['tone']>

function toneText(tone: Tone | undefined): string {
  switch (tone) {
    case 'accent': return 'text-violet-300'
    case 'success': return 'text-emerald-300'
    case 'warning': return 'text-amber-300'
    case 'danger': return 'text-orange-200'
    case 'muted': return 'text-slate-200'
    default: return 'text-white/82'
  }
}

function toneBg(tone: Tone | undefined): string {
  switch (tone) {
    case 'accent': return 'border-violet-400/18 bg-violet-400/8'
    case 'success': return 'border-emerald-400/18 bg-emerald-400/8'
    case 'warning': return 'border-amber-400/18 bg-amber-400/8'
    case 'danger': return 'border-orange-400/18 bg-orange-400/8'
    case 'muted': return 'border-slate-300/12 bg-slate-300/7'
    default: return 'border-white/7 bg-white/[0.035]'
  }
}

function statusLabel(status?: QueryRunDTO['status'] | null): string {
  if (!status) return 'Aguardando'
  return {
    pending: 'Pendente',
    running: 'Analisando',
    completed: 'Respondida',
    failed: 'Falhou',
    cancelled: 'Cancelada',
  }[status]
}

function fallbackPanelFromAnswer(
  answerPayload?: QueryAnswerPayload | null,
  references?: QueryAnswerReference[] | null,
): QueryPanelPayload | null {
  if (!answerPayload) return null

  const safeReferences = references?.length ? references : answerPayload.references
  return {
    presentation_version: 1,
    panel_kind: answerPayload.answer_kind,
    title: 'Indicadores da consulta',
    summary_metric: {
      label: 'Itens citados',
      value: safeReferences.length,
      tone: safeReferences.length > 0 ? 'accent' : 'muted',
    },
    metrics: [
      { label: 'Insights', value: answerPayload.insights.length, tone: 'default' },
    ],
    chips: [
      { label: answerPayload.answer_kind.replaceAll('_', ' '), tone: 'accent' },
      ...answerPayload.insights.slice(0, 4).map((insight) => ({
        label: insight.label,
        tone: insight.tone ?? 'default',
      })),
    ],
    groups: safeReferences.length
      ? [
          {
            title: 'Fontes principais',
            type: 'source_list',
            items: safeReferences.slice(0, 5).map((reference) => ({
              label: reference.task_title ?? 'Fonte',
              value: getReferenceSourceLabel(reference.source_type, reference.update_type),
              tone: reference.task_status === 'blocked' ? 'danger' : 'default',
              preview: reference.preview,
              task_id: reference.task_id,
              source_type: reference.source_type,
              update_type: reference.update_type,
              source_label: getReferenceSourceLabel(reference.source_type, reference.update_type),
            })),
          },
        ]
      : [],
  }
}

function getReferenceSourceLabel(sourceType?: string | null, updateType?: string | null) {
  if (sourceType === 'task_snapshot') return 'Estado atual'
  if (sourceType === 'task_update') return updateType === 'created' ? 'Criação' : 'Atualização'
  if (sourceType === 'task') return 'Registro'
  return null
}

function categoryMeta(value: string) {
  return CATEGORY_CHIP_OPTIONS.find((option) => option.value === value)
}

function priorityMeta(value: string) {
  return PRIORITY_CHIP_OPTIONS.find((option) => option.value === value)
}

function colorClassForGroupItem(groupTitle: string, label: string, tone?: Tone): string {
  if (groupTitle === 'Categorias') {
    return categoryMeta(label)?.colorClass ?? toneBg(tone)
  }
  if (groupTitle === 'Prioridades') {
    return priorityMeta(label)?.colorClass ?? toneBg(tone)
  }
  return toneBg(tone)
}

function labelForGroupItem(groupTitle: string, label: string): string {
  if (groupTitle === 'Categorias') return categoryMeta(label)?.label ?? label
  if (groupTitle === 'Prioridades') return priorityMeta(label)?.label ?? label
  return label
}

function categoryBarClass(value: string): string {
  switch (value) {
    case 'feature': return 'bg-indigo-300'
    case 'bug_fix': return 'bg-red-300'
    case 'refactor': return 'bg-amber-300'
    case 'test': return 'bg-cyan-300'
    case 'ui_ux': return 'bg-violet-300'
    case 'docs': return 'bg-slate-300'
    case 'infra': return 'bg-orange-300'
    case 'research': return 'bg-teal-300'
    default: return 'bg-white/40'
  }
}

function PanelMetric({ metric }: { metric: QueryPanelPayload['summary_metric'] }) {
  return (
    <div
      className={[
        'rounded-[3px] border px-3.5 py-3 bg-linear-to-br from-white/[0.045] to-white/[0.018]',
        toneBg(metric.tone),
      ].join(' ')}
    >
      <p className="text-[10px] font-semibold tracking-[0.18em] text-white/28 uppercase">
        {metric.label}
      </p>
      <p
        className={[
          'mt-2 text-2xl',
          'font-semibold tracking-[-0.03em]',
          toneText(metric.tone),
        ].join(' ')}
      >
        {metric.value}
      </p>
    </div>
  )
}

const SOURCE_COLLAPSE_THRESHOLD = 4

function PanelGroup({ group, onTaskClick }: { group: QueryPanelPayload['groups'][number]; onTaskClick: (taskId: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  if (!group.items.length) return null

  if (group.type === 'tag_list') {
    return (
      <section className="rounded-[3px] border border-white/5 bg-surface-base/72 p-4">
        <p className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">
          {group.title}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {group.items.map((item, index) => (
            <span
              key={`${group.title}-${item.label}-${index}`}
              className={[
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.11em] uppercase',
                colorClassForGroupItem(group.title, item.label, item.tone),
              ].join(' ')}
            >
              {labelForGroupItem(group.title, item.label)}
              {item.value ? (
                <span className="text-white/30">{item.value}</span>
              ) : null}
            </span>
          ))}
        </div>
      </section>
    )
  }

  if (group.title === 'Categorias') {
    return (
      <section className="rounded-[3px] border border-white/5 bg-surface-base/72 p-4">
        <p className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">
          {group.title}
        </p>
        <div className="mt-3 space-y-3">
          {group.items.map((item, index) => {
            const percent = item.percent ?? 0
            const label = labelForGroupItem(group.title, item.label)
            return (
              <div key={`${group.title}-${item.label}-${index}`}>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <span
                    className={[
                      'rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.1em] uppercase',
                      colorClassForGroupItem(group.title, item.label, item.tone),
                    ].join(' ')}
                  >
                    {label}
                  </span>
                  <span className="text-[11px] font-semibold text-white/46">
                    {percent}% · {item.value}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.045]">
                  <div
                    className={['h-full rounded-full opacity-80', categoryBarClass(item.label)].join(' ')}
                    style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>
    )
  }

  if (group.title === 'Criticidade') {
    return (
      <section className="rounded-[3px] border border-white/5 bg-surface-base/72 p-4">
        <p className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">
          {group.title}
        </p>
        <div className="mt-3 overflow-hidden rounded-[8px] border border-white/6">
          {group.items.map((item, index) => (
            <div
              key={`${group.title}-${item.label}-${index}`}
              className="flex items-center justify-between gap-3 border-b border-white/5 px-3 py-2.5 last:border-b-0"
            >
              <p className="min-w-0 truncate text-[12px] font-medium text-white/70">
                {item.label}
              </p>
              <span className={['shrink-0 text-[12px] font-semibold', toneText(item.tone)].join(' ')}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </section>
    )
  }

  const isSourceList = group.type === 'source_list'
  const showExpander = isSourceList && group.items.length > SOURCE_COLLAPSE_THRESHOLD
  const visibleItems = showExpander && !expanded
    ? group.items.slice(0, SOURCE_COLLAPSE_THRESHOLD)
    : group.items

  return (
    <section className="rounded-[3px] border border-white/5 bg-surface-base/72 p-4">
      <p className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">
        {group.title}
      </p>
      <div className="mt-3 space-y-2.5">
        {visibleItems.map((item, index) => (
          <div key={`${group.title}-${item.label}-${index}`} className="border-b border-white/4 pb-2.5 last:border-0 last:pb-0">
            {isSourceList && item.task_id ? (
              <button
                type="button"
                onClick={() => onTaskClick(item.task_id!)}
                className="w-full text-left"
              >
                <SourceItem item={item} />
              </button>
            ) : isSourceList ? (
              <SourceItem item={item} />
            ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-[12px] font-medium text-white/74">
                {item.label}
              </p>
              {item.value !== undefined && item.value !== null && item.value !== '' ? (
                <span className={['shrink-0 text-[12px] font-semibold', toneText(item.tone)].join(' ')}>
                  {item.value}
                </span>
              ) : null}
            </div>
            )}
          </div>
        ))}
      </div>
      {showExpander ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-2 w-full rounded-[6px] border border-white/8 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-white/36 uppercase transition hover:border-white/14 hover:text-white/68"
        >
          {expanded ? 'Ver menos' : `Ver todos (${group.items.length})`}
        </button>
      ) : null}
    </section>
  )
}

function SourceItem({ item }: { item: QueryPanelPayload['groups'][number]['items'][number] }) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-[12px] font-medium text-white/74 transition-colors hover:text-white/88">
          {item.label}
        </p>
        {item.source_label ? (
          <span className="shrink-0 rounded-full border border-white/8 bg-white/[0.035] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white/40">
            {item.source_label}
          </span>
        ) : null}
      </div>
      {item.preview ? (
        <p className="mt-1 line-clamp-2 text-[11px] leading-5 text-white/34">
          {item.preview}
        </p>
      ) : null}
    </>
  )
}

export default function QueryContextPanel({
  selectedQuestion,
  activeRun,
  activeRunBusy,
  panelPayload,
  fallbackAnswerPayload,
  references,
  onClose,
}: {
  selectedQuestion: QueryQuestionOption
  activeRun: QueryRunDTO | null
  activeRunBusy: boolean
  panelPayload?: QueryPanelPayload | null
  fallbackAnswerPayload?: QueryAnswerPayload | null
  references?: QueryAnswerReference[] | null
  onClose: () => void
}) {
  const navigate = useNavigate()
  const payload = panelPayload ?? fallbackPanelFromAnswer(fallbackAnswerPayload, references)
  const metrics = payload ? [payload.summary_metric, ...payload.metrics].slice(0, 4) : []
  const taskCount = payload?.summary_metric.value ?? 0

  return (
    <div className="chat-panel-card flex h-full min-h-0 flex-col p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-white/86">Indicadores</p>
          <p className="mt-1 text-[11px] text-white/32">{statusLabel(activeRun?.status)}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar painel"
          className="flex h-7 w-7 items-center justify-center rounded-[6px] border border-white/8 bg-surface-high text-white/40 transition-[border-color,color] duration-150 hover:border-white/16 hover:text-white/72"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>

      <div className="chat-scroll min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        <section className="rounded-[3px] border border-white/5 bg-surface-base/72 p-4">
          <p className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">Consulta atual</p>
          <p className="mt-2 text-[13px] font-semibold leading-5 text-white/78">
            {selectedQuestion.label}
          </p>
          <p className="mt-1 text-[11px] leading-5 text-white/36">
            {activeRun?.status ? statusLabel(activeRun.status) : 'Pronta para consulta'}
          </p>
        </section>

        {activeRunBusy ? (
          <section className="rounded-[3px] border border-accent-indigo/12 bg-accent-indigo/7 p-4">
            <div className="flex items-center gap-2">
              <span className="query-dot h-2 w-2 rounded-full bg-indigo-300/80" />
              <span className="query-dot h-2 w-2 rounded-full bg-violet-300/80 [animation-delay:120ms]" />
              <span className="query-dot h-2 w-2 rounded-full bg-sky-300/80 [animation-delay:240ms]" />
            </div>
            <p className="mt-3 text-[13px] font-semibold text-white/78">Analisando memória</p>
            <p className="mt-1 text-[11px] leading-5 text-white/38">Buscando registros, fontes e indicadores complementares.</p>
          </section>
        ) : null}

        {!activeRunBusy && !payload ? (
          <section className="rounded-[3px] border border-dashed border-white/8 bg-surface-base/52 p-4">
            <p className="text-[13px] font-semibold text-white/68">Nenhuma resposta selecionada</p>
            <p className="mt-1 text-[11px] leading-5 text-white/34">Os indicadores aparecem aqui depois que a consulta for respondida.</p>
          </section>
        ) : null}

        {payload ? (
          <>
            {metrics.length > 0 ? (
              <section className="grid grid-cols-2 gap-2">
                {metrics.map((metric, index) => (
                  <PanelMetric key={`${metric.label}-${index}`} metric={metric} />
                ))}
              </section>
            ) : null}

            <p className="px-1 text-[11px] leading-5 text-white/30">
              Baseado em {taskCount} tarefa(s) recuperada(s) nesta consulta.
            </p>

            {payload.chips.length > 0 ? (
              <section className="rounded-[3px] border border-white/5 bg-surface-base/72 p-4">
                <p className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">Tags e sinais</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {payload.chips.map((chip, index) => (
                    <span
                      key={`${chip.label}-${index}`}
                      className={[
                        'rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] uppercase',
                        toneBg(chip.tone),
                        toneText(chip.tone),
                      ].join(' ')}
                    >
                      {chip.label}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            {payload.groups.map((group) => (
              <PanelGroup
                key={`${group.title}-${group.type}`}
                group={group}
                onTaskClick={(taskId) => navigate(`/tasks/${taskId}`)}
              />
            ))}
          </>
        ) : null}
      </div>
    </div>
  )
}
