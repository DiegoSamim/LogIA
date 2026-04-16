import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.models.project import Project
from app.models.task import ProjectMember, Task, TaskAttachment, TaskCheckpoint, TaskUpdate
from app.services import project_service
from app.schemas.task import TaskCheckpointBatchCreate, TaskCheckpointCreate, TaskCheckpointPatch, TaskCreate, TaskPatch, TaskUpdateCreate

settings = get_settings()

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


def _compose_task_update_details(
    *,
    what_was_done: str | None = None,
    technical_approach: str | None = None,
    next_steps: str | None = None,
    blocked_reason: str | None = None,
) -> str | None:
    parts: list[str] = []
    if what_was_done:
        parts.append(f"Resumo da tarefa: {what_was_done}")
    if technical_approach:
        parts.append(f"Abordagem técnica: {technical_approach}")
    if next_steps:
        parts.append(f"Próximos passos: {next_steps}")
    if blocked_reason:
        parts.append(f"Motivo do bloqueio: {blocked_reason}")
    return "\n\n".join(parts) if parts else None


def _build_initial_update(task: Task, data: TaskCreate, user_id: uuid.UUID) -> TaskUpdate:
    summary = f'Tarefa "{task.title}" criada.'
    details = _compose_task_update_details(
        what_was_done=data.what_was_done,
        technical_approach=data.technical_approach,
        next_steps=data.next_steps,
        blocked_reason=data.blocked_reason,
    )
    return TaskUpdate(
        id=uuid.uuid4(),
        task_id=task.id,
        created_by=user_id,
        update_type="created",
        summary=summary,
        details=details,
        new_status=task.status,
    )


async def _verify_task_ownership(db: AsyncSession, task_id: uuid.UUID, user_id: uuid.UUID) -> Task:
    result = await db.execute(
        select(Task)
        .join(Project, Task.project_id == Project.id)
        .where(
            Task.id == task_id,
            or_(
                Project.user_id == user_id,
                Project.members.any(ProjectMember.user_id == user_id),
            ),
        )
        .options(
            selectinload(Task.checkpoints),
            selectinload(Task.updates),
        )
    )
    task = result.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tarefa não encontrada.")
    return task


async def _verify_project_ownership(db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID) -> None:
    await project_service.verify_project_access(db, project_id, user_id)


async def create(
    db: AsyncSession, user_id: uuid.UUID, project_id: uuid.UUID, data: TaskCreate
) -> Task:
    await _verify_project_ownership(db, project_id, user_id)

    task = Task(
        id=uuid.uuid4(),
        created_by=user_id,
        project_id=project_id,
        title=data.title,
        feature_or_ticket=data.feature_or_ticket,
        what_was_done=data.what_was_done,
        technical_approach=data.technical_approach,
        category=data.category,
        status=data.status,
        priority=data.priority,
        blocked_reason=data.blocked_reason,
        next_steps=data.next_steps,
        people_involved=data.people_involved,
        tags=data.tags or [],
    )
    db.add(task)
    await db.flush()

    initial_update = _build_initial_update(task, data, user_id)
    db.add(initial_update)

    await db.commit()
    return await _fetch(db, task.id)


async def list_by_project(
    db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID
) -> list[Task]:
    await _verify_project_ownership(db, project_id, user_id)
    result = await db.execute(
        select(Task)
        .where(Task.project_id == project_id)
        .options(selectinload(Task.checkpoints))
        .order_by(Task.created_at.desc())
    )
    return list(result.scalars().all())


async def get(db: AsyncSession, task_id: uuid.UUID, user_id: uuid.UUID) -> Task:
    return await _verify_task_ownership(db, task_id, user_id)


async def update(
    db: AsyncSession, task_id: uuid.UUID, user_id: uuid.UUID, data: TaskPatch
) -> Task:
    task = await _verify_task_ownership(db, task_id, user_id)

    patch = data.model_dump(exclude_none=True)

    for field, value in patch.items():
        setattr(task, field, value)

    await db.commit()
    return await _fetch(db, task.id)


async def delete(db: AsyncSession, task_id: uuid.UUID, user_id: uuid.UUID) -> None:
    task = await _verify_task_ownership(db, task_id, user_id)
    await db.delete(task)
    await db.commit()


async def list_updates(
    db: AsyncSession, task_id: uuid.UUID, user_id: uuid.UUID
) -> list[TaskUpdate]:
    await _verify_task_ownership(db, task_id, user_id)
    result = await db.execute(
        select(TaskUpdate)
        .where(TaskUpdate.task_id == task_id)
        .order_by(TaskUpdate.created_at.asc())
    )
    return list(result.scalars().all())


async def add_update(
    db: AsyncSession, task_id: uuid.UUID, user_id: uuid.UUID, data: TaskUpdateCreate
) -> TaskUpdate:
    await _verify_task_ownership(db, task_id, user_id)
    update_obj = TaskUpdate(
        id=uuid.uuid4(),
        task_id=task_id,
        created_by=user_id,
        update_type=data.update_type,
        summary=data.summary,
        details=data.details,
        old_status=data.old_status,
        new_status=data.new_status,
    )
    db.add(update_obj)
    await db.commit()
    await db.refresh(update_obj)
    return update_obj


async def create_checkpoint(
    db: AsyncSession, task_id: uuid.UUID, user_id: uuid.UUID, data: TaskCheckpointCreate
) -> TaskCheckpoint:
    await _verify_task_ownership(db, task_id, user_id)
    cp = TaskCheckpoint(
        id=uuid.uuid4(),
        task_id=task_id,
        description=data.description,
        order_index=data.order_index,
    )
    db.add(cp)
    await db.commit()
    await db.refresh(cp)
    return cp


async def update_checkpoint(
    db: AsyncSession,
    task_id: uuid.UUID,
    checkpoint_id: uuid.UUID,
    user_id: uuid.UUID,
    data: TaskCheckpointPatch,
) -> TaskCheckpoint:
    await _verify_task_ownership(db, task_id, user_id)
    result = await db.execute(
        select(TaskCheckpoint).where(
            TaskCheckpoint.id == checkpoint_id, TaskCheckpoint.task_id == task_id
        )
    )
    cp = result.scalar_one_or_none()
    if not cp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Checkpoint não encontrado.")
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(cp, field, value)
    await db.commit()
    await db.refresh(cp)
    return cp


async def create_checkpoints_batch(
    db: AsyncSession, task_id: uuid.UUID, user_id: uuid.UUID, data: TaskCheckpointBatchCreate
) -> list[TaskCheckpoint]:
    await _verify_task_ownership(db, task_id, user_id)
    checkpoints = [
        TaskCheckpoint(
            id=uuid.uuid4(),
            task_id=task_id,
            description=item.description,
            order_index=item.order_index,
        )
        for item in data.items
    ]
    db.add_all(checkpoints)
    await db.commit()
    for cp in checkpoints:
        await db.refresh(cp)
    return checkpoints


async def list_checkpoints(
    db: AsyncSession, task_id: uuid.UUID, user_id: uuid.UUID
) -> list[TaskCheckpoint]:
    await _verify_task_ownership(db, task_id, user_id)
    result = await db.execute(
        select(TaskCheckpoint)
        .where(TaskCheckpoint.task_id == task_id)
        .order_by(TaskCheckpoint.order_index.asc())
    )
    return list(result.scalars().all())


async def list_attachments(
    db: AsyncSession, task_id: uuid.UUID, user_id: uuid.UUID
) -> list[TaskAttachment]:
    await _verify_task_ownership(db, task_id, user_id)
    result = await db.execute(
        select(TaskAttachment)
        .where(TaskAttachment.task_id == task_id)
        .order_by(TaskAttachment.created_at.desc())
    )
    return list(result.scalars().all())


async def delete_attachment(
    db: AsyncSession, task_id: uuid.UUID, attachment_id: uuid.UUID, user_id: uuid.UUID
) -> None:
    await _verify_task_ownership(db, task_id, user_id)
    result = await db.execute(
        select(TaskAttachment).where(
            TaskAttachment.id == attachment_id, TaskAttachment.task_id == task_id
        )
    )
    att = result.scalar_one_or_none()
    if not att:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Anexo não encontrado.")

    file_path = Path(settings.UPLOAD_DIR) / Path(att.file_url).name
    if file_path.exists():
        file_path.unlink()

    await db.delete(att)
    await db.commit()


async def create_attachment(
    db: AsyncSession, task_id: uuid.UUID, user_id: uuid.UUID, file: UploadFile
) -> TaskAttachment:
    await _verify_task_ownership(db, task_id, user_id)

    mime = file.content_type or ""
    if mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Tipo de arquivo não permitido: {mime}. Use PDF ou imagem.",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Arquivo excede o tamanho máximo permitido de 10 MB.",
        )

    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    file_ext = Path(file.filename or "file").suffix
    unique_name = f"{uuid.uuid4()}{file_ext}"
    dest = upload_dir / unique_name
    dest.write_bytes(content)

    file_type = "pdf" if mime == "application/pdf" else "image"
    file_url = f"/files/{unique_name}"

    att = TaskAttachment(
        id=uuid.uuid4(),
        task_id=task_id,
        uploaded_by=user_id,
        file_name=file.filename or unique_name,
        file_url=file_url,
        file_type=file_type,
        mime_type=mime,
        file_size=len(content),
    )
    db.add(att)
    await db.commit()
    await db.refresh(att)
    return att


async def _fetch(db: AsyncSession, task_id: uuid.UUID) -> Task:
    result = await db.execute(
        select(Task)
        .where(Task.id == task_id)
        .options(
            selectinload(Task.checkpoints),
            selectinload(Task.updates),
        )
    )
    return result.scalar_one()
