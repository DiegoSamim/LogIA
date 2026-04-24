import { useEffect, useState } from 'react'
import { catalogService, type EntityDTO, type RelationDTO } from '@/services/catalog.service'

interface Props {
  entityId: string
  relations: RelationDTO[]
  onClose: () => void
  onEdit: (entity: EntityDTO) => void
  onDelete: (entity: EntityDTO) => void
  onDescriptionUpdated: (entity: EntityDTO) => void
  onNavigateEntity: (entityId: string) => void
  canEdit: boolean
}

export default function EntityDetailPanel({
  entityId,
  relations,
  onClose,
  onEdit,
  onDelete,
  onDescriptionUpdated,
  onNavigateEntity,
  canEdit,
}: Props) {
  const [entity, setEntity] = useState<EntityDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingDesc, setEditingDesc] = useState(false)
  const [descValue, setDescValue] = useState('')
  const [savingDesc, setSavingDesc] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)
    catalogService
      .getEntity(entityId)
      .then(({ data }) => {
        if (!active) return
        setEntity(data)
        setDescValue(data.description ?? '')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [entityId])

  async function saveDescription() {
    if (!canEdit) return
    if (!entity) return
    setSavingDesc(true)
    try {
      const { data } = await catalogService.updateEntity(entity.id, {
        description: descValue.trim() || null,
      })
      setEntity(data)
      setEditingDesc(false)
      onDescriptionUpdated(data)
    } finally {
      setSavingDesc(false)
    }
  }

  const entityRelations = entity
    ? relations.filter((r) => r.from_entity_id === entity.id || r.to_entity_id === entity.id)
    : []

  return (
    <aside className="flex w-full flex-col border-l border-white/6 bg-surface-container/80 lg:w-[420px] lg:min-w-[420px]">
      <div className="flex items-start justify-between gap-4 border-b border-white/6 px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-accent-indigo/70 uppercase">
            {entity?.entity_type === 'view' ? 'Visualização' : entity?.entity_type === 'collection' ? 'Coleção' : 'Tabela'}
          </p>
          <h2 className="mt-1 truncate text-xl font-semibold text-white/94">
            {entity ? entity.name : '…'}
          </h2>
          {entity && entity.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {entity.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-[4px] bg-accent-indigo/14 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-accent-indigo uppercase"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-white/8 text-white/44 hover:border-white/16 hover:text-white/84"
        >
          ×
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
        <section>
          <p className="mb-1.5 text-[10px] font-semibold tracking-[0.18em] text-white/40 uppercase">
            Descrição
          </p>
          {canEdit && editingDesc ? (
            <div className="space-y-2">
              <textarea
                value={descValue}
                onChange={(e) => setDescValue(e.target.value)}
                rows={4}
                className="w-full rounded-[8px] border border-white/8 bg-surface-high px-3 py-2 text-[13px] text-white/88 outline-none focus:border-accent-indigo/40"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveDescription}
                  disabled={savingDesc}
                  className="rounded-[6px] bg-accent-indigo/90 px-3 py-1.5 text-[11px] font-semibold text-white hover:brightness-110 disabled:opacity-50"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDescValue(entity?.description ?? '')
                    setEditingDesc(false)
                  }}
                  className="rounded-[6px] border border-white/8 px-3 py-1.5 text-[11px] text-white/60 hover:border-white/16"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (canEdit) setEditingDesc(true)
              }}
              disabled={!canEdit}
              className="block w-full rounded-[8px] border border-white/4 bg-surface-low/40 px-3 py-2 text-left text-[13px] leading-6 text-white/78 transition hover:border-white/12 hover:bg-surface-low/70 disabled:cursor-default"
            >
              {entity?.description || (
                <span className="italic text-white/36">Clique para adicionar descrição…</span>
              )}
            </button>
          )}
        </section>

        <section>
          <p className="mb-2 text-[10px] font-semibold tracking-[0.18em] text-white/40 uppercase">
            Colunas ({entity?.columns.length ?? 0})
          </p>
          {loading ? (
            <p className="text-[12px] text-white/36">Carregando…</p>
          ) : (
            <div className="overflow-hidden rounded-[10px] border border-white/6 bg-surface-low/40">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-semibold tracking-[0.14em] text-white/36 uppercase">
                    <th className="px-3 py-2">Nome</th>
                    <th className="px-3 py-2">Tipo</th>
                    <th className="px-3 py-2 text-right">Chave</th>
                  </tr>
                </thead>
                <tbody>
                  {entity?.columns.map((col) => (
                    <tr key={col.id} className="border-t border-white/4">
                      <td className="px-3 py-2 text-[13px] text-white/88">
                        {col.name}
                        {!col.is_nullable && (
                          <span className="ml-1.5 text-[9px] font-semibold tracking-[0.1em] text-white/34">
                            NN
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] text-white/62">{col.data_type}</td>
                      <td className="px-3 py-2 text-right">
                        {col.is_primary_key && (
                          <span className="rounded-[4px] bg-amber-400/14 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.12em] text-amber-300 uppercase">
                            PK
                          </span>
                        )}
                        {col.is_foreign_key && (
                          <span className="ml-1 rounded-[4px] bg-accent-indigo/14 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.12em] text-accent-indigo uppercase">
                            FK
                          </span>
                        )}
                        {col.is_unique && !col.is_primary_key && (
                          <span className="ml-1 rounded-[4px] bg-emerald-400/14 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.12em] text-emerald-300 uppercase">
                            U
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {entityRelations.length > 0 && (
          <section>
            <p className="mb-2 text-[10px] font-semibold tracking-[0.18em] text-white/40 uppercase">
              Relações
            </p>
            <div className="space-y-1.5">
              {entityRelations.map((rel) => {
                const isOut = rel.from_entity_id === entity?.id
                const otherId = isOut ? rel.to_entity_id : rel.from_entity_id
                const otherName = isOut ? rel.to_entity_name : rel.from_entity_name
                const cardinality =
                  rel.relation_type === 'one_to_one'
                    ? '1:1'
                    : rel.relation_type === 'many_to_many'
                      ? 'N:N'
                      : '1:N'
                return (
                  <button
                    key={rel.id}
                    type="button"
                    onClick={() => onNavigateEntity(otherId)}
                    className="flex w-full items-center justify-between rounded-[8px] border border-white/6 bg-surface-low/40 px-3 py-2 text-left transition hover:border-accent-indigo/30 hover:bg-accent-indigo/8"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-accent-violet">✺</span>
                      <span className="text-[13px] text-white/84">{otherName}</span>
                    </div>
                    <span className="text-[10px] font-semibold tracking-[0.12em] text-white/40 uppercase">
                      {cardinality}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        )}
      </div>

      {entity && canEdit && (
        <div className="flex items-center justify-between gap-2 border-t border-white/6 px-5 py-4">
          <button
            type="button"
            onClick={() => onDelete(entity)}
            className="rounded-[8px] border border-rose-400/20 bg-rose-400/8 px-3 py-2 text-[11px] font-semibold text-rose-300 hover:border-rose-300/36 hover:bg-rose-400/14"
          >
            Excluir
          </button>
          <button
            type="button"
            onClick={() => onEdit(entity)}
            className="rounded-[8px] bg-gradient-to-r from-accent-indigo to-indigo-500 px-4 py-2 text-[11px] font-semibold text-white hover:brightness-110"
          >
            Editar tabela
          </button>
        </div>
      )}
    </aside>
  )
}
