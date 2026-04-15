import { useState } from 'react'
import type { ChecklistItem } from '@/pages/Chat/types'

export default function ChecklistInput({
  value,
  onChange,
  placeholder = 'Digite um item e pressione Enter...',
}: {
  value: ChecklistItem[]
  onChange: (items: ChecklistItem[]) => void
  placeholder?: string
}) {
  const [input, setInput] = useState('')

  function addItem() {
    const description = input.trim()
    if (!description || value.some((item) => item.description === description)) {
      setInput('')
      return
    }
    onChange([...value, { description }])
    setInput('')
  }

  function removeItem(description: string) {
    onChange(value.filter((item) => item.description !== description))
  }

  return (
    <div className="space-y-2 py-1">
      {value.length > 0 && (
        <div className="space-y-1.5">
          {value.map((item) => (
            <div
              key={item.description}
              className="flex items-center gap-2.5 rounded-[8px] border border-white/7 bg-surface-base/60 px-3 py-2"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 13 13"
                fill="none"
                className="shrink-0 text-white/20"
              >
                <rect x="0.5" y="0.5" width="12" height="12" rx="3.5" stroke="currentColor" />
              </svg>
              <span className="min-w-0 flex-1 text-xs text-white/72">{item.description}</span>
              <button
                type="button"
                onClick={() => removeItem(item.description)}
                aria-label={`Remover item ${item.description}`}
                className="shrink-0 text-white/24 transition-colors hover:text-white/60"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
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
              addItem()
            }
          }}
          className="min-h-10 flex-1 rounded-[18px] border border-white/7 bg-surface-base/88 px-4 py-2.5 text-sm text-white/86 outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-white/24 focus:border-accent-indigo/38 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
        />
        <button
          type="button"
          onClick={addItem}
          disabled={!input.trim()}
          className="h-10 rounded-[18px] border border-white/10 bg-surface-high px-4 text-xs font-semibold text-white/52 transition-[border-color,color,opacity] duration-150 hover:border-white/20 hover:text-white/76 disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  )
}
