import { EXPAND_THRESHOLD } from '@/lib/sobre'
import CardExpandButton from './CardExpandButton'
import CardFade from './CardFade'

export default function ExpandableInfoCard({
  title,
  value,
  onExpand,
}: {
  title: string
  value: string
  onExpand: (label: string, value: string) => void
}) {
  return (
    <div className="relative max-h-48 overflow-hidden rounded-[18px] border border-white/7 bg-surface-base/62 p-5">
      <p className="mb-3 text-[10px] font-semibold tracking-[0.18em] text-white/30 uppercase">{title}</p>
      <p className="text-sm leading-7 text-white/62">{value}</p>
      {value.length > EXPAND_THRESHOLD && (
        <>
          <CardFade />
          <CardExpandButton onClick={() => onExpand(title, value)} />
        </>
      )}
    </div>
  )
}
