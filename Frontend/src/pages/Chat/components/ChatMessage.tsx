import type { ChatMessageViewModel } from '@/pages/Chat/types'
import LogoAvatar from './LogoAvatar'
import UserAvatar from './UserAvatar'

export default function ChatMessage({
  message,
  userInitials,
}: {
  message: ChatMessageViewModel
  userInitials: string
}) {
  const isAssistant = message.sender === 'assistant'

  return (
    <div className={['chat-card-enter flex items-start gap-4', isAssistant ? '' : 'justify-end'].join(' ')}>
      {isAssistant && <LogoAvatar />}
      <article
        className={[
          'chat-message-glow max-w-3xl rounded-[22px] border px-5 py-4 sm:px-6',
          isAssistant
            ? 'border-white/8 bg-surface-container/92 text-white/82'
            : 'border-accent-indigo/24 bg-[linear-gradient(180deg,rgba(22,24,40,0.98),rgba(19,22,30,0.96))] text-white/90',
        ].join(' ')}
      >
        <p className="text-[15px] leading-8">{message.content}</p>
        {message.orderedItems && (
          <ol className="mt-5 space-y-3">
            {message.orderedItems.map((item, index) => (
              <li key={item} className="flex gap-3">
                <span className="text-sm font-semibold text-accent-violet/88">{String(index + 1).padStart(2, '0')}.</span>
                <span className="text-[15px] leading-7 text-white/70">{item}</span>
              </li>
            ))}
          </ol>
        )}
        {message.suggestions && (
          <div className="mt-5 flex flex-wrap gap-2.5">
            {message.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="rounded-full border border-white/9 bg-surface-high px-3.5 py-2 text-[11px] font-medium text-white/48 transition-[border-color,color,transform] duration-150 hover:border-accent-indigo/26 hover:text-white/76 hover:-translate-y-0.5"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
        {message.references && (
          <div className="mt-5 flex flex-wrap items-center gap-2 text-[11px] tracking-[0.14em] text-white/30 uppercase">
            <span className="text-accent-indigo/70">Fonte</span>
            {message.references.map((ref) => (
              <span key={ref} className="rounded-full border border-accent-indigo/14 bg-accent-indigo/7 px-2.5 py-1 text-accent-indigo/82">{ref}</span>
            ))}
          </div>
        )}
      </article>
      {!isAssistant && <UserAvatar initials={userInitials} />}
    </div>
  )
}
