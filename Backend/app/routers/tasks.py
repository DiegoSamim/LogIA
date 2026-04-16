import uuid

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import get_current_user
from app.db.engine import get_db
from app.models.user import User
from app.schemas.task import (
    TaskAttachmentResponse,
    TaskCheckpointBatchCreate,
    TaskCheckpointCreate,
    TaskCheckpointPatch,
    TaskCheckpointResponse,
    TaskCreate,
    TaskPatch,
    TaskResponse,
    TaskUpdateCreate,
    TaskUpdateResponse,
)
from app.services import task_service

router = APIRouter()


@router.get("/projects/{project_id}/tasks", response_model=list[TaskResponse])
async def list_tasks(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    tasks = await task_service.list_by_project(db, project_id, current_user.id)
    return [TaskResponse.from_orm(t) for t in tasks]


@router.post("/projects/{project_id}/tasks", response_model=TaskResponse, status_code=201)
async def create_task(
    project_id: uuid.UUID,
    data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task = await task_service.create(db, current_user.id, project_id, data)
    return TaskResponse.from_orm(task)


@router.get("/tasks/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task = await task_service.get(db, task_id, current_user.id)
    return TaskResponse.from_orm(task)


@router.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: uuid.UUID,
    data: TaskPatch,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    task = await task_service.update(db, task_id, current_user.id, data)
    return TaskResponse.from_orm(task)


@router.delete("/tasks/{task_id}", status_code=204)
async def delete_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await task_service.delete(db, task_id, current_user.id)


@router.get("/tasks/{task_id}/updates", response_model=list[TaskUpdateResponse])
async def list_task_updates(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    updates = await task_service.list_updates(db, task_id, current_user.id)
    return [TaskUpdateResponse.from_orm(u) for u in updates]


@router.post("/tasks/{task_id}/updates", response_model=TaskUpdateResponse, status_code=201)
async def add_task_update(
    task_id: uuid.UUID,
    data: TaskUpdateCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    update = await task_service.add_update(db, task_id, current_user.id, data)
    return TaskUpdateResponse.from_orm(update)


@router.post("/tasks/{task_id}/checkpoints", response_model=TaskCheckpointResponse, status_code=201)
async def create_checkpoint(
    task_id: uuid.UUID,
    data: TaskCheckpointCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cp = await task_service.create_checkpoint(db, task_id, current_user.id, data)
    return TaskCheckpointResponse.from_orm(cp)


@router.post("/tasks/{task_id}/checkpoints/batch", response_model=list[TaskCheckpointResponse], status_code=201)
async def create_checkpoints_batch(
    task_id: uuid.UUID,
    data: TaskCheckpointBatchCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    checkpoints = await task_service.create_checkpoints_batch(db, task_id, current_user.id, data)
    return [TaskCheckpointResponse.from_orm(cp) for cp in checkpoints]


@router.patch("/tasks/{task_id}/checkpoints/{checkpoint_id}", response_model=TaskCheckpointResponse)
async def update_checkpoint(
    task_id: uuid.UUID,
    checkpoint_id: uuid.UUID,
    data: TaskCheckpointPatch,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cp = await task_service.update_checkpoint(db, task_id, checkpoint_id, current_user.id, data)
    return TaskCheckpointResponse.from_orm(cp)


@router.get("/tasks/{task_id}/checkpoints", response_model=list[TaskCheckpointResponse])
async def list_checkpoints(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    checkpoints = await task_service.list_checkpoints(db, task_id, current_user.id)
    return [TaskCheckpointResponse.from_orm(cp) for cp in checkpoints]


@router.get("/tasks/{task_id}/attachments", response_model=list[TaskAttachmentResponse])
async def list_attachments(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    attachments = await task_service.list_attachments(db, task_id, current_user.id)
    return [TaskAttachmentResponse.from_orm(a) for a in attachments]


@router.delete("/tasks/{task_id}/attachments/{attachment_id}", status_code=204)
async def delete_attachment(
    task_id: uuid.UUID,
    attachment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await task_service.delete_attachment(db, task_id, attachment_id, current_user.id)


@router.post("/tasks/{task_id}/attachments", response_model=TaskAttachmentResponse, status_code=201)
async def upload_attachment(
    task_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    att = await task_service.create_attachment(db, task_id, current_user.id, file)
    return TaskAttachmentResponse.from_orm(att)
