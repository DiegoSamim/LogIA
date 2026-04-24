import api from './api'
import type { DbDialect } from '@/data/dbDialects'

export interface CatalogDTO {
  id: string
  project_id: string
  name: string
  dialect: DbDialect
  description: string | null
  created_at: string
}

export interface ColumnDTO {
  id: string
  entity_id: string
  name: string
  data_type: string
  is_primary_key: boolean
  is_unique: boolean
  is_nullable: boolean
  is_foreign_key: boolean
  default_value: string | null
  description: string | null
  ordinal: number
}

export interface ColumnInput {
  name: string
  data_type: string
  is_primary_key?: boolean
  is_unique?: boolean
  is_nullable?: boolean
  is_foreign_key?: boolean
  default_value?: string | null
  description?: string | null
  ordinal?: number
  // frontend-only FK reference fields (not sent to backend)
  ref_entity_id?: string
  ref_column?: string
  ref_relation_type?: 'one_to_one' | 'one_to_many' | 'many_to_many'
}

export interface EntitySummaryDTO {
  id: string
  catalog_id: string
  name: string
  schema_name: string | null
  description: string | null
  entity_type: string
  tags: string[]
  position_x: number | null
  position_y: number | null
  columns_count: number
  relations_count: number
  pk_columns: string[]
}

export interface EntityDTO extends EntitySummaryDTO {
  columns: ColumnDTO[]
}

export interface RelationDTO {
  id: string
  catalog_id: string
  from_entity_id: string
  to_entity_id: string
  from_entity_name: string
  to_entity_name: string
  from_column: string
  to_column: string
  relation_type: 'one_to_one' | 'one_to_many' | 'many_to_many'
  on_delete: string | null
}

export interface CatalogOverviewDTO {
  catalog: CatalogDTO
  entities: EntitySummaryDTO[]
  relations: RelationDTO[]
}

export interface EntityInput {
  name: string
  schema_name?: string | null
  description?: string | null
  entity_type?: 'table' | 'view' | 'collection'
  tags?: string[]
  position_x?: number | null
  position_y?: number | null
  columns?: ColumnInput[]
}

export interface DDLImportResponse {
  preview: boolean
  entities: { name: string; schema_name: string | null; columns: ColumnInput[] }[]
  relations: {
    from_entity: string
    to_entity: string
    from_column: string
    to_column: string
    on_delete: string | null
  }[]
  committed_entity_ids: string[]
}

export const catalogService = {
  getByProject: (projectId: string) =>
    api.get<CatalogOverviewDTO>(`/projects/${projectId}/catalog`),
  updateCatalog: (catalogId: string, data: Partial<Pick<CatalogDTO, 'name' | 'dialect' | 'description'>>) =>
    api.patch<CatalogDTO>(`/catalog/${catalogId}`, data),
  createEntity: (catalogId: string, data: EntityInput) =>
    api.post<EntityDTO>(`/catalog/${catalogId}/entities`, data),
  updateEntity: (entityId: string, data: Partial<EntityInput>) =>
    api.patch<EntityDTO>(`/catalog/entities/${entityId}`, data),
  deleteEntity: (entityId: string) =>
    api.delete(`/catalog/entities/${entityId}`),
  getEntity: (entityId: string) =>
    api.get<EntityDTO>(`/catalog/entities/${entityId}`),
  createRelation: (
    catalogId: string,
    data: {
      from_entity_id: string
      to_entity_id: string
      from_column: string
      to_column: string
      relation_type?: 'one_to_one' | 'one_to_many' | 'many_to_many'
      on_delete?: string | null
    },
  ) => api.post<RelationDTO>(`/catalog/${catalogId}/relations`, data),
  deleteRelation: (relationId: string) =>
    api.delete(`/catalog/relations/${relationId}`),
  saveLayout: (
    catalogId: string,
    positions: { entity_id: string; x: number; y: number }[],
  ) => api.patch(`/catalog/${catalogId}/layout`, { positions }),
  importDDL: (
    catalogId: string,
    data: { ddl: string; dialect?: DbDialect; commit?: boolean; conflict_strategy?: 'skip' | 'overwrite' | 'rename' },
  ) => api.post<DDLImportResponse>(`/catalog/${catalogId}/import-ddl`, data),
}
