import { useState } from 'react'
import type {
  QueryAnswerPayload,
  QueryAnswerSection,
  QueryAnswerTone,
} from '@/data/dtos'
import { formatRelativeDate } from '@/components/Tasks/utils'
import { CATEGORY_CHIP_OPTIONS } from '@/pages/Chat/constants'
import LogoAvatar from './LogoAvatar'
import UserAvatar from './UserAvatar'

export interface QueryConversationMessageItem {
  id: string
  sender: 'assistant' | 'user' | 'system'
  content: string
  messageType: string
  metadata?: Record<string, unknown> | null
  state?: 'default' | 'sending' | 'pending' | 'error' | 'cancelled'
}

function statusTone(statusValue?: string | null): QueryAnswerTone {
  switch (statusValue) {
    case 'done': return 'success'
    case 'blocked': return 'danger'
    case 'in_progress': return 'warning'
    case 'todo': return 'muted'
    case 'cancelled': return 'muted'
    default: return 'default'
  }
}

function statusDotColor(tone: QueryAnswerTone | undefined): string {
  switch (tone) {
    case 'accent': return 'bg-violet-400'
    case 'success': return 'bg-emerald-400'
    case 'warning': return 'bg-amber-300'
    case 'danger': return 'bg-orange-300'
    case 'muted': return 'bg-slate-300'
    default: return 'bg-white/40'
  }
}

function statusTextColor(tone: QueryAnswerTone | undefined): string {
  switch (tone) {
    case 'accent': return 'text-violet-300'
    case 'success': return 'text-emerald-300'
    case 'warning': return 'text-amber-200'
    case 'danger': return 'text-orange-200'
    case 'muted': return 'text-slate-200'
    default: return 'text-white/50'
  }
}

function timelineDotClass(status?: string | null, tone?: QueryAnswerTone | null): string {
  const resolvedTone = statusTone(status) ?? tone ?? 'default'
  switch (resolvedTone) {
    case 'success': return 'bg-emerald-300 shadow-[0_0_0_4px_rgba(52,211,153,0.14)]'
    case 'warning': return 'bg-amber-300 shadow-[0_0_0_4px_rgba(251,191,36,0.13)]'
    case 'danger': return 'bg-orange-300 shadow-[0_0_0_4px_rgba(251,146,60,0.14)]'
    case 'muted': return 'bg-slate-300 shadow-[0_0_0_4px_rgba(148,163,184,0.10)]'
    case 'accent': return 'bg-indigo-300 shadow-[0_0_0_4px_rgba(99,102,241,0.14)]'
    default: return 'bg-white/36 shadow-[0_0_0_4px_rgba(255,255,255,0.06)]'
  }
}

function timelineBadgeClass(tone?: QueryAnswerTone | null): string {
  switch (tone) {
    case 'success': return 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
    case 'warning': return 'border-amber-400/20 bg-amber-400/10 text-amber-300'
    case 'danger': return 'border-orange-400/20 bg-orange-400/10 text-orange-300'
    case 'muted': return 'border-slate-400/16 bg-slate-400/8 text-slate-300'
    case 'accent': return 'border-indigo-400/20 bg-indigo-400/10 text-indigo-300'
    default: return 'border-white/8 bg-white/[0.035] text-white/44'
  }
}

function categoryOption(value?: string | null) {
  if (!value) return null
  return CATEGORY_CHIP_OPTIONS.find((option) => option.value === value) ?? null
}

function categoryTitleClass(value?: string | null): string {
  return categoryOption(value)?.colorClass ?? 'text-white/48 bg-white/[0.035] border-white/8'
}

function categoryLabel(value?: string | null): string {
  return categoryOption(value)?.label ?? value ?? ''
}

function timelineDateLabel(value?: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return formatRelativeDate(value)
}

function blockerSeverityClass(severity?: string | null): string {
  switch (severity) {
    case 'critical': return 'border-orange-300/24 bg-orange-400/10 text-orange-200'
    case 'high': return 'border-amber-300/22 bg-amber-400/10 text-amber-200'
    case 'medium': return 'border-yellow-300/18 bg-yellow-400/8 text-yellow-200'
    case 'low': return 'border-slate-300/14 bg-slate-300/7 text-slate-200'
    default: return 'border-white/8 bg-white/[0.035] text-white/58'
  }
}

function BlockerListBlock({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null
  return (
    <div className="rounded-[12px] border border-white/6 bg-black/10 p-3">
      <p className="text-[10px] font-semibold tracking-[0.18em] text-white/34 uppercase">
        {title}
      </p>
      <ul className="mt-2 space-y-1.5">
        {items.map((entry, index) => (
          <li key={`${title}-${index}`} className="flex gap-2 text-[12px] leading-5 text-white/58">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-orange-200/50" />
            <span>{entry}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ReportSection({ section }: { section: QueryAnswerSection }) {
  const [expanded, setExpanded] = useState(!section.collapsed)
  const items = expanded ? section.items : section.items.slice(0, 4)
  const canCollapse = section.collapsed && section.items.length > 4
  const compactStatusValue = (value?: string | number | null) => {
    if (section.type !== 'status_list') return value
    if (typeof value !== 'string') return value
    return value.length > 28 ? null : value
  }

  return (
    <section className="border-t border-white/5 pt-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          {section.id.startsWith('category-') ? (
            <div className="flex items-center gap-2">
              <span
                className={[
                  'inline-flex rounded-full border px-3 py-1.5 text-[11px] font-bold tracking-[0.16em] uppercase shadow-[0_0_18px_rgba(255,255,255,0.025)]',
                  categoryTitleClass(section.title),
                ].join(' ')}
              >
                {categoryLabel(section.title)}
              </span>
            </div>
          ) : (
            <p className="text-[10px] font-semibold tracking-[0.2em] text-white/24 uppercase">
              {section.title}
            </p>
          )}
          {section.subtitle ? (
            <p className="mt-1 text-[12px] leading-5 text-white/38">
              {section.subtitle}
            </p>
          ) : null}
        </div>

        {canCollapse ? (
          <button
            type="button"
            onClick={() => setExpanded((c) => !c)}
            className="inline-flex h-7 items-center rounded-[6px] border border-white/8 px-2.5 text-[11px] font-semibold tracking-[0.12em] text-white/38 uppercase transition hover:border-white/14 hover:text-white/68"
          >
            {expanded ? 'Ver menos' : 'Ver mais'}
          </button>
        ) : null}
      </div>

      {section.type === 'highlights' ? (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={item.id ?? `${section.id}-highlight-${index}`}
              className="border-l-2 border-white/[0.07] pl-3"
            >
              {item.eyebrow ? (
                <p className="mb-1 text-[10px] font-semibold tracking-widest text-accent-indigo/60 uppercase">
                  {item.eyebrow}
                </p>
              ) : null}
              <p className="text-[14px] font-semibold text-white/88">
                {item.title ?? 'Highlight'}
              </p>
              {item.description ? (
                <p className="mt-1 text-[13px] leading-6 text-white/52">
                  {item.description}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {section.type === 'task_cards' ? (
        <div className="space-y-0">
          {items.map((item, index) => (
            <div
              key={item.id ?? `${section.id}-task-${index}`}
              className="flex items-start gap-3 border-b border-white/4 py-2 last:border-0"
            >
              <span
                className={[
                  'mt-1.25 h-1.5 w-1.5 shrink-0 rounded-full',
                  statusDotColor(statusTone(item.status)),
                ].join(' ')}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium leading-5 text-white/86">
                  {item.title ?? 'Tarefa'}
                </p>
                {item.summary ? (
                  <p className="mt-0.5 line-clamp-2 text-[12px] leading-5 text-white/42">
                    {item.summary}
                  </p>
                ) : null}
              </div>
              {item.status_label ? (
                <span
                  className={[
                    'shrink-0 text-[10px] font-semibold tracking-wide',
                    statusTextColor(statusTone(item.status)),
                  ].join(' ')}
                >
                  {item.status_label}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {section.type === 'timeline' ? (
        <div className="space-y-0">
          {items.map((item, index) => (
            <div key={item.id ?? `${section.id}-timeline-${index}`} className="flex gap-3">
              <div className="flex shrink-0 flex-col items-center">
                <span
                  className={[
                    'mt-4 h-2.5 w-2.5 rounded-full',
                    timelineDotClass(item.status, item.tone),
                  ].join(' ')}
                />
                {index < items.length - 1 ? (
                  <span className="mt-1 w-px flex-1 rounded-full bg-linear-to-b from-white/10 to-white/4" />
                ) : null}
              </div>

              <div className={['min-w-0 flex-1', index < items.length - 1 ? 'pb-3' : ''].join(' ')}>
                <div className="rounded-[14px] border border-white/6 bg-surface-container/40 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.badge ? (
                      <span
                        className={[
                          'rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] uppercase',
                          categoryOption(item.badge)
                            ? categoryTitleClass(item.badge)
                            : timelineBadgeClass(item.tone ?? statusTone(item.status)),
                        ].join(' ')}
                      >
                        {categoryLabel(item.badge)}
                      </span>
                    ) : null}
                    {item.label ? (
                      <span className={['text-[10px] font-semibold tracking-wide', statusTextColor(statusTone(item.status))].join(' ')}>
                        {item.label}
                      </span>
                    ) : null}
                    {item.value ? (
                      <span className="rounded-full border border-white/8 bg-white/[0.025] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white/44">
                        {item.value}
                      </span>
                    ) : null}
                    {timelineDateLabel(item.eyebrow) ? (
                      <span className="text-[11px] text-white/28">
                        {timelineDateLabel(item.eyebrow)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-[14px] font-medium leading-5 text-white/82">
                    {item.title ?? 'Evento'}
                  </p>
                  {item.description ? (
                    <p className="mt-1.5 text-[13px] leading-5 text-white/48">
                      {item.description}
                    </p>
                  ) : null}
                  {item.summary && item.summary !== item.description ? (
                    <p className="mt-2 line-clamp-3 font-mono text-xs leading-5 text-white/34">
                      {item.summary}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {section.type === 'status_list' ? (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={item.id ?? `${section.id}-status-${index}`}
              className="rounded-[3px] border border-white/5 bg-white/[0.018] p-3.5"
            >
              <div className="flex items-start gap-3">
                <span
                  className={[
                    'mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
                    statusDotColor(statusTone(item.status) ?? item.tone ?? 'default'),
                  ].join(' ')}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="min-w-0 text-[14px] font-medium leading-5 text-white/84">
                      {item.title ?? item.label ?? 'Bloqueio'}
                    </p>
                    {item.label && item.title && item.label !== item.title ? (
                      <span className="rounded-full border border-white/8 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white/34">
                        {item.label}
                      </span>
                    ) : null}
                    {item.status_label ? (
                      <span className={['text-[10px] font-semibold tracking-wide', statusTextColor(statusTone(item.status))].join(' ')}>
                        {item.status_label}
                      </span>
                    ) : null}
                  </div>
                  {item.description ? (
                    <p className="mt-1.5 text-[12px] leading-5 text-white/44">
                      {item.description}
                    </p>
                  ) : null}
                  {compactStatusValue(item.value) ? (
                    <p className={['mt-2 text-[12px] leading-5', statusTextColor(item.tone ?? 'default')].join(' ')}>
                      {compactStatusValue(item.value)}
                    </p>
                  ) : null}
                </div>
              </div>
              {typeof item.value === 'string' && item.value.length > 28 ? (
                <p className="mt-3 border-t border-white/5 pt-3 text-[12px] leading-5 text-amber-100/72">
                  {item.value}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {section.type === 'blocker_cards' ? (
        <div className="space-y-4">
          {items.map((item, index) => (
            <article
              key={item.id ?? `${section.id}-blocker-${index}`}
              className="rounded-[18px] border border-orange-300/12 bg-[linear-gradient(145deg,rgba(251,146,60,0.085),rgba(255,255,255,0.018)_42%,rgba(10,12,20,0.18))] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.18)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold leading-5 text-white/88">
                    {item.title ?? 'Bloqueio'}
                  </p>
                  {item.summary ? (
                    <p className="mt-1.5 max-w-2xl text-[12px] leading-5 text-white/42">
                      {item.summary}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {item.days_blocked !== undefined ? (
                    <span className="rounded-full border border-white/8 bg-white/[0.035] px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white/48">
                      {item.days_blocked}d bloqueado
                    </span>
                  ) : null}
                  {item.severity_label ? (
                    <span className={['rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide', blockerSeverityClass(item.severity)].join(' ')}>
                      {item.severity_label}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <BlockerListBlock title="Causa" items={item.causes} />
                <BlockerListBlock title="Impacto" items={item.impacts} />
              </div>

              <div className="mt-3 rounded-[12px] border border-emerald-300/10 bg-emerald-400/[0.045] p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-emerald-200/58 uppercase">
                    Como destravar
                  </p>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {(item.actions?.length ? item.actions : ['Definir próximo passo concreto para remover o bloqueio.']).map((entry, actionIndex) => (
                    <li key={`${section.id}-action-${index}-${actionIndex}`} className="flex gap-2 text-[12px] leading-5 text-emerald-50/68">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-emerald-300/70" />
                      <span>{entry}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {section.type === 'bullet_list' ? (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={item.id ?? `${section.id}-bullet-${index}`}
              className="flex gap-2 text-[13px] leading-6 text-white/62"
            >
              <span className="mt-2.25 h-1 w-1 shrink-0 rounded-full bg-white/30" />
              <span className="min-w-0 wrap-break-word">
                {item.text ?? item.description ?? item.content ?? ''}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {section.type === 'rich_text' ? (
        <div className="space-y-3">
          {items.map((item, index) => (
            <p
              key={item.id ?? `${section.id}-rich-${index}`}
              className="whitespace-pre-wrap text-[14px] leading-7 text-white/66"
            >
              {item.content ?? item.description ?? ''}
            </p>
          ))}
        </div>
      ) : null}

      {section.type === 'executive_summary' ? (
        <div className="space-y-3">
          {items.map((item, index) => (
            <article
              key={item.id ?? `${section.id}-executive-${index}`}
              className="overflow-hidden rounded-[18px] border border-emerald-300/12 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.12),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018))] p-5"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-emerald-300/16 bg-emerald-300/8 px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] text-emerald-200 uppercase">
                  {item.maturity_label ?? 'Síntese'}
                </span>
                <span className="text-[10px] font-semibold tracking-[0.18em] text-white/28 uppercase">
                  leitura executiva
                </span>
              </div>
              {item.content ? (
                <p className="text-[14px] leading-7 text-white/68">
                  {item.content}
                </p>
              ) : null}
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {item.bottleneck ? (
                  <div className="rounded-xl border border-orange-300/14 bg-orange-300/5.5 p-3">
                    <p className="text-[10px] font-semibold tracking-[0.16em] text-orange-200/58 uppercase">
                      Foco de atenção
                    </p>
                    <p className="mt-1.5 text-[14px] font-semibold text-orange-100/84">
                      {item.bottleneck}
                    </p>
                  </div>
                ) : null}
                {item.recommendation ? (
                  <div className="rounded-xl border border-indigo-300/14 bg-indigo-300/5.5 p-3">
                    <p className="text-[10px] font-semibold tracking-[0.16em] text-indigo-200/58 uppercase">
                      Próxima decisão técnica
                    </p>
                    <p className="mt-1.5 text-[14px] font-semibold text-indigo-100/84">
                      {item.recommendation}
                    </p>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {section.type === 'empty_state' ? (
        <div className="py-4 text-center">
          {items[0]?.title ? (
            <p className="text-[14px] font-medium text-white/60">
              {items[0].title}
            </p>
          ) : null}
          {items[0]?.description ? (
            <p className="mx-auto mt-1.5 max-w-xl text-[13px] leading-6 text-white/36">
              {items[0].description}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

function QueryReport({ payload }: { payload: QueryAnswerPayload }) {
  return (
    <div className="space-y-4">
      <header>
        <p className="text-[10px] font-semibold tracking-[0.24em] text-accent-indigo/60 uppercase">
          {payload.answer_kind.replaceAll('_', ' ')}
        </p>
        <h3 className="mt-2 text-[20px] font-semibold tracking-[-0.02em] text-white/90">
          {payload.title}
        </h3>
        <p className="mt-2 max-w-3xl text-[14px] leading-7 text-white/56">
          {payload.summary}
        </p>
      </header>

      <div className="space-y-4">
        {payload.sections.map((section) => (
          <ReportSection key={section.id} section={section} />
        ))}
      </div>

    </div>
  )
}

export default function QueryConversationMessage({
  message,
  userInitials,
}: {
  message: QueryConversationMessageItem
  userInitials: string
}) {
  const isUser = message.sender === 'user'
  const isPending = message.state === 'pending'
  const isError = message.state === 'error'
  const isCancelled = message.state === 'cancelled'
  const isSending = message.state === 'sending'
  const answerPayload =
    message.metadata && typeof message.metadata === 'object' && 'answer_payload' in message.metadata
      ? (message.metadata.answer_payload as QueryAnswerPayload | undefined)
      : undefined

  return (
    <div
      className={[
        'chat-card-enter flex items-start gap-4',
        isUser ? 'justify-end' : '',
      ].join(' ')}
    >
      {!isUser && <LogoAvatar />}
      <article
        className={[
          'query-message-shell max-w-4xl overflow-hidden rounded-card border px-5 py-4 sm:px-6',
          isUser
            ? 'border-accent-indigo/24 bg-[linear-gradient(180deg,rgba(22,24,40,0.98),rgba(19,22,30,0.96))] text-white/92'
            : 'border-white/8 bg-surface-container/92 text-white/84',
          isPending ? 'query-message-pending' : '',
          isSending ? 'query-message-sending' : '',
          isError ? 'query-message-error border-rose-400/24 bg-rose-400/8 text-rose-100' : '',
          isCancelled ? 'query-message-cancelled border-white/8 bg-surface-base/78 text-white/62' : '',
        ].join(' ')}
      >
        {isPending ? (
          <div className="flex items-center gap-2.5">
            <span className="inline-flex gap-1.5">
              <span className="query-dot h-2 w-2 rounded-full bg-indigo-300/80" />
              <span className="query-dot h-2 w-2 rounded-full bg-violet-300/80 [animation-delay:120ms]" />
              <span className="query-dot h-2 w-2 rounded-full bg-sky-300/80 [animation-delay:240ms]" />
            </span>
            <p className="text-[14px] text-white/66">Consultando o histórico técnico desta sessão...</p>
          </div>
        ) : answerPayload && message.messageType === 'query_answer' ? (
          <QueryReport payload={answerPayload} />
        ) : (
          <p className="whitespace-pre-wrap text-[15px] leading-8">{message.content}</p>
        )}
      </article>
      {isUser && <UserAvatar initials={userInitials} />}
    </div>
  )
}
