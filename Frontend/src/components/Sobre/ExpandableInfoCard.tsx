import { EXPAND_THRESHOLD } from '@/lib/sobre'
import CardExpandButton from './CardExpandButton'
import CardFade from './CardFade'

type AccentTone = 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky'

const ACCENT_STYLES: Record<AccentTone, string> = {
  indigo: 'border-accent-indigo/16 bg-[linear-gradient(180deg,rgba(99,102,241,0.07),rgba(13,15,20,0.62))]',
  emerald: 'border-emerald-400/14 bg-[linear-gradient(180deg,rgba(16,185,129,0.07),rgba(13,15,20,0.62))]',
  amber: 'border-amber-400/16 bg-[linear-gradient(180deg,rgba(245,158,11,0.07),rgba(13,15,20,0.62))]',
  rose: 'border-rose-400/16 bg-[linear-gradient(180deg,rgba(244,63,94,0.07),rgba(13,15,20,0.62))]',
  sky: 'border-sky-400/16 bg-[linear-gradient(180deg,rgba(56,189,248,0.07),rgba(13,15,20,0.62))]',
}

function renderStructuredValue(value: string) {
  const blocks = value
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        const lines = block
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)

        const bulletLines = lines.filter((line) => /^([-*•]|\d+\.)\s+/.test(line))
        if (lines.length > 0 && bulletLines.length === lines.length) {
          return (
            <ul key={`${block}-${index}`} className="space-y-2 pl-4 text-sm leading-7 text-white/66">
              {lines.map((line) => (
                <li key={line} className="list-disc marker:text-white/28">
                  {line.replace(/^([-*•]|\d+\.)\s+/, '')}
                </li>
              ))}
            </ul>
          )
        }

        return (
          <div key={`${block}-${index}`} className="space-y-2">
            {lines.map((line) => (
              <p key={line} className="text-sm leading-7 text-white/66">
                {line}
              </p>
            ))}
          </div>
        )
      })}
    </div>
  )
}

export default function ExpandableInfoCard({
  title,
  value,
  onExpand,
  accent = 'indigo',
}: {
  title: string
  value: string
  onExpand: (label: string, value: string) => void
  accent?: AccentTone
}) {
  return (
    <div className={`relative rounded-[18px] border p-5 ${ACCENT_STYLES[accent]}`}>
      <p className="mb-3 text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">{title}</p>
      {value.trim() ? (
        <div className="relative max-h-56 overflow-hidden">
          {renderStructuredValue(value)}
          {value.length > EXPAND_THRESHOLD && (
            <>
              <CardFade />
              <CardExpandButton onClick={() => onExpand(title, value)} />
            </>
          )}
        </div>
      ) : (
        <p className="text-sm italic text-white/22">Não preenchido</p>
      )}
    </div>
  )
}
