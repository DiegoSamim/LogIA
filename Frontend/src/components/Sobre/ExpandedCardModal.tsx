import Modal from '@/components/ui/Modal'
import type { ExpandedCardState } from '@/types/sobre'

export default function ExpandedCardModal({
  expandedCard,
  onClose,
}: {
  expandedCard: ExpandedCardState | null
  onClose: () => void
}) {
  if (!expandedCard) return null

  return (
    <Modal
      open
      title={expandedCard.label}
      description="Visualização completa do conteúdo do card."
      onClose={onClose}
      footer={(
        <button
          type="button"
          onClick={onClose}
          className="rounded-[12px] border border-white/10 bg-surface-high px-4 py-2.5 text-xs font-medium text-white/60 transition-[border-color,color] duration-150 hover:border-white/18 hover:text-white/82"
        >
          Fechar
        </button>
      )}
    >
      <div className="rounded-[18px] border border-white/7 bg-[linear-gradient(180deg,rgba(10,12,16,0.88),rgba(18,20,28,0.78))] px-5 py-5">
        <p className="whitespace-pre-wrap text-sm leading-8 text-white/76">{expandedCard.value}</p>
      </div>
    </Modal>
  )
}
