import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.catalog import (
    CatalogColumn,
    CatalogEntity,
    CatalogRelation,
    DatabaseCatalog,
    DatabaseDialect,
)
from app.schemas.catalog import (
    CatalogUpdate,
    ColumnCreate,
    DDLImportRequest,
    DDLImportResponse,
    EntityCreate,
    EntityUpdate,
    LayoutUpdate,
    RelationCreate,
)
from app.services import ddl_parser, project_service


async def _load_entity(db: AsyncSession, entity_id: uuid.UUID) -> CatalogEntity:
    result = await db.execute(
        select(CatalogEntity)
        .where(CatalogEntity.id == entity_id)
        .options(selectinload(CatalogEntity.columns))
    )
    entity = result.scalar_one_or_none()
    if not entity:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Entidade não encontrada.")
    return entity


async def _verify_entity_catalog(
    db: AsyncSession, entity_id: uuid.UUID, user_id: uuid.UUID
) -> tuple[CatalogEntity, DatabaseCatalog]:
    entity = await _load_entity(db, entity_id)
    catalog = await _load_catalog(db, entity.catalog_id)
    await project_service.verify_project_access(db, catalog.project_id, user_id)
    return entity, catalog


async def _verify_entity_catalog_editor(
    db: AsyncSession, entity_id: uuid.UUID, user_id: uuid.UUID
) -> tuple[CatalogEntity, DatabaseCatalog]:
    entity = await _load_entity(db, entity_id)
    catalog = await _load_catalog(db, entity.catalog_id)
    await project_service.verify_project_editor(db, catalog.project_id, user_id)
    return entity, catalog


async def _load_catalog(db: AsyncSession, catalog_id: uuid.UUID) -> DatabaseCatalog:
    result = await db.execute(
        select(DatabaseCatalog).where(DatabaseCatalog.id == catalog_id)
    )
    catalog = result.scalar_one_or_none()
    if not catalog:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Catálogo não encontrado.")
    return catalog


async def _verify_catalog(
    db: AsyncSession, catalog_id: uuid.UUID, user_id: uuid.UUID
) -> DatabaseCatalog:
    catalog = await _load_catalog(db, catalog_id)
    await project_service.verify_project_access(db, catalog.project_id, user_id)
    return catalog


async def _verify_catalog_editor(
    db: AsyncSession, catalog_id: uuid.UUID, user_id: uuid.UUID
) -> DatabaseCatalog:
    catalog = await _load_catalog(db, catalog_id)
    await project_service.verify_project_editor(db, catalog.project_id, user_id)
    return catalog


async def get_or_create_catalog(
    db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID
) -> DatabaseCatalog:
    await project_service.verify_project_access(db, project_id, user_id)
    result = await db.execute(
        select(DatabaseCatalog).where(DatabaseCatalog.project_id == project_id)
    )
    catalog = result.scalar_one_or_none()
    if catalog:
        return catalog
    await project_service.verify_project_editor(db, project_id, user_id)
    catalog = DatabaseCatalog(
        id=uuid.uuid4(),
        project_id=project_id,
        name="Database Catalog",
        dialect=DatabaseDialect.POSTGRES.value,
    )
    db.add(catalog)
    await db.commit()
    await db.refresh(catalog)
    return catalog


async def update_catalog(
    db: AsyncSession, catalog_id: uuid.UUID, user_id: uuid.UUID, data: CatalogUpdate
) -> DatabaseCatalog:
    catalog = await _verify_catalog_editor(db, catalog_id, user_id)
    for field_name, value in data.model_dump(exclude_unset=True).items():
        setattr(catalog, field_name, value)
    await db.commit()
    await db.refresh(catalog)
    return catalog


async def list_entities(
    db: AsyncSession, catalog_id: uuid.UUID
) -> list[CatalogEntity]:
    result = await db.execute(
        select(CatalogEntity)
        .where(CatalogEntity.catalog_id == catalog_id)
        .options(selectinload(CatalogEntity.columns))
        .order_by(CatalogEntity.name.asc())
    )
    return list(result.scalars().all())


async def list_relations(
    db: AsyncSession, catalog_id: uuid.UUID
) -> list[CatalogRelation]:
    result = await db.execute(
        select(CatalogRelation)
        .where(CatalogRelation.catalog_id == catalog_id)
        .options(
            selectinload(CatalogRelation.from_entity),
            selectinload(CatalogRelation.to_entity),
        )
    )
    return list(result.scalars().all())


def _apply_columns(entity: CatalogEntity, columns: list[ColumnCreate]) -> None:
    entity.columns.clear()
    for idx, col in enumerate(columns):
        entity.columns.append(
            CatalogColumn(
                id=uuid.uuid4(),
                entity_id=entity.id,
                name=col.name,
                data_type=col.data_type,
                is_primary_key=col.is_primary_key,
                is_unique=col.is_unique,
                is_nullable=col.is_nullable,
                is_foreign_key=col.is_foreign_key,
                default_value=col.default_value,
                description=col.description,
                ordinal=col.ordinal if col.ordinal else idx,
            )
        )


async def create_entity(
    db: AsyncSession,
    catalog_id: uuid.UUID,
    user_id: uuid.UUID,
    data: EntityCreate,
) -> CatalogEntity:
    await _verify_catalog_editor(db, catalog_id, user_id)
    entity_id = uuid.uuid4()
    entity = CatalogEntity(
        id=entity_id,
        catalog_id=catalog_id,
        name=data.name,
        schema_name=data.schema_name,
        description=data.description,
        entity_type=data.entity_type,
        tags=list(data.tags or []),
        position_x=data.position_x,
        position_y=data.position_y,
    )
    db.add(entity)
    for idx, col in enumerate(data.columns):
        if col.name.strip() and col.data_type.strip():
            db.add(CatalogColumn(
                id=uuid.uuid4(),
                entity_id=entity_id,
                name=col.name,
                data_type=col.data_type,
                is_primary_key=col.is_primary_key,
                is_unique=col.is_unique,
                is_nullable=col.is_nullable,
                is_foreign_key=col.is_foreign_key,
                default_value=col.default_value,
                description=col.description,
                ordinal=col.ordinal if col.ordinal else idx,
            ))
    await db.commit()
    return await _load_entity(db, entity_id)


async def update_entity(
    db: AsyncSession,
    entity_id: uuid.UUID,
    user_id: uuid.UUID,
    data: EntityUpdate,
) -> CatalogEntity:
    entity, _ = await _verify_entity_catalog_editor(db, entity_id, user_id)
    payload = data.model_dump(exclude_unset=True)
    columns_payload = payload.pop("columns", None)
    for field_name, value in payload.items():
        setattr(entity, field_name, value)
    if columns_payload is not None:
        _apply_columns(entity, [ColumnCreate(**c) for c in columns_payload])
    await db.commit()
    return await _load_entity(db, entity.id)


async def delete_entity(
    db: AsyncSession, entity_id: uuid.UUID, user_id: uuid.UUID
) -> None:
    entity, _ = await _verify_entity_catalog_editor(db, entity_id, user_id)
    await db.delete(entity)
    await db.commit()


async def get_entity(
    db: AsyncSession, entity_id: uuid.UUID, user_id: uuid.UUID
) -> tuple[CatalogEntity, int]:
    entity, _ = await _verify_entity_catalog(db, entity_id, user_id)
    rels = await db.execute(
        select(CatalogRelation).where(
            (CatalogRelation.from_entity_id == entity.id)
            | (CatalogRelation.to_entity_id == entity.id)
        )
    )
    relations_count = len(list(rels.scalars().all()))
    return entity, relations_count


async def create_relation(
    db: AsyncSession,
    catalog_id: uuid.UUID,
    user_id: uuid.UUID,
    data: RelationCreate,
) -> CatalogRelation:
    await _verify_catalog_editor(db, catalog_id, user_id)
    from_id = uuid.UUID(data.from_entity_id)
    to_id = uuid.UUID(data.to_entity_id)
    # Both entities must belong to this catalog
    rows = await db.execute(
        select(CatalogEntity.id).where(
            CatalogEntity.id.in_([from_id, to_id]),
            CatalogEntity.catalog_id == catalog_id,
        )
    )
    found = {r for r in rows.scalars().all()}
    if from_id not in found or to_id not in found:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Entidades de origem/destino devem pertencer a este catálogo.",
        )
    rel = CatalogRelation(
        id=uuid.uuid4(),
        catalog_id=catalog_id,
        from_entity_id=from_id,
        to_entity_id=to_id,
        from_column=data.from_column,
        to_column=data.to_column,
        relation_type=data.relation_type,
        on_delete=data.on_delete,
    )
    db.add(rel)
    await db.commit()
    result = await db.execute(
        select(CatalogRelation)
        .where(CatalogRelation.id == rel.id)
        .options(
            selectinload(CatalogRelation.from_entity),
            selectinload(CatalogRelation.to_entity),
        )
    )
    return result.scalar_one()


async def delete_relation(
    db: AsyncSession, relation_id: uuid.UUID, user_id: uuid.UUID
) -> None:
    result = await db.execute(
        select(CatalogRelation).where(CatalogRelation.id == relation_id)
    )
    rel = result.scalar_one_or_none()
    if not rel:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Relação não encontrada.")
    await _verify_catalog_editor(db, rel.catalog_id, user_id)
    await db.delete(rel)
    await db.commit()


async def save_layout(
    db: AsyncSession,
    catalog_id: uuid.UUID,
    user_id: uuid.UUID,
    data: LayoutUpdate,
) -> None:
    await _verify_catalog_editor(db, catalog_id, user_id)
    if not data.positions:
        return
    ids = [uuid.UUID(p.entity_id) for p in data.positions]
    result = await db.execute(
        select(CatalogEntity).where(
            CatalogEntity.id.in_(ids), CatalogEntity.catalog_id == catalog_id
        )
    )
    entities = {e.id: e for e in result.scalars().all()}
    for pos in data.positions:
        eid = uuid.UUID(pos.entity_id)
        if eid in entities:
            entities[eid].position_x = pos.x
            entities[eid].position_y = pos.y
    await db.commit()


async def import_ddl(
    db: AsyncSession,
    catalog_id: uuid.UUID,
    user_id: uuid.UUID,
    data: DDLImportRequest,
) -> DDLImportResponse:
    catalog = await _verify_catalog_editor(db, catalog_id, user_id)
    dialect = data.dialect or catalog.dialect
    parsed = ddl_parser.parse_ddl(data.ddl, dialect)

    if not data.commit:
        return DDLImportResponse(
            preview=True,
            entities=parsed.entities,
            relations=parsed.relations,
        )

    # Commit: create entities respecting conflict_strategy
    existing = await list_entities(db, catalog_id)
    existing_by_name = {e.name: e for e in existing}
    created_ids: list[str] = []
    name_to_entity: dict[str, CatalogEntity] = dict(existing_by_name)

    for parsed_entity in parsed.entities:
        name = parsed_entity.name
        if name in existing_by_name:
            if data.conflict_strategy == "skip":
                continue
            if data.conflict_strategy == "overwrite":
                await db.delete(existing_by_name[name])
                await db.flush()
                name_to_entity.pop(name, None)
            elif data.conflict_strategy == "rename":
                suffix = 2
                while f"{name}_{suffix}" in existing_by_name:
                    suffix += 1
                name = f"{name}_{suffix}"

        entity = CatalogEntity(
            id=uuid.uuid4(),
            catalog_id=catalog_id,
            name=name,
            schema_name=parsed_entity.schema_name,
            entity_type="table",
            tags=[],
        )
        db.add(entity)
        await db.flush()
        _apply_columns(entity, parsed_entity.columns)
        name_to_entity[name] = entity
        created_ids.append(str(entity.id))

    for parsed_rel in parsed.relations:
        from_entity = name_to_entity.get(parsed_rel.from_entity)
        to_entity = name_to_entity.get(parsed_rel.to_entity)
        if not from_entity or not to_entity:
            continue
        rel = CatalogRelation(
            id=uuid.uuid4(),
            catalog_id=catalog_id,
            from_entity_id=from_entity.id,
            to_entity_id=to_entity.id,
            from_column=parsed_rel.from_column,
            to_column=parsed_rel.to_column,
            relation_type="one_to_many",
            on_delete=parsed_rel.on_delete,
        )
        db.add(rel)

    await db.commit()
    return DDLImportResponse(
        preview=False,
        entities=parsed.entities,
        relations=parsed.relations,
        committed_entity_ids=created_ids,
    )
