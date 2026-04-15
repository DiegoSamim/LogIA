import type { EnumChipOption } from '@/pages/Chat/types'

export default function EnumChipSelector({
  options,
  value,
  onSelect,
}: {
  options: EnumChipOption[]
  value: string | null
  onSelect: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2 py-1">
      {options.map((option) => {
        const selected = value === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={[
              'rounded-lg border px-3.5 py-2 text-sm font-medium transition-[border-color,background-color,color,transform] duration-150 active:scale-[0.97]',
              selected
                ? `${option.colorClass} border-opacity-60`
                : 'border-white/10 bg-surface-base/80 text-white/52 hover:border-white/20 hover:text-white/76',
            ].join(' ')}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
