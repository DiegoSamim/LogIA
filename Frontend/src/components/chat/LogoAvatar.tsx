import icon from '@/assets/Icon.png'

export default function LogoAvatar() {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-accent-indigo/18 bg-linear-to-br from-accent-indigo/20 via-accent-indigo/12 to-accent-violet/18 shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
      <img src={icon} alt="LogIA" className="h-5 w-5 object-contain" />
    </div>
  )
}
