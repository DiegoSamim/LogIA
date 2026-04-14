import { PlusIcon } from './icons'

export default function EmptyCta({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-[16px] border border-dashed border-white/10 py-5 text-xs text-white/26 transition-colors duration-150 hover:border-accent-indigo/28 hover:text-accent-indigo/58"
    >
      <PlusIcon />
      {label}
    </button>
  )
}
