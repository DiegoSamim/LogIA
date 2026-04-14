export default function ColorField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const previewColor = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value.trim()) ? value.trim() : '#1A1D26'

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">{label}</span>
      <div className="flex items-center gap-3 rounded-[14px] border border-white/8 bg-surface-high/70 px-3.5 py-3 transition-[border-color,box-shadow] duration-150 focus-within:border-accent-indigo/34 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]">
        <span
          className="h-4 w-4 shrink-0 rounded-full border border-white/16 shadow-[0_0_0_3px_rgba(255,255,255,0.03)]"
          style={{ backgroundColor: previewColor }}
          aria-hidden="true"
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-white/86 outline-none placeholder:text-white/22"
        />
      </div>
    </label>
  )
}
