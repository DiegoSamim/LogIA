interface UserAvatarProps {
  initials: string
  avatarUrl?: string | null
}

export default function UserAvatar({ initials, avatarUrl }: UserAvatarProps) {
  return (
    <div className="flex h-11 w-11 shrink-0 overflow-hidden rounded-2xl border border-white/10 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
      {avatarUrl ? (
        <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-surface-high text-xs font-bold tracking-[0.14em] text-white/88">
          {initials}
        </div>
      )}
    </div>
  )
}
