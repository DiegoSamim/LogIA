import uuid
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.chat import ChatSession
from app.models.project import Project, ProjectProfile
from app.models.task import Task
from app.schemas.project import ProjectCreate, ProjectProfileUpdate, ProjectUpdate


async def create(db: AsyncSession, user_id: uuid.UUID, data: ProjectCreate) -> Project:
    project = Project(
        id=uuid.uuid4(),
        user_id=user_id,
        name=data.name,
        description=data.description,
        repository_url=data.repository_url,
        color=data.color or "#6366F1",
        status=data.status,
    )
    db.add(project)
    await db.flush()

    profile_kwargs = data.profile.model_dump() if data.profile else {}
    profile = ProjectProfile(id=uuid.uuid4(), project_id=project.id, **profile_kwargs)
    db.add(profile)

    await db.commit()
    return await _fetch(db, project.id)


async def list_by_user(db: AsyncSession, user_id: uuid.UUID) -> list[dict[str, Any]]:
    task_count_sq = (
        select(func.count(Task.id))
        .where(Task.project_id == Project.id)
        .correlate(Project)
        .scalar_subquery()
    )
    done_count_sq = (
        select(func.count(Task.id))
        .where(Task.project_id == Project.id, Task.status == "done")
        .correlate(Project)
        .scalar_subquery()
    )
    last_session_sq = (
        select(func.max(ChatSession.started_at))
        .where(ChatSession.project_id == Project.id)
        .correlate(Project)
        .scalar_subquery()
    )

    result = await db.execute(
        select(
            Project,
            task_count_sq.label("task_count"),
            done_count_sq.label("done_count"),
            last_session_sq.label("last_session_at"),
        )
        .where(Project.user_id == user_id)
        .options(selectinload(Project.profile))
        .order_by(Project.created_at.desc())
    )
    rows = result.all()
    return [
        {"project": p, "task_count": tc or 0, "done_count": dc or 0, "last_session_at": ls}
        for p, tc, dc, ls in rows
    ]


async def get_detail(db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID) -> Project:
    result = await db.execute(
        select(Project)
        .where(Project.id == project_id, Project.user_id == user_id)
        .options(selectinload(Project.profile), selectinload(Project.members))
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projeto não encontrado.")
    return project


async def update(
    db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID, data: ProjectUpdate
) -> Project:
    project = await get_detail(db, project_id, user_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(project, field, value)
    await db.commit()
    return await _fetch(db, project.id)


async def update_profile(
    db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID, data: ProjectProfileUpdate
) -> Project:
    project = await get_detail(db, project_id, user_id)

    if project.profile:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(project.profile, field, value)
        db.add(project.profile)
    else:
        profile = ProjectProfile(
            id=uuid.uuid4(),
            project_id=project.id,
            **data.model_dump(),
        )
        db.add(profile)

    await db.commit()
    return await _fetch(db, project.id)


async def delete(db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID) -> None:
    project = await get_detail(db, project_id, user_id)
    await db.delete(project)
    await db.commit()


async def _fetch(db: AsyncSession, project_id: uuid.UUID) -> Project:
    result = await db.execute(
        select(Project)
        .where(Project.id == project_id)
        .options(selectinload(Project.profile), selectinload(Project.members))
    )
    return result.scalar_one()
