import uuid

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.engine import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.project import (
    ProjectCreate,
    ProjectDetailResponse,
    ProjectProfileUpdate,
    ProjectResponse,
    ProjectUpdate,
)
from app.services import project_service

router = APIRouter()


@router.get("", response_model=list[ProjectResponse])
async def list_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    rows = await project_service.list_by_user(db, current_user.id)
    return [
        ProjectResponse.from_orm(
            row["project"],
            task_count=row["task_count"],
            done_count=row["done_count"],
            last_session_at=row["last_session_at"],
        )
        for row in rows
    ]


@router.post("", response_model=ProjectDetailResponse, status_code=201)
async def create_project(
    data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await project_service.create(db, current_user.id, data)
    return ProjectDetailResponse.from_orm(project)


@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await project_service.get_detail(db, uuid.UUID(project_id), current_user.id)
    return ProjectDetailResponse.from_orm(project)


@router.put("/{project_id}", response_model=ProjectDetailResponse)
async def update_project(
    project_id: str,
    data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await project_service.update(db, uuid.UUID(project_id), current_user.id, data)
    return ProjectDetailResponse.from_orm(project)


@router.delete("/{project_id}", status_code=204)
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await project_service.delete(db, uuid.UUID(project_id), current_user.id)
    return Response(status_code=204)


@router.put("/{project_id}/profile", response_model=ProjectDetailResponse)
async def update_project_profile(
    project_id: str,
    data: ProjectProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await project_service.update_profile(
        db, uuid.UUID(project_id), current_user.id, data
    )
    return ProjectDetailResponse.from_orm(project)
