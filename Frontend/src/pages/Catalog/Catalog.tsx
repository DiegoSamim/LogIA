import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { DIALECT_OPTIONS, type DbDialect } from '@/data/dbDialects'
import {
  catalogService,
  type CatalogOverviewDTO,
  type EntityDTO,
  type EntitySummaryDTO,
} from '@/services/catalog.service'
import { projectService } from '@/services/project.service'
import { useAppStore } from '@/store/useAppStore'
import { canEditProjectRole } from '@/lib/permissions'
import CatalogCards from './CatalogCards'
import CatalogDiagram from './CatalogDiagram'
import EntityDetailPanel from './EntityDetailPanel'
import EntityFormModal, { type EntitySubmitPayload } from './EntityFormModal'
import ImportDDLModal from './ImportDDLModal'

type ViewMode = 'cards' | 'diagram'

export default function Catalog() {
  const { projectId } = useParams<{ projectId: string }>()
  const { currentProject, setCurrentProject } = useAppStore()
  const [overview, setOverview] = useState<CatalogOverviewDTO | null>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<ViewMode>('cards')
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingEntity, setEditingEntity] = useState<EntityDTO | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const loadCatalog = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      const { data } = await catalogService.getByProject(projectId)
      setOverview(data)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void loadCatalog()
  }, [loadCatalog])

  useEffect(() => {
    if (!projectId || (currentProject?.id === projectId && currentProject.current_user_role)) return
    projectService.get(projectId).then(({ data }) => {
      setCurrentProject({ id: data.id, name: data.name, current_user_role: data.current_user_role })
    }).catch(() => undefined)
  }, [currentProject?.current_user_role, currentProject?.id, projectId, setCurrentProject])

  const dialect: DbDialect = overview?.catalog.dialect ?? 'postgres'
  const canEdit = canEditProjectRole(
    currentProject && currentProject.id === projectId ? currentProject.current_user_role : null,
  )

  function handleSelect(entity: EntitySummaryDTO) {
    setSelectedEntityId(entity.id)
  }

  function handleCreate() {
    if (!canEdit) return
    setEditingEntity(null)
    setFormOpen(true)
  }

  async function handleSubmitEntity(data: EntitySubmitPayload) {
    if (!overview || !canEdit) return
    const { fkRelations, ...entityData } = data
    let entityId: string

    if (editingEntity) {
      await catalogService.updateEntity(editingEntity.id, entityData)
      entityId = editingEntity.id
      // Delete all outgoing relations from this entity before recreating
      const oldRels = overview.relations.filter((r) => r.from_entity_id === entityId)
      await Promise.all(oldRels.map((r) => catalogService.deleteRelation(r.id)))
    } else {
      const { data: created } = await catalogService.createEntity(overview.catalog.id, entityData)
      entityId = created.id
    }

    // Create new FK relations
    await Promise.all(
      fkRelations
        .filter((fk) => fk.ref_entity_id && fk.ref_column)
        .map((fk) =>
          catalogService.createRelation(overview.catalog.id, {
            from_entity_id: entityId,
            to_entity_id: fk.ref_entity_id!,
            from_column: fk.from_column,
            to_column: fk.ref_column!,
            relation_type: fk.ref_relation_type ?? 'one_to_many',
          }),
        ),
    )

    await loadCatalog()
  }

  async function handleDeleteEntity(entity: EntityDTO) {
    if (!canEdit) return
    if (!confirm(`Excluir tabela "${entity.name}"? Esta ação não pode ser desfeita.`)) return
    await catalogService.deleteEntity(entity.id)
    setSelectedEntityId(null)
    await loadCatalog()
  }

  async function updateDialect(nextDialect: DbDialect) {
    if (!overview || !canEdit) return
    const { data } = await catalogService.updateCatalog(overview.catalog.id, {
      dialect: nextDialect,
    })
    setOverview((prev) => (prev ? { ...prev, catalog: data } : prev))
    setMenuOpen(false)
  }

  async function handleLayoutChange(positions: { entity_id: string; x: number; y: number }[]) {
    if (!overview || !canEdit) return
    await catalogService.saveLayout(overview.catalog.id, positions)
    setOverview((prev) =>
      prev
        ? {
            ...prev,
            entities: prev.entities.map((e) => {
              const p = positions.find((pos) => pos.entity_id === e.id)
              return p ? { ...e, position_x: p.x, position_y: p.y } : e
            }),
          }
        : prev,
    )
  }

  function onEditEntity(entity: EntityDTO) {
    if (!canEdit) return
    setEditingEntity(entity)
    setFormOpen(true)
  }

  function onDescriptionUpdated(entity: EntityDTO) {
    setOverview((prev) =>
      prev
        ? {
            ...prev,
            entities: prev.entities.map((e) =>
              e.id === entity.id ? { ...e, description: entity.description } : e,
            ),
          }
        : prev,
    )
  }

  const dialectLabel = DIALECT_OPTIONS.find((o) => o.value === dialect)?.label ?? dialect

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col lg:flex-row">
      <div className="flex min-w-0 flex-1 flex-col px-6 py-6 lg:px-10">
        <header className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-[32px] font-semibold leading-tight text-white/94">
                Catálogo
              </h1>
              <p className="mt-2 max-w-md text-[13px] text-white/50">
                Visualize e gerencie as tabelas do banco de dados.
              </p>
              <div className="mt-2">
                <span className="inline-flex items-center gap-1.5 rounded-[6px] border border-accent-indigo/30 bg-accent-indigo/10 px-2 py-1 text-[10px] font-semibold tracking-[0.14em] text-accent-indigo uppercase">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <ellipse cx="12" cy="5" rx="9" ry="3" />
                    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                    <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
                  </svg>
                  {dialectLabel}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-[8px] border border-white/8 bg-surface-container p-1">
                <button
                  type="button"
                  onClick={() => setMode('cards')}
                  className={`rounded-[6px] px-3 py-1.5 text-[11px] font-semibold tracking-[0.12em] uppercase transition ${
                    mode === 'cards' ? 'bg-surface-high text-white/90' : 'text-white/44 hover:text-white/70'
                  }`}
                >
                  Catálogo
                </button>
                <button
                  type="button"
                  onClick={() => setMode('diagram')}
                  className={`rounded-[6px] px-3 py-1.5 text-[11px] font-semibold tracking-[0.12em] uppercase transition ${
                    mode === 'diagram' ? 'bg-surface-high text-white/90' : 'text-white/44 hover:text-white/70'
                  }`}
                >
                  Diagrama
                </button>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={handleCreate}
                  className="rounded-[8px] bg-gradient-to-r from-accent-indigo to-indigo-500 px-4 py-2 text-xs font-semibold text-white hover:brightness-110"
                >
                  + Nova Tabela
                </button>
              )}
              {canEdit && (
                <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-white/8 bg-surface-container text-white/56 hover:border-white/16 hover:text-white/84"
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <circle cx="3" cy="8" r="1.5" />
                    <circle cx="8" cy="8" r="1.5" />
                    <circle cx="13" cy="8" r="1.5" />
                  </svg>
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-11 z-30 w-56 rounded-[10px] border border-white/8 bg-surface-container p-2 shadow-[0_10px_32px_rgba(0,0,0,0.5)]">
                    <button
                      type="button"
                      onClick={() => {
                        setImportOpen(true)
                        setMenuOpen(false)
                      }}
                      className="block w-full rounded-[6px] px-3 py-2 text-left text-[12px] text-white/78 hover:bg-white/6"
                    >
                      Importar DDL
                    </button>
                    <div className="mt-1 border-t border-white/6 pt-1">
                      <p className="px-3 py-1 text-[10px] font-semibold tracking-[0.16em] text-white/34 uppercase">
                        Engine
                      </p>
                      {DIALECT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => void updateDialect(opt.value)}
                          className={`block w-full rounded-[6px] px-3 py-1.5 text-left text-[12px] transition ${
                            opt.value === dialect
                              ? 'bg-accent-indigo/10 text-accent-indigo'
                              : 'text-white/72 hover:bg-white/6'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                </div>
              )}
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-white/50">Carregando catálogo…</div>
        ) : (
          <>
            <div className="mb-6">
              {mode === 'cards' ? (
                <CatalogCards
                  entities={overview?.entities ?? []}
                  relations={overview?.relations ?? []}
                  canEdit={canEdit}
                  onSelect={handleSelect}
                  onCreate={handleCreate}
                />
              ) : (
                <CatalogDiagram
                  entities={overview?.entities ?? []}
                  relations={overview?.relations ?? []}
                  canEdit={canEdit}
                  onSelect={setSelectedEntityId}
                  onLayoutChange={handleLayoutChange}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <StatCard label="Total de Tabelas" value={overview?.entities.length ?? 0} color="border-accent-indigo" />
              <StatCard
                label="Total de Relações"
                value={overview?.relations.length ?? 0}
                color="border-accent-violet"
              />
            </div>
          </>
        )}
      </div>

      {selectedEntityId && overview && (
        <EntityDetailPanel
          key={selectedEntityId}
          entityId={selectedEntityId}
          relations={overview.relations}
          onClose={() => setSelectedEntityId(null)}
          onEdit={onEditEntity}
          onDelete={(e) => void handleDeleteEntity(e)}
          onDescriptionUpdated={onDescriptionUpdated}
          onNavigateEntity={(id) => setSelectedEntityId(id)}
          canEdit={canEdit}
        />
      )}

      {overview && (
        <>
          <EntityFormModal
            open={formOpen}
            dialect={dialect}
            entity={editingEntity}
            entities={overview.entities}
            relations={overview.relations}
            onClose={() => setFormOpen(false)}
            onSubmit={async (data) => {
              await handleSubmitEntity(data)
            }}
          />
          <ImportDDLModal
            open={importOpen}
            catalogId={overview.catalog.id}
            dialect={dialect}
            onClose={() => setImportOpen(false)}
            onImported={() => void loadCatalog()}
          />
        </>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="relative overflow-hidden rounded-[10px] border border-white/6 bg-surface-container/70 px-4 py-3">
      <span className={`absolute left-0 top-0 h-full w-[3px] ${color.replace('border', 'bg')}`} />
      <p className="text-[10px] font-semibold tracking-[0.2em] text-white/36 uppercase">{label}</p>
      <p className="mt-1.5 font-mono text-2xl text-white/90">{value.toString().padStart(2, '0')}</p>
    </div>
  )
}
