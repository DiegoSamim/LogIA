from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

Dialect = Literal["postgres", "mysql", "sqlserver", "oracle", "sqlite", "mongodb", "other"]
EntityType = Literal["table", "view", "collection"]
RelationType = Literal["one_to_one", "one_to_many", "many_to_many"]
DDLConflictStrategy = Literal["skip", "overwrite", "rename"]


class ColumnCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    data_type: str = Field(min_length=1, max_length=255)
    is_primary_key: bool = False
    is_unique: bool = False
    is_nullable: bool = True
    is_foreign_key: bool = False
    default_value: str | None = None
    description: str | None = None
    ordinal: int = 0


class ColumnUpdate(BaseModel):
    name: str | None = None
    data_type: str | None = None
    is_primary_key: bool | None = None
    is_unique: bool | None = None
    is_nullable: bool | None = None
    is_foreign_key: bool | None = None
    default_value: str | None = None
    description: str | None = None
    ordinal: int | None = None


class ColumnResponse(BaseModel):
    id: str
    entity_id: str
    name: str
    data_type: str
    is_primary_key: bool
    is_unique: bool
    is_nullable: bool
    is_foreign_key: bool
    default_value: str | None
    description: str | None
    ordinal: int

    @classmethod
    def from_orm(cls, col) -> "ColumnResponse":
        return cls(
            id=str(col.id),
            entity_id=str(col.entity_id),
            name=col.name,
            data_type=col.data_type,
            is_primary_key=col.is_primary_key,
            is_unique=col.is_unique,
            is_nullable=col.is_nullable,
            is_foreign_key=col.is_foreign_key,
            default_value=col.default_value,
            description=col.description,
            ordinal=col.ordinal,
        )


class EntityCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    schema_name: str | None = None
    description: str | None = None
    entity_type: EntityType = "table"
    tags: list[str] = []
    position_x: float | None = None
    position_y: float | None = None
    columns: list[ColumnCreate] = []


class EntityUpdate(BaseModel):
    name: str | None = None
    schema_name: str | None = None
    description: str | None = None
    entity_type: EntityType | None = None
    tags: list[str] | None = None
    position_x: float | None = None
    position_y: float | None = None
    columns: list[ColumnCreate] | None = None


class EntitySummaryResponse(BaseModel):
    id: str
    catalog_id: str
    name: str
    schema_name: str | None
    description: str | None
    entity_type: str
    tags: list[str]
    position_x: float | None
    position_y: float | None
    columns_count: int
    relations_count: int
    pk_columns: list[str] = []

    @classmethod
    def from_orm(cls, entity, *, relations_count: int = 0) -> "EntitySummaryResponse":
        cols = entity.columns or []
        return cls(
            id=str(entity.id),
            catalog_id=str(entity.catalog_id),
            name=entity.name,
            schema_name=entity.schema_name,
            description=entity.description,
            entity_type=entity.entity_type,
            tags=list(entity.tags or []),
            position_x=entity.position_x,
            position_y=entity.position_y,
            columns_count=len(cols),
            relations_count=relations_count,
            pk_columns=[c.name for c in cols if c.is_primary_key],
        )


class EntityResponse(EntitySummaryResponse):
    columns: list[ColumnResponse]

    @classmethod
    def from_orm(cls, entity, *, relations_count: int = 0) -> "EntityResponse":  # type: ignore[override]
        summary = EntitySummaryResponse.from_orm(entity, relations_count=relations_count)
        return cls(
            **summary.model_dump(),
            columns=[ColumnResponse.from_orm(c) for c in entity.columns or []],
        )


class RelationCreate(BaseModel):
    from_entity_id: str
    to_entity_id: str
    from_column: str
    to_column: str
    relation_type: RelationType = "one_to_many"
    on_delete: str | None = None


class RelationResponse(BaseModel):
    id: str
    catalog_id: str
    from_entity_id: str
    to_entity_id: str
    from_entity_name: str
    to_entity_name: str
    from_column: str
    to_column: str
    relation_type: str
    on_delete: str | None

    @classmethod
    def from_orm(cls, rel) -> "RelationResponse":
        return cls(
            id=str(rel.id),
            catalog_id=str(rel.catalog_id),
            from_entity_id=str(rel.from_entity_id),
            to_entity_id=str(rel.to_entity_id),
            from_entity_name=rel.from_entity.name if rel.from_entity else "",
            to_entity_name=rel.to_entity.name if rel.to_entity else "",
            from_column=rel.from_column,
            to_column=rel.to_column,
            relation_type=rel.relation_type,
            on_delete=rel.on_delete,
        )


class CatalogUpdate(BaseModel):
    name: str | None = None
    dialect: Dialect | None = None
    description: str | None = None


class CatalogResponse(BaseModel):
    id: str
    project_id: str
    name: str
    dialect: str
    description: str | None
    created_at: str

    @classmethod
    def from_orm(cls, catalog) -> "CatalogResponse":
        return cls(
            id=str(catalog.id),
            project_id=str(catalog.project_id),
            name=catalog.name,
            dialect=catalog.dialect,
            description=catalog.description,
            created_at=catalog.created_at.isoformat(),
        )


class CatalogOverviewResponse(BaseModel):
    catalog: CatalogResponse
    entities: list[EntitySummaryResponse]
    relations: list[RelationResponse]


class LayoutPosition(BaseModel):
    entity_id: str
    x: float
    y: float


class LayoutUpdate(BaseModel):
    positions: list[LayoutPosition]


class DDLImportRequest(BaseModel):
    ddl: str = Field(min_length=1)
    dialect: Dialect | None = None
    commit: bool = False
    conflict_strategy: DDLConflictStrategy = "skip"


class ParsedEntityPreview(BaseModel):
    name: str
    schema_name: str | None = None
    columns: list[ColumnCreate]


class ParsedRelationPreview(BaseModel):
    from_entity: str
    to_entity: str
    from_column: str
    to_column: str
    on_delete: str | None = None


class DDLImportResponse(BaseModel):
    preview: bool
    entities: list[ParsedEntityPreview]
    relations: list[ParsedRelationPreview]
    committed_entity_ids: list[str] = []
