import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import type { DbDialect } from '@/data/dbDialects'
import { catalogService, type DDLImportResponse } from '@/services/catalog.service'

interface Props {
  open: boolean
  catalogId: string
  dialect: DbDialect
  onClose: () => void
  onImported: () => void
}

export default function ImportDDLModal({ open, catalogId, dialect, onClose, onImported }: Props) {
  const [ddl, setDdl] = useState('')
  const [preview, setPreview] = useState<DDLImportResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [strategy, setStrategy] = useState<'skip' | 'overwrite' | 'rename'>('skip')
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setDdl('')
    setPreview(null)
    setError(null)
    setStrategy('skip')
  }

  async function handlePreview() {
    if (!ddl.trim()) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await catalogService.importDDL(catalogId, { ddl, dialect, commit: false })
      setPreview(data)
      if (data.entities.length === 0) {
        setError('Nenhuma tabela detectada no DDL. Verifique a sintaxe e o dialeto.')
      }
    } catch (e) {
      setError('Falha ao fazer parse do DDL.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleCommit() {
    if (!preview) return
    setLoading(true)
    setError(null)
    try {
      await catalogService.importDDL(catalogId, { ddl, dialect, commit: true, conflict_strategy: strategy })
      onImported()
      reset()
      onClose()
    } catch (e) {
      setError('Falha ao importar.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    if (loading) return
    reset()
    onClose()
  }

  return (
    <Modal
      open={open}
      title="Importar schema (DDL)"
      eyebrow="Auto-complete"
      description="Cole comandos CREATE TABLE para criar entidades em lote."
      onClose={handleClose}
      panelClassName="max-w-3xl"
      footer={
        <>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-[8px] border border-white/8 px-4 py-2 text-xs font-medium text-white/60 hover:border-white/16 hover:text-white/84"
          >
            Cancelar
          </button>
          {!preview ? (
            <button
              type="button"
              onClick={handlePreview}
              disabled={loading || !ddl.trim()}
              className="rounded-[8px] bg-gradient-to-r from-accent-indigo to-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50"
            >
              {loading ? 'Analisando...' : 'Analisar DDL'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCommit}
              disabled={loading || preview.entities.length === 0}
              className="rounded-[8px] bg-gradient-to-r from-accent-indigo to-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50"
            >
              {loading ? 'Importando...' : `Importar ${preview.entities.length} entidade(s)`}
            </button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <textarea
          value={ddl}
          onChange={(e) => setDdl(e.target.value)}
          rows={10}
          placeholder={'CREATE TABLE users (\n  id uuid PRIMARY KEY,\n  email varchar(255) UNIQUE NOT NULL\n);'}
          className="w-full rounded-[8px] border border-white/8 bg-surface-low px-3 py-2 font-mono text-[12px] text-white/88 outline-none focus:border-accent-indigo/40"
        />

        {error && <p className="text-[12px] text-rose-300/90">{error}</p>}

        {preview && (
          <div className="space-y-3 rounded-[10px] border border-white/6 bg-surface-low/60 p-4">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-white/56 uppercase">
              Preview — {preview.entities.length} entidade(s) · {preview.relations.length} relação(ões)
            </p>
            <ul className="space-y-1 text-[12px] text-white/78">
              {preview.entities.map((e) => (
                <li key={e.name} className="flex items-baseline gap-2">
                  <span className="font-mono text-white/92">{e.name}</span>
                  <span className="text-white/44">({e.columns.length} colunas)</span>
                </li>
              ))}
            </ul>
            {preview.relations.length > 0 && (
              <ul className="space-y-1 text-[11px] text-white/58">
                {preview.relations.map((r, i) => (
                  <li key={i} className="font-mono">
                    {r.from_entity}.{r.from_column} → {r.to_entity}.{r.to_column}
                  </li>
                ))}
              </ul>
            )}

            <div className="pt-2">
              <p className="mb-1.5 text-[10px] font-semibold tracking-[0.16em] text-white/44 uppercase">
                Em caso de conflito de nome
              </p>
              <div className="flex gap-2 text-[11px]">
                {(['skip', 'overwrite', 'rename'] as const).map((s) => (
                  <label
                    key={s}
                    className={`cursor-pointer rounded-[6px] border px-2.5 py-1 ${
                      strategy === s
                        ? 'border-accent-indigo/40 bg-accent-indigo/12 text-accent-indigo'
                        : 'border-white/8 text-white/60 hover:border-white/16'
                    }`}
                  >
                    <input
                      type="radio"
                      className="hidden"
                      checked={strategy === s}
                      onChange={() => setStrategy(s)}
                    />
                    {s === 'skip' ? 'Pular' : s === 'overwrite' ? 'Sobrescrever' : 'Renomear'}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
