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
  const references = Array.isArray(message.metadata?.references)
    ? (message.metadata?.references as Array<Record<string, unknown>>)
    : []

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
          'query-message-shell max-w-3xl rounded-[22px] border px-5 py-4 sm:px-6',
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
        ) : (
          <p className="whitespace-pre-wrap text-[15px] leading-8">{message.content}</p>
        )}

        {references.length > 0 && !isPending && (
          <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px] tracking-[0.14em] text-white/30 uppercase">
            <span className="text-accent-indigo/70">Fontes</span>
            {references.slice(0, 6).map((reference, index) => (
              <span
                key={`${String(reference.task_id ?? reference.chunk_id ?? index)}`}
                className="rounded-full border border-accent-indigo/14 bg-accent-indigo/7 px-2.5 py-1 text-accent-indigo/82"
              >
                {String(reference.task_title ?? reference.source_type ?? `Ref ${index + 1}`)}
              </span>
            ))}
          </div>
        )}
      </article>
      {isUser && <UserAvatar initials={userInitials} />}
    </div>
  )
}
