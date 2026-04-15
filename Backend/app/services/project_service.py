import uuid
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.chat import ChatSession
from app.models.project import Project, ProjectProfile
from app.models.task import ProjectMember, Task
from app.models.user import User
from app.schemas.project import (
    ProjectCreate,
    ProjectMemberCreate,
    ProjectMemberRole,
    ProjectMemberUpdate,
    ProjectProfileUpdate,
    ProjectUpdate,
)


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

    creator_member = ProjectMember(
        id=uuid.uuid4(),
        user_id=user_id,
        project_id=project.id,
        role="admin",
    )
    db.add(creator_member)

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
        .where(
            or_(
                Project.user_id == user_id,
                Project.members.any(ProjectMember.user_id == user_id),
            )
        )
        .options(selectinload(Project.profile))
        .order_by(Project.created_at.desc())
    )
    rows = result.all()
    return [
        {"project": p, "task_count": tc or 0, "done_count": dc or 0, "last_session_at": ls}
        for p, tc, dc, ls in rows
    ]


async def get_detail(db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID) -> Project:
    return await verify_project_access(db, project_id, user_id)


async def update(
    db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID, data: ProjectUpdate
) -> Project:
    project = await verify_project_owner(db, project_id, user_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(project, field, value)
    await db.commit()
    return await _fetch(db, project.id)


async def update_profile(
    db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID, data: ProjectProfileUpdate
) -> Project:
    project = await verify_project_owner(db, project_id, user_id)

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
    project = await verify_project_owner(db, project_id, user_id)
    await db.delete(project)
    await db.commit()


async def verify_project_access(
    db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID
) -> Project:
    result = await db.execute(
        select(Project)
        .where(
            Project.id == project_id,
            or_(
                Project.user_id == user_id,
                Project.members.any(ProjectMember.user_id == user_id),
            ),
        )
        .options(
            selectinload(Project.profile),
            selectinload(Project.members).selectinload(ProjectMember.user),
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projeto não encontrado.")
    return project


async def verify_project_owner(
    db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID
) -> Project:
    result = await db.execute(
        select(Project)
        .where(Project.id == project_id, Project.user_id == user_id)
        .options(
            selectinload(Project.profile),
            selectinload(Project.members).selectinload(ProjectMember.user),
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projeto não encontrado.")
    return project


async def verify_project_admin(
    db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID
) -> Project:
    project = await verify_project_access(db, project_id, user_id)
    membership = next((member for member in project.members if member.user_id == user_id), None)
    if not membership or membership.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Somente admins podem gerenciar membros deste projeto.",
        )
    return project


async def search_user_by_email(
    db: AsyncSession,
    email: str,
) -> User | None:
    normalized = email.strip().lower()
    if not normalized:
        return None
    result = await db.execute(
        select(User).where(func.lower(User.email).like(f"{normalized}%")).order_by(User.email.asc())
    )
    return result.scalars().first()


async def add_member(
    db: AsyncSession,
    project_id: uuid.UUID,
    current_user_id: uuid.UUID,
    data: ProjectMemberCreate,
) -> ProjectMember:
    project = await verify_project_admin(db, project_id, current_user_id)
    user = await search_user_by_email(db, data.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário não encontrado.")

    if any(member.user_id == user.id for member in project.members):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Usuário já faz parte do projeto.")

    member = ProjectMember(
        id=uuid.uuid4(),
        user_id=user.id,
        project_id=project.id,
        role=data.role,
    )
    db.add(member)
    await db.commit()
    result = await db.execute(
        select(ProjectMember)
        .where(ProjectMember.id == member.id)
        .options(selectinload(ProjectMember.user))
    )
    return result.scalar_one()


async def update_member(
    db: AsyncSession,
    project_id: uuid.UUID,
    member_id: uuid.UUID,
    current_user_id: uuid.UUID,
    data: ProjectMemberUpdate,
) -> ProjectMember:
    project = await verify_project_admin(db, project_id, current_user_id)
    member = next((item for item in project.members if item.id == member_id), None)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membro não encontrado.")

    if member.user_id == current_user_id and data.role != "admin":
        admin_count = sum(1 for item in project.members if item.role == "admin")
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Não é possível remover o último admin do projeto.",
            )

    member.role = data.role
    await db.commit()
    result = await db.execute(
        select(ProjectMember)
        .where(ProjectMember.id == member.id)
        .options(selectinload(ProjectMember.user))
    )
    return result.scalar_one()


async def remove_member(
    db: AsyncSession,
    project_id: uuid.UUID,
    member_id: uuid.UUID,
    current_user_id: uuid.UUID,
) -> None:
    project = await verify_project_admin(db, project_id, current_user_id)
    member = next((item for item in project.members if item.id == member_id), None)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Membro não encontrado.")

    if member.role == "admin":
        admin_count = sum(1 for item in project.members if item.role == "admin")
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Não é possível remover o último admin do projeto.",
            )

    await db.delete(member)
    await db.commit()


async def _fetch(db: AsyncSession, project_id: uuid.UUID) -> Project:
    result = await db.execute(
        select(Project)
        .where(Project.id == project_id)
        .options(
            selectinload(Project.profile),
            selectinload(Project.members).selectinload(ProjectMember.user),
        )
    )
    return result.scalar_one()
