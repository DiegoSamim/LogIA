export default function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-[14px] border border-white/8 bg-surface-high/70 px-3.5 py-3 text-sm text-white/86 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-white/22 focus:border-accent-indigo/34 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
      />
    </label>
  )
}
