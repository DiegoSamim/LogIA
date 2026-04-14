import { useEffect, useRef, useState } from 'react'
import { formatStatus } from '@/lib/sobre'

export default function StatusField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const options = [
    { value: 'active', label: 'Ativo' },
    { value: 'paused', label: 'Pausado' },
    { value: 'archived', label: 'Arquivado' },
  ]

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  return (
    <div ref={rootRef} className="relative flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">Status</span>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={[
          'flex items-center justify-between gap-3 rounded-[14px] border px-3.5 py-3 text-sm text-white/86 outline-none transition-[border-color,box-shadow,background-color] duration-150',
          open
            ? 'border-accent-indigo/34 bg-surface-high shadow-[0_0_0_3px_rgba(99,102,241,0.12)]'
            : 'border-white/8 bg-surface-high/70 hover:border-white/14',
        ].join(' ')}
      >
        <span className="inline-flex items-center gap-2">
          <span
            className={[
              'h-2.5 w-2.5 rounded-full',
              value === 'active' ? 'bg-emerald-400' : value === 'paused' ? 'bg-amber-400' : 'bg-white/28',
            ].join(' ')}
            aria-hidden="true"
          />
          {formatStatus(value)}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={['shrink-0 text-white/42 transition-transform duration-150', open ? 'rotate-180' : ''].join(' ')}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-30 overflow-hidden rounded-[16px] border border-white/8 bg-[linear-gradient(180deg,rgba(19,22,30,0.98),rgba(13,15,20,0.98))] shadow-[0_18px_48px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="p-2">
            {options.map((option) => {
              const selected = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                  className={[
                    'flex w-full items-center gap-2.5 rounded-[12px] px-3 py-2.5 text-left text-sm transition-[background-color,color] duration-150',
                    selected
                      ? 'bg-accent-indigo/16 text-white'
                      : 'text-white/58 hover:bg-surface-high hover:text-white/84',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'h-2.5 w-2.5 rounded-full',
                      option.value === 'active' ? 'bg-emerald-400' : option.value === 'paused' ? 'bg-amber-400' : 'bg-white/28',
                    ].join(' ')}
                    aria-hidden="true"
                  />
                  <span className="flex-1">{option.label}</span>
                  {selected && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-indigo/82">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
