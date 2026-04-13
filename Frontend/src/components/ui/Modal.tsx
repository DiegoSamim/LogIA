import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children?: React.ReactNode
  footer?: React.ReactNode
}

export default function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Fechar modal"
        onClick={onClose}
        className="absolute inset-0 bg-surface-base/72 backdrop-blur-sm"
      />

      <div className="relative z-10 w-full max-w-lg rounded-[22px] border border-white/8 bg-surface-container/96 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="border-b border-white/6 px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-white/92">{title}</h2>
              {description && (
                <p className="mt-1.5 text-sm leading-6 text-white/46">{description}</p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-white/8 bg-surface-high/76 text-white/34 transition-[border-color,color,background-color] duration-150 hover:border-white/14 hover:bg-surface-high hover:text-white/72"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {children && <div className="px-5 py-5 sm:px-6">{children}</div>}

        {footer && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-white/6 px-5 py-4 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
