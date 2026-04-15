export default function UserAvatar({ initials }: { initials: string }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-surface-high text-xs font-bold tracking-[0.14em] text-white/88 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
      {initials}
    </div>
  )
}
