import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.project import Project
from app.models.task import Task, TaskCheckpoint, TaskUpdate
from app.schemas.task import TaskCheckpointCreate, TaskCheckpointPatch, TaskCreate, TaskPatch, TaskUpdateCreate


async def _verify_task_ownership(db: AsyncSession, task_id: uuid.UUID, user_id: uuid.UUID) -> Task:
    result = await db.execute(
        select(Task)
        .join(Project, Task.project_id == Project.id)
        .where(Task.id == task_id, Project.user_id == user_id)
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
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projeto não encontrado.")


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

    initial_update = TaskUpdate(
        id=uuid.uuid4(),
        task_id=task.id,
        created_by=user_id,
        update_type="created",
        summary=f'Tarefa "{task.title}" criada.',
        new_status=task.status,
    )
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
    old_status = task.status
    new_status = patch.get("status")

    for field, value in patch.items():
        setattr(task, field, value)

    if new_status and new_status != old_status:
        status_update = TaskUpdate(
            id=uuid.uuid4(),
            task_id=task.id,
            created_by=user_id,
            update_type="status_change",
            old_status=old_status,
            new_status=new_status,
        )
        db.add(status_update)

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
