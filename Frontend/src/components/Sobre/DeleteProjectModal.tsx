import Modal from '@/components/ui/Modal'
import type { ProjectDetail } from '@/types/sobre'

export default function DeleteProjectModal({
  open,
  deleting,
  project,
  onClose,
  onConfirm,
}: {
  open: boolean
  deleting: boolean
  project: ProjectDetail
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Modal
      open={open}
      title="Excluir projeto"
      description="Essa ação remove o projeto permanentemente. Você perderá o acesso a esse contexto e não poderá desfazer a exclusão."
      onClose={onClose}
      footer={(
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="rounded-[12px] border border-white/10 bg-surface-high px-4 py-2.5 text-xs font-medium text-white/56 transition-[border-color,color] duration-150 hover:border-white/18 hover:text-white/76 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-[12px] border border-red-500/18 bg-red-500/14 px-4 py-2.5 text-xs font-semibold tracking-[0.16em] text-red-200 uppercase transition-[filter,transform,opacity] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
          >
            {deleting ? 'Excluindo...' : 'Confirmar exclusão'}
          </button>
        </>
      )}
    >
      <div className="rounded-2xl border border-white/7 bg-surface-base/74 px-4 py-4">
        <p className="text-[10px] font-semibold tracking-[0.18em] text-white/28 uppercase">Projeto selecionado</p>
        <p className="mt-2 text-sm font-semibold text-white/90">{project.name}</p>
        {project.description && <p className="mt-2 text-sm leading-6 text-white/48">{project.description}</p>}
      </div>
    </Modal>
  )
}
