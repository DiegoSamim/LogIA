import uuid
from collections import defaultdict

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.engine import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.catalog import (
    CatalogOverviewResponse,
    CatalogResponse,
    CatalogUpdate,
    DDLImportRequest,
    DDLImportResponse,
    EntityCreate,
    EntityResponse,
    EntitySummaryResponse,
    EntityUpdate,
    LayoutUpdate,
    RelationCreate,
    RelationResponse,
)
from app.services import catalog_service

router = APIRouter()


def _count_relations_by_entity(relations) -> dict[str, int]:
    counts: dict[str, int] = defaultdict(int)
    for rel in relations:
        counts[str(rel.from_entity_id)] += 1
        counts[str(rel.to_entity_id)] += 1
    return counts


@router.get("/projects/{project_id}/catalog", response_model=CatalogOverviewResponse)
async def get_project_catalog(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    catalog = await catalog_service.get_or_create_catalog(
        db, uuid.UUID(project_id), current_user.id
    )
    entities = await catalog_service.list_entities(db, catalog.id)
    relations = await catalog_service.list_relations(db, catalog.id)
    rel_counts = _count_relations_by_entity(relations)
    return CatalogOverviewResponse(
        catalog=CatalogResponse.from_orm(catalog),
        entities=[
            EntitySummaryResponse.from_orm(e, relations_count=rel_counts.get(str(e.id), 0))
            for e in entities
        ],
        relations=[RelationResponse.from_orm(r) for r in relations],
    )


@router.patch("/catalog/{catalog_id}", response_model=CatalogResponse)
async def update_catalog(
    catalog_id: str,
    data: CatalogUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    catalog = await catalog_service.update_catalog(
        db, uuid.UUID(catalog_id), current_user.id, data
    )
    return CatalogResponse.from_orm(catalog)


@router.post(
    "/catalog/{catalog_id}/entities",
    response_model=EntityResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_entity(
    catalog_id: str,
    data: EntityCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    entity = await catalog_service.create_entity(
        db, uuid.UUID(catalog_id), current_user.id, data
    )
    return EntityResponse.from_orm(entity)


@router.patch("/catalog/entities/{entity_id}", response_model=EntityResponse)
async def update_entity(
    entity_id: str,
    data: EntityUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    entity = await catalog_service.update_entity(
        db, uuid.UUID(entity_id), current_user.id, data
    )
    return EntityResponse.from_orm(entity)


@router.delete("/catalog/entities/{entity_id}", status_code=204)
async def delete_entity(
    entity_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await catalog_service.delete_entity(db, uuid.UUID(entity_id), current_user.id)
    return Response(status_code=204)


@router.get("/catalog/entities/{entity_id}", response_model=EntityResponse)
async def get_entity(
    entity_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    entity, rel_count = await catalog_service.get_entity(
        db, uuid.UUID(entity_id), current_user.id
    )
    return EntityResponse.from_orm(entity, relations_count=rel_count)


@router.post(
    "/catalog/{catalog_id}/relations",
    response_model=RelationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_relation(
    catalog_id: str,
    data: RelationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rel = await catalog_service.create_relation(
        db, uuid.UUID(catalog_id), current_user.id, data
    )
    return RelationResponse.from_orm(rel)


@router.delete("/catalog/relations/{relation_id}", status_code=204)
async def delete_relation(
    relation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await catalog_service.delete_relation(db, uuid.UUID(relation_id), current_user.id)
    return Response(status_code=204)


@router.patch("/catalog/{catalog_id}/layout", status_code=204)
async def save_layout(
    catalog_id: str,
    data: LayoutUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await catalog_service.save_layout(
        db, uuid.UUID(catalog_id), current_user.id, data
    )
    return Response(status_code=204)


@router.post("/catalog/{catalog_id}/import-ddl", response_model=DDLImportResponse)
async def import_ddl(
    catalog_id: str,
    data: DDLImportRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await catalog_service.import_ddl(
        db, uuid.UUID(catalog_id), current_user.id, data
    )
