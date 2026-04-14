export default function AboutPageState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <div className="min-h-full bg-surface-base px-6 pb-16 pt-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[20px] border border-white/8 bg-surface-container p-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-white/90">{title}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/40">{description}</p>
          <button
            type="button"
            onClick={onAction}
            className="mt-6 rounded-btn border border-accent-indigo/22 bg-accent-indigo/10 px-4 py-2.5 text-xs font-semibold tracking-[0.16em] text-accent-indigo/84 uppercase transition-[border-color,background-color] duration-150 hover:border-accent-indigo/35 hover:bg-accent-indigo/14"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
