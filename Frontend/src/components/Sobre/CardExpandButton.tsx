import { PlusIcon } from './icons'

export default function CardExpandButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute bottom-3 right-3 flex h-6 w-6 items-center justify-center rounded-full border border-white/14 bg-surface-base/80 text-white/42 backdrop-blur-sm transition-[border-color,color] duration-150 hover:border-accent-indigo/34 hover:text-accent-indigo/72"
    >
      <PlusIcon />
    </button>
  )
}
