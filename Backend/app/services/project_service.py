import uuid
from pathlib import Path
from typing import Any

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.models.chat import ChatSession
from app.models.project import Project, ProjectAttachment, ProjectProfile
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

settings = get_settings()

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "text/plain",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
STACK_CATEGORY_FIELDS = (
    "frontend_stack",
    "backend_stack",
    "infra_stack",
    "database_stack",
    "other_stack",
)
STACK_CATALOG_BY_CATEGORY: dict[str, tuple[str, ...]] = {
    "frontend_stack": (
        "react",
        "vite",
        "next.js",
        "angular",
        "vue",
        "nuxt",
        "react native",
        "expo",
        "tailwind css",
        "material ui",
    ),
    "backend_stack": (
        "node.js",
        "express",
        "nestjs",
        "fastapi",
        "django",
        "spring boot",
        ".net",
        "go",
        "laravel",
        "ruby on rails",
    ),
    "infra_stack": (
        "aws",
        "azure",
        "gcp",
        "docker",
        "kubernetes",
        "terraform",
        "github actions",
        "nginx",
        "cloudflare",
    ),
    "database_stack": (
        "postgresql",
        "mysql",
        "sql server",
        "mongodb",
        "redis",
        "elasticsearch",
    ),
}
STACK_LABEL_LOOKUP: dict[str, str] = {
    "react": "React",
    "vite": "Vite",
    "next.js": "Next.js",
    "angular": "Angular",
    "vue": "Vue",
    "nuxt": "Nuxt",
    "react native": "React Native",
    "expo": "Expo",
    "tailwind css": "Tailwind CSS",
    "material ui": "Material UI",
    "node.js": "Node.js",
    "express": "Express",
    "nestjs": "NestJS",
    "fastapi": "FastAPI",
    "django": "Django",
    "spring boot": "Spring Boot",
    ".net": ".NET",
    "go": "Go",
    "laravel": "Laravel",
    "ruby on rails": "Ruby on Rails",
    "aws": "AWS",
    "azure": "Azure",
    "gcp": "GCP",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "terraform": "Terraform",
    "github actions": "GitHub Actions",
    "nginx": "Nginx",
    "cloudflare": "Cloudflare",
    "postgresql": "PostgreSQL",
    "mysql": "MySQL",
    "sql server": "SQL Server",
    "mongodb": "MongoDB",
    "redis": "Redis",
    "elasticsearch": "Elasticsearch",
}
STACK_CATEGORY_LOOKUP = {
    label: category
    for category, labels in STACK_CATALOG_BY_CATEGORY.items()
    for label in labels
}


def _normalize_stack_list(values: list[str] | None) -> list[str]:
    normalized: list[str] = []
    seen: set[str] = set()
    for value in values or []:
        trimmed = value.strip()
        if not trimmed:
            continue
        key = trimmed.lower()
        if key in seen:
            continue
        seen.add(key)
        normalized.append(STACK_LABEL_LOOKUP.get(key, trimmed))
    return normalized


def _categorize_stack(values: list[str] | None) -> dict[str, list[str]]:
    categorized = {field: [] for field in STACK_CATEGORY_FIELDS}
    for value in _normalize_stack_list(values):
        key = value.lower()
        category = STACK_CATEGORY_LOOKUP.get(key, "other_stack")
        categorized[category].append(value)
    return categorized


def _combine_stack_categories(values_by_category: dict[str, list[str]]) -> list[str]:
    combined: list[str] = []
    for field in STACK_CATEGORY_FIELDS:
        combined.extend(values_by_category.get(field, []))
    return _normalize_stack_list(combined)


def _normalize_profile_payload(payload: dict[str, Any], existing_profile: ProjectProfile | None = None) -> dict[str, Any]:
    normalized = dict(payload)
    has_categorized_stack_update = any(field in normalized for field in STACK_CATEGORY_FIELDS)

    if "main_stack" in normalized and not has_categorized_stack_update:
        derived = _categorize_stack(normalized.get("main_stack"))
        normalized.update(derived)
        normalized["main_stack"] = _combine_stack_categories(derived)
        return normalized

    if has_categorized_stack_update:
        categorized_values: dict[str, list[str]] = {}
        for field in STACK_CATEGORY_FIELDS:
            if field in normalized:
                categorized_values[field] = _normalize_stack_list(normalized.get(field))
            elif existing_profile is not None:
                categorized_values[field] = _normalize_stack_list(getattr(existing_profile, field, []))
        normalized.update(categorized_values)
        normalized["main_stack"] = _combine_stack_categories(categorized_values)

    return normalized


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

    profile_kwargs = (
        _normalize_profile_payload(data.profile.model_dump(exclude_none=True, exclude_defaults=True))
        if data.profile
        else {}
    )
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
        profile_payload = _normalize_profile_payload(
            data.model_dump(exclude_unset=True),
            project.profile,
        )
        for field, value in profile_payload.items():
            setattr(project.profile, field, value)
        db.add(project.profile)
    else:
        profile_payload = _normalize_profile_payload(data.model_dump(exclude_unset=True))
        profile = ProjectProfile(
            id=uuid.uuid4(),
            project_id=project.id,
            **profile_payload,
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


async def list_attachments(
    db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID
) -> list[ProjectAttachment]:
    await verify_project_access(db, project_id, user_id)
    result = await db.execute(
        select(ProjectAttachment)
        .where(ProjectAttachment.project_id == project_id)
        .order_by(ProjectAttachment.created_at.desc())
    )
    return list(result.scalars().all())


async def create_attachment(
    db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID, file: UploadFile
) -> ProjectAttachment:
    await verify_project_access(db, project_id, user_id)

    mime = file.content_type or ""
    if mime not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Tipo de arquivo não permitido: {mime}. Use PDF, TXT ou imagem.",
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

    if mime == "application/pdf":
        file_type = "pdf"
    elif mime == "text/plain":
        file_type = "text"
    else:
        file_type = "image"
    file_url = f"/files/{unique_name}"

    att = ProjectAttachment(
        id=uuid.uuid4(),
        project_id=project_id,
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


async def delete_attachment(
    db: AsyncSession, project_id: uuid.UUID, attachment_id: uuid.UUID, user_id: uuid.UUID
) -> None:
    await verify_project_access(db, project_id, user_id)
    result = await db.execute(
        select(ProjectAttachment).where(
            ProjectAttachment.id == attachment_id,
            ProjectAttachment.project_id == project_id,
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
