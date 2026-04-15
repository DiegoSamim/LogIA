import { useState } from 'react'

export default function TagsInput({
  value,
  onChange,
  placeholder = 'Digite uma tag e pressione Enter...',
}: {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}) {
  const [input, setInput] = useState('')

  function addTag() {
    const tag = input.trim()
    if (!tag || value.includes(tag)) {
      setInput('')
      return
    }
    onChange([...value, tag])
    setInput('')
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag))
  }

  return (
    <div className="space-y-2 py-1">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 rounded-[6px] border border-accent-indigo/20 bg-accent-indigo/8 px-2.5 py-1 text-xs font-medium text-accent-indigo/80"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                aria-label={`Remover tag ${tag}`}
                className="text-accent-indigo/40 transition-colors hover:text-accent-indigo/80"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addTag()
            }
          }}
          className="min-h-10 flex-1 rounded-[18px] border border-white/7 bg-surface-base/88 px-4 py-2.5 text-sm text-white/86 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-white/24 focus:border-accent-indigo/38 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
        />
        <button
          type="button"
          onClick={addTag}
          disabled={!input.trim()}
          className="h-10 rounded-[18px] border border-white/10 bg-surface-high px-4 text-xs font-semibold text-white/52 transition-[border-color,color,opacity] duration-150 hover:border-white/20 hover:text-white/76 disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  )
}
