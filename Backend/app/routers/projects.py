import uuid

from fastapi import APIRouter, Depends, Response, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.engine import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.project import (
    ProjectAttachmentResponse,
    ProjectCreate,
    ProjectDetailResponse,
    ProjectMemberCreate,
    ProjectMemberSimpleResponse,
    ProjectMemberUpdate,
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


@router.get("/{project_id}/members", response_model=list[ProjectMemberSimpleResponse])
async def list_project_members(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await project_service.get_detail(db, uuid.UUID(project_id), current_user.id)
    return [ProjectMemberSimpleResponse.from_orm(member) for member in project.members]


@router.post("/{project_id}/members", response_model=ProjectMemberSimpleResponse, status_code=201)
async def add_project_member(
    project_id: str,
    data: ProjectMemberCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member = await project_service.add_member(db, uuid.UUID(project_id), current_user.id, data)
    return ProjectMemberSimpleResponse.from_orm(member)


@router.patch("/{project_id}/members/{member_id}", response_model=ProjectMemberSimpleResponse)
async def update_project_member(
    project_id: str,
    member_id: str,
    data: ProjectMemberUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    member = await project_service.update_member(
        db,
        uuid.UUID(project_id),
        uuid.UUID(member_id),
        current_user.id,
        data,
    )
    return ProjectMemberSimpleResponse.from_orm(member)


@router.delete("/{project_id}/members/{member_id}", status_code=204)
async def remove_project_member(
    project_id: str,
    member_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await project_service.remove_member(
        db,
        uuid.UUID(project_id),
        uuid.UUID(member_id),
        current_user.id,
    )
    return Response(status_code=204)


@router.get("/{project_id}/attachments", response_model=list[ProjectAttachmentResponse])
async def list_project_attachments(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    attachments = await project_service.list_attachments(db, uuid.UUID(project_id), current_user.id)
    return [ProjectAttachmentResponse.from_orm(a) for a in attachments]


@router.post("/{project_id}/attachments", response_model=ProjectAttachmentResponse, status_code=201)
async def upload_project_attachment(
    project_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    att = await project_service.create_attachment(db, uuid.UUID(project_id), current_user.id, file)
    return ProjectAttachmentResponse.from_orm(att)


@router.delete("/{project_id}/attachments/{attachment_id}", status_code=204)
async def delete_project_attachment(
    project_id: str,
    attachment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await project_service.delete_attachment(db, uuid.UUID(project_id), uuid.UUID(attachment_id), current_user.id)
    return Response(status_code=204)
