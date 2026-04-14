import { EXPAND_THRESHOLD } from '@/lib/sobre'

export default function ClampedText({
  value,
  label,
  onExpand,
  expanded = false,
  rows = 4,
}: {
  value: string
  label: string
  onExpand: (label: string, value: string) => void
  expanded?: boolean
  rows?: number
}) {
  const isLong = value.length > EXPAND_THRESHOLD

  return (
    <div>
      <p
        className="text-sm leading-7 text-white/62"
        style={!expanded && isLong ? {
          display: '-webkit-box',
          WebkitLineClamp: rows,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        } : undefined}
      >
        {value}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => onExpand(label, value)}
          className="mt-2 text-[11px] font-medium text-accent-indigo/64 transition-colors hover:text-accent-indigo/90"
        >
          {expanded ? 'Ver menos ↑' : 'Ver mais →'}
        </button>
      )}
    </div>
  )
}
