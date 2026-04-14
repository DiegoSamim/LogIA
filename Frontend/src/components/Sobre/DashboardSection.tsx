import type { ReactNode } from 'react'

export default function DashboardSection({
  title,
  subtitle,
  children,
  badge,
  className = '',
}: {
  title: string
  subtitle?: string
  children: ReactNode
  badge?: ReactNode
  className?: string
}) {
  return (
    <section className={['rounded-[20px] border border-white/7 bg-surface-container/88 p-5 shadow-[0_20px_48px_rgba(0,0,0,0.22)] backdrop-blur-xl', className].join(' ')}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.22em] text-white/30 uppercase">{title}</p>
          {subtitle && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-white/42">{subtitle}</p>}
        </div>
        {badge}
      </div>
      {children}
    </section>
  )
}
