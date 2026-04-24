import { useEffect, useMemo, useState } from 'react'
import Modal from '@/components/ui/Modal'
import { DB_DIALECTS, type DbDialect } from '@/data/dbDialects'
import type { ColumnInput, EntityDTO, EntityInput, EntitySummaryDTO, RelationDTO } from '@/services/catalog.service'

interface FKRelationInput {
  from_column: string
  ref_entity_id?: string
  ref_column?: string
  ref_relation_type?: 'one_to_one' | 'one_to_many' | 'many_to_many'
}

export interface EntitySubmitPayload extends EntityInput {
  fkRelations: FKRelationInput[]
}

interface Props {
  open: boolean
  dialect: DbDialect
  entity?: EntityDTO | null
  entities: EntitySummaryDTO[]
  relations: RelationDTO[]
  onClose: () => void
  onSubmit: (data: EntitySubmitPayload) => Promise<void> | void
}

function emptyColumn(): ColumnInput {
  return {
    name: '',
    data_type: '',
    is_primary_key: false,
    is_unique: false,
    is_nullable: true,
    is_foreign_key: false,
    default_value: null,
    description: null,
    ordinal: 0,
  }
}

const RELATION_TYPE_LABELS: Record<string, string> = {
  one_to_one: '1 : 1',
  one_to_many: '1 : N',
  many_to_many: 'N : N',
}

export default function EntityFormModal({ open, dialect, entity, entities, relations, onClose, onSubmit }: Props) {
  const dialectInfo = DB_DIALECTS[dialect]
  const [name, setName] = useState('')
  const [schemaName, setSchemaName] = useState('')
  const [description, setDescription] = useState('')
  const [entityType, setEntityType] = useState<'table' | 'view' | 'collection'>('table')
  const [tagsInput, setTagsInput] = useState('')
  const [columns, setColumns] = useState<ColumnInput[]>([emptyColumn()])
  const [saving, setSaving] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const [pkWarning, setPkWarning] = useState(false)

  useEffect(() => {
    if (!open) return
    setPkWarning(false)
    if (entity) {
      setName(entity.name)
      setSchemaName(entity.schema_name ?? '')
      setDescription(entity.description ?? '')
      setEntityType((entity.entity_type as 'table' | 'view' | 'collection') || 'table')
      setTagsInput(entity.tags.join(', '))
      setColumns(
        entity.columns.length
          ? entity.columns.map((c) => {
              const existingRel = c.is_foreign_key
                ? relations.find((r) => r.from_entity_id === entity.id && r.from_column === c.name)
                : undefined
              return {
                name: c.name,
                data_type: c.data_type,
                is_primary_key: c.is_primary_key,
                is_unique: c.is_unique,
                is_nullable: c.is_nullable,
                is_foreign_key: c.is_foreign_key,
                default_value: c.default_value,
                description: c.description,
                ordinal: c.ordinal,
                ref_entity_id: existingRel?.to_entity_id,
                ref_column: existingRel?.to_column,
                ref_relation_type: existingRel?.relation_type,
              }
            })
          : [emptyColumn()],
      )
    } else {
      setName('')
      setSchemaName('')
      setDescription('')
      setEntityType('table')
      setTagsInput('')
      setColumns([emptyColumn()])
    }
  }, [open, entity, relations])

  const tags = useMemo(
    () =>
      tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    [tagsInput],
  )

  // need cols in scope for PK check
  function updateColChecked(index: number, patch: Partial<ColumnInput>, cols: ColumnInput[]) {
    if (patch.is_primary_key === true) {
      const alreadyHasPk = cols.some((c, i) => i !== index && c.is_primary_key)
      setPkWarning(alreadyHasPk)
    }
    setColumns((prev) =>
      prev.map((c, i) => {
        if (i !== index) return c
        const merged = { ...c, ...patch }
        if (patch.is_primary_key === true) { merged.is_nullable = false; merged.is_unique = true }
        if (patch.is_foreign_key === true) merged.is_nullable = false
        if (patch.is_foreign_key === false) {
          merged.ref_entity_id = undefined
          merged.ref_column = undefined
          merged.ref_relation_type = undefined
        }
        if (patch.ref_entity_id !== undefined) {
          const target = entities.find((e) => e.id === patch.ref_entity_id)
          if (target?.pk_columns.length) merged.ref_column = target.pk_columns[0]
        }
        return merged
      }),
    )
  }

  function handleDragStart(index: number) {
    setDragIndex(index)
  }

  function handleDragOver(e: { preventDefault(): void }, index: number) {
    e.preventDefault()
    setDragOver(index)
    if (dragIndex === null || dragIndex === index) return
    setColumns((cols) => {
      const updated = [...cols]
      const [dragged] = updated.splice(dragIndex, 1)
      updated.splice(index, 0, dragged)
      return updated
    })
    setDragIndex(index)
  }

  function handleDragEnd() {
    setDragIndex(null)
    setDragOver(null)
  }

  function addCol() {
    setColumns((cols) => [...cols, { ...emptyColumn(), ordinal: cols.length }])
  }

  function removeCol(index: number) {
    setColumns((cols) => cols.filter((_, i) => i !== index))
  }

  async function handleSubmit() {
    if (!name.trim()) return
    const validCols = columns
      .filter((c) => c.name.trim() && c.data_type.trim())
      .map((c, idx) => ({ ...c, ordinal: idx }))

    const fkRelations: FKRelationInput[] = validCols
      .filter((c) => c.is_foreign_key && c.ref_entity_id)
      .map((c) => ({
        from_column: c.name,
        ref_entity_id: c.ref_entity_id,
        ref_column: c.ref_column,
        ref_relation_type: c.ref_relation_type ?? 'one_to_many',
      }))

    const payload: EntitySubmitPayload = {
      name: name.trim(),
      schema_name: schemaName.trim() || null,
      description: description.trim() || null,
      entity_type: entityType,
      tags,
      columns: validCols.map(({ ref_entity_id: _a, ref_column: _b, ref_relation_type: _c, ...rest }) => rest),
      fkRelations,
    }
    setSaving(true)
    try {
      await onSubmit(payload)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const ENTITY_TYPE_DESCRIPTIONS: Record<'table' | 'view' | 'collection', string> = {
    table: 'Estrutura com linhas e colunas persistidas no banco.',
    view: 'Consulta salva que age como tabela virtual (somente leitura).',
    collection: 'Agrupamento de documentos sem schema fixo (MongoDB).',
  }

  // entities available for FK reference (exclude self when editing)
  const refEntities = entities.filter((e) => e.id !== entity?.id)

  return (
    <Modal
      open={open}
      title={entity ? `Editar ${entity.name}` : 'Nova tabela'}
      eyebrow="Database Catalog"
      description="Defina nome, colunas e tipos de dados."
      onClose={onClose}
      panelClassName="max-w-4xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-[8px] border border-white/8 px-4 py-2 text-xs font-medium text-white/60 hover:border-white/16 hover:text-white/84"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !name.trim()}
            className="rounded-[8px] bg-gradient-to-r from-accent-indigo to-indigo-500 px-4 py-2 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : entity ? 'Salvar alterações' : 'Criar tabela'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold tracking-[0.18em] text-white/40 uppercase">Nome</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="users"
              className="rounded-[8px] border border-white/8 bg-surface-high px-3 py-2 text-sm text-white/88 outline-none focus:border-accent-indigo/40"
            />
          </label>
          {dialectInfo.supportsSchemas && (
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold tracking-[0.18em] text-white/40 uppercase">
                Schema <span className="normal-case font-normal text-white/28">(opcional)</span>
              </span>
              <input
                value={schemaName}
                onChange={(e) => setSchemaName(e.target.value)}
                placeholder="public"
                className="rounded-[8px] border border-white/8 bg-surface-high px-3 py-2 text-sm text-white/88 outline-none focus:border-accent-indigo/40"
              />
            </label>
          )}
          <label className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold tracking-[0.18em] text-white/40 uppercase">Tipo</span>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value as 'table' | 'view' | 'collection')}
              className="rounded-[8px] border border-white/8 bg-surface-high px-3 py-2 text-sm text-white/88 outline-none focus:border-accent-indigo/40"
            >
              <option value="table">Tabela</option>
              <option value="view">View</option>
              <option value="collection">Coleção</option>
            </select>
            <p className="text-[11px] leading-4 text-white/36">{ENTITY_TYPE_DESCRIPTIONS[entityType]}</p>
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold tracking-[0.18em] text-white/40 uppercase">
            Tags <span className="normal-case font-normal text-white/28">(opcional · separe por vírgula)</span>
          </span>
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="CORE, AUTH"
            className="rounded-[8px] border border-white/8 bg-surface-high px-3 py-2 text-sm text-white/88 outline-none focus:border-accent-indigo/40"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold tracking-[0.18em] text-white/40 uppercase">
            Descrição <span className="normal-case font-normal text-white/28">(opcional)</span>
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Para que serve essa tabela? Quais regras?"
            className="rounded-[8px] border border-white/8 bg-surface-high px-3 py-2 text-sm text-white/88 outline-none focus:border-accent-indigo/40"
          />
        </label>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-[0.18em] text-white/40 uppercase">
              Colunas ({columns.length})
            </span>
            <button
              type="button"
              onClick={addCol}
              className="rounded-[6px] border border-white/8 px-2.5 py-1 text-[11px] font-medium text-white/60 hover:border-accent-indigo/40 hover:text-accent-indigo"
            >
              + Coluna
            </button>
          </div>

          {pkWarning && (
            <div className="mb-2 rounded-[8px] border border-amber-400/20 bg-amber-400/8 px-3 py-2 text-[11px] text-amber-300">
              Atenção: mais de uma coluna marcada como PK. Recomenda-se apenas uma por tabela.
            </div>
          )}

          <div className="overflow-x-auto rounded-[10px] border border-white/6 bg-surface-low/60">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="text-[10px] font-semibold tracking-[0.14em] text-white/36 uppercase">
                  <th className="w-6 px-2 py-2"></th>
                  <th className="px-2 py-2">Nome</th>
                  <th className="px-2 py-2">Tipo</th>
                  <th className="px-2 py-2 text-center">PK</th>
                  <th className="px-2 py-2 text-center">U</th>
                  <th className="px-2 py-2 text-center">NN</th>
                  <th className="px-2 py-2 text-center">FK</th>
                  <th className="px-2 py-2">
                    Default <span className="font-normal normal-case text-white/22">(opcional)</span>
                  </th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {columns.map((col, i) => (
                  <>
                    <tr
                      key={`row-${i}`}
                      draggable
                      onDragStart={() => handleDragStart(i)}
                      onDragOver={(e) => handleDragOver(e, i)}
                      onDragEnd={handleDragEnd}
                      className={`border-t border-white/4 transition-opacity duration-100 ${
                        dragIndex === i ? 'opacity-40' : dragOver === i ? 'bg-accent-indigo/6' : ''
                      }`}
                    >
                      <td className="w-6 cursor-grab pl-2 pr-0 py-1.5 text-white/22 active:cursor-grabbing">
                        <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
                          <circle cx="3" cy="2.5" r="1.2" />
                          <circle cx="7" cy="2.5" r="1.2" />
                          <circle cx="3" cy="7" r="1.2" />
                          <circle cx="7" cy="7" r="1.2" />
                          <circle cx="3" cy="11.5" r="1.2" />
                          <circle cx="7" cy="11.5" r="1.2" />
                        </svg>
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          value={col.name}
                          onChange={(e) => updateColChecked(i, { name: e.target.value }, columns)}
                          placeholder="id"
                          className="w-full rounded-[6px] border border-white/6 bg-surface-high px-2 py-1 text-[12px] text-white/86 outline-none focus:border-accent-indigo/40"
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          list={`dlg-types-${dialect}`}
                          value={col.data_type}
                          onChange={(e) => updateColChecked(i, { data_type: e.target.value }, columns)}
                          placeholder="uuid"
                          className="w-full rounded-[6px] border border-white/6 bg-surface-high px-2 py-1 font-mono text-[11px] text-white/86 outline-none focus:border-accent-indigo/40"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={col.is_primary_key ?? false}
                          onChange={(e) => updateColChecked(i, { is_primary_key: e.target.checked }, columns)}
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={col.is_unique ?? false}
                          onChange={(e) => updateColChecked(i, { is_unique: e.target.checked }, columns)}
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={!col.is_nullable}
                          onChange={(e) => updateColChecked(i, { is_nullable: !e.target.checked }, columns)}
                        />
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={col.is_foreign_key ?? false}
                          onChange={(e) => updateColChecked(i, { is_foreign_key: e.target.checked }, columns)}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          value={col.default_value ?? ''}
                          onChange={(e) => updateColChecked(i, { default_value: e.target.value || null }, columns)}
                          placeholder="—"
                          className="w-full rounded-[6px] border border-white/6 bg-surface-high px-2 py-1 font-mono text-[11px] text-white/70 outline-none focus:border-accent-indigo/40"
                        />
                      </td>
                      <td className="px-2 py-1.5 text-right">
                        <button
                          type="button"
                          onClick={() => removeCol(i)}
                          className="rounded-[6px] px-2 py-1 text-[11px] text-rose-300/70 hover:bg-rose-400/10 hover:text-rose-200"
                        >
                          ×
                        </button>
                      </td>
                    </tr>

                    {col.is_foreign_key && (
                      <tr key={`fk-${i}`} className="border-t-0">
                        <td colSpan={9} className="px-3 pb-2 pt-1">
                          <div className="flex flex-wrap items-center gap-2 rounded-[8px] border border-accent-indigo/20 bg-accent-indigo/6 px-3 py-2">
                            <span className="text-[10px] font-semibold tracking-[0.14em] text-accent-indigo/70 uppercase">
                              Referência FK
                            </span>
                            <div className="flex flex-1 flex-wrap items-center gap-2">
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] text-white/30 uppercase tracking-wider">Tabela</span>
                                <select
                                  value={col.ref_entity_id ?? ''}
                                  onChange={(e) => updateColChecked(i, { ref_entity_id: e.target.value || undefined }, columns)}
                                  className="rounded-[6px] border border-white/8 bg-surface-high px-2 py-1 text-[11px] text-white/84 outline-none focus:border-accent-indigo/40"
                                >
                                  <option value="">— selecione —</option>
                                  {refEntities.map((e) => (
                                    <option key={e.id} value={e.id}>{e.name}</option>
                                  ))}
                                </select>
                              </div>

                              {col.ref_entity_id && (
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[9px] text-white/30 uppercase tracking-wider">Coluna PK</span>
                                  {(() => {
                                    const target = entities.find((e) => e.id === col.ref_entity_id)
                                    const pks = target?.pk_columns ?? []
                                    return pks.length > 1 ? (
                                      <select
                                        value={col.ref_column ?? ''}
                                        onChange={(e) => updateColChecked(i, { ref_column: e.target.value }, columns)}
                                        className="rounded-[6px] border border-white/8 bg-surface-high px-2 py-1 text-[11px] font-mono text-white/84 outline-none focus:border-accent-indigo/40"
                                      >
                                        {pks.map((pk) => (
                                          <option key={pk} value={pk}>{pk}</option>
                                        ))}
                                      </select>
                                    ) : (
                                      <span className="rounded-[6px] border border-white/6 bg-surface-high px-2 py-1 text-[11px] font-mono text-amber-300">
                                        {col.ref_column ?? pks[0] ?? '—'}
                                      </span>
                                    )
                                  })()}
                                </div>
                              )}

                              <div className="flex flex-col gap-0.5">
                                <span className="text-[9px] text-white/30 uppercase tracking-wider">Cardinalidade</span>
                                <select
                                  value={col.ref_relation_type ?? 'one_to_many'}
                                  onChange={(e) => updateColChecked(i, { ref_relation_type: e.target.value as 'one_to_one' | 'one_to_many' | 'many_to_many' }, columns)}
                                  className="rounded-[6px] border border-white/8 bg-surface-high px-2 py-1 text-[11px] text-white/84 outline-none focus:border-accent-indigo/40"
                                >
                                  {Object.entries(RELATION_TYPE_LABELS).map(([val, label]) => (
                                    <option key={val} value={val}>{label}</option>
                                  ))}
                                </select>
                              </div>

                              {!col.ref_entity_id && (
                                <span className="text-[10px] text-amber-300/70">
                                  Selecione a tabela referenciada para criar a relação automaticamente.
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          <datalist id={`dlg-types-${dialect}`}>
            {dialectInfo.types.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {[
              { key: 'PK', label: 'Primary Key', color: 'text-amber-300' },
              { key: 'NN', label: 'Not Null', color: 'text-white/50' },
              { key: 'U', label: 'Unique', color: 'text-emerald-300' },
              { key: 'FK', label: 'Foreign Key', color: 'text-accent-indigo' },
              { key: '1:1 / 1:N / N:N', label: 'Cardinalidade da relação', color: 'text-accent-violet' },
            ].map(({ key, label, color }) => (
              <span key={key} className="flex items-center gap-1 text-[10px] text-white/36">
                <span className={`font-semibold ${color}`}>{key}</span>
                <span>— {label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
