import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children?: React.ReactNode
  footer?: React.ReactNode
  panelClassName?: string
  bodyClassName?: string
  eyebrow?: string | null
  headerClassName?: string
}

export default function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  panelClassName,
  bodyClassName,
  eyebrow = 'Detalhes',
  headerClassName,
}: ModalProps) {
  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Fechar modal"
        onClick={onClose}
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.14),transparent_30%),rgba(13,15,20,0.82)] backdrop-blur-md"
      />

      <div
        className={[
          'relative z-10 flex max-h-[min(95vh,680px)] w-full max-w-2xl flex-col overflow-hidden rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(19,22,30,0.98),rgba(13,15,20,0.98))] shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl',
          panelClassName ?? '',
        ].join(' ')}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_72%)]" />
        <div className={['relative border-b border-white/6 px-5 py-5 sm:px-6', headerClassName ?? ''].join(' ')}>
          <div className="flex items-start justify-between gap-4">
            <div>
              {eyebrow ? (
                <p className="text-[10px] font-semibold tracking-[0.2em] text-accent-indigo/70 uppercase">{eyebrow}</p>
              ) : null}
              <h2 className={`${eyebrow ? 'mt-2' : ''} text-xl font-semibold tracking-tight text-white/94`}>{title}</h2>
              {description && (
                <p className="mt-2 text-sm leading-6 text-white/46">{description}</p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] border border-white/8 bg-surface-high/76 text-white/34 transition-[border-color,color,background-color] duration-150 hover:border-white/14 hover:bg-surface-high hover:text-white/72"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {children && (
          <div className={['relative flex-1 overflow-y-auto px-5 py-5 sm:px-6', bodyClassName ?? ''].join(' ')}>
            {children}
          </div>
        )}

        {footer && (
          <div className="relative flex flex-wrap justify-end gap-2 border-t border-white/6 px-5 py-4 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
