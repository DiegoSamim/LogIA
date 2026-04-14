import { resolveStackOption, toStackDisplayLabel } from '@/data/stackCatalog'

export default function StackBadge({
  value,
  compact = false,
}: {
  value: string
  compact?: boolean
}) {
  const option = resolveStackOption(value)

  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-full border font-medium',
        compact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1.5 text-xs',
      ].join(' ')}
      style={{
        color: option.accentColor,
        backgroundColor: option.backgroundColor,
        borderColor: option.borderColor,
      }}
    >
      <span
        className={compact ? 'h-1.5 w-1.5 rounded-full' : 'h-2 w-2 rounded-full'}
        style={{ backgroundColor: option.accentColor }}
        aria-hidden="true"
      />
      {toStackDisplayLabel(value)}
    </span>
  )
}
