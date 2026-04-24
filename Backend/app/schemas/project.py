from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.user import UserResponse

ProjectMemberRole = Literal["admin", "editor", "viewer"]
STACK_CATEGORY_FIELDS = (
    "frontend_stack",
    "backend_stack",
    "infra_stack",
    "database_stack",
    "other_stack",
)


def _normalize_stack_values(values: list[str] | None) -> list[str]:
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
        normalized.append(trimmed)
    return normalized


def combine_profile_stack(profile) -> list[str]:
    categorized: list[str] = []
    for field in STACK_CATEGORY_FIELDS:
        categorized.extend(_normalize_stack_values(getattr(profile, field, [])))

    if categorized:
        return _normalize_stack_values(categorized)
    return _normalize_stack_values(getattr(profile, "main_stack", []))


def derive_architecture_summary(profile) -> str | None:
    sections = [
        ("Frontend", profile.architecture_frontend),
        ("Backend", profile.architecture_backend),
        ("Integrações", profile.architecture_integrations),
        ("Dados", profile.architecture_data),
        ("Infraestrutura", profile.architecture_infra),
    ]
    parts = [f"{label}: {value.strip()}" for label, value in sections if value and value.strip()]
    if parts:
        return "\n\n".join(parts)
    return profile.architecture_summary


def derive_business_rules(profile) -> str | None:
    sections = [
        ("Regras principais", profile.business_rules_core),
        ("Permissões e papéis", profile.business_rules_permissions),
        ("Validações", profile.business_rules_validations),
        ("Restrições e exceções", profile.business_rules_constraints),
    ]
    parts = [f"{label}: {value.strip()}" for label, value in sections if value and value.strip()]
    if parts:
        return "\n\n".join(parts)
    return profile.business_rules


class ProjectProfileCreate(BaseModel):
    summary: str | None = None
    goal: str | None = None
    scope: str | None = None
    main_stack: list[str] = []
    frontend_stack: list[str] = []
    backend_stack: list[str] = []
    infra_stack: list[str] = []
    database_stack: list[str] = []
    other_stack: list[str] = []
    architecture_summary: str | None = None
    architecture_frontend: str | None = None
    architecture_backend: str | None = None
    architecture_integrations: str | None = None
    architecture_data: str | None = None
    architecture_infra: str | None = None
    product_context: str | None = None
    business_rules: str | None = None
    business_rules_core: str | None = None
    business_rules_permissions: str | None = None
    business_rules_validations: str | None = None
    business_rules_constraints: str | None = None
    team_context: str | None = None
    default_language: str | None = None
    documentation_url: str | None = None
    figma_url: str | None = None
    board_url: str | None = None
    api_base_url: str | None = None
    deployment_url: str | None = None


class ProjectProfileUpdate(ProjectProfileCreate):
    pass


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    repository_url: str | None = None
    color: str | None = "#6366F1"
    status: str = "active"
    profile: ProjectProfileCreate | None = None


class ProjectUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    repository_url: str | None = None
    color: str | None = None
    status: str | None = None


class ProjectProfileResponse(BaseModel):
    id: str
    project_id: str
    summary: str | None
    goal: str | None
    scope: str | None
    main_stack: list[str]
    frontend_stack: list[str]
    backend_stack: list[str]
    infra_stack: list[str]
    database_stack: list[str]
    other_stack: list[str]
    architecture_summary: str | None
    architecture_frontend: str | None
    architecture_backend: str | None
    architecture_integrations: str | None
    architecture_data: str | None
    architecture_infra: str | None
    product_context: str | None
    business_rules: str | None
    business_rules_core: str | None
    business_rules_permissions: str | None
    business_rules_validations: str | None
    business_rules_constraints: str | None
    team_context: str | None
    default_language: str | None
    documentation_url: str | None
    figma_url: str | None
    board_url: str | None
    api_base_url: str | None
    deployment_url: str | None
    created_at: str

    @classmethod
    def from_orm(cls, profile) -> "ProjectProfileResponse":
        return cls(
            id=str(profile.id),
            project_id=str(profile.project_id),
            summary=profile.summary,
            goal=profile.goal,
            scope=profile.scope,
            main_stack=combine_profile_stack(profile),
            frontend_stack=_normalize_stack_values(profile.frontend_stack),
            backend_stack=_normalize_stack_values(profile.backend_stack),
            infra_stack=_normalize_stack_values(profile.infra_stack),
            database_stack=_normalize_stack_values(profile.database_stack),
            other_stack=_normalize_stack_values(profile.other_stack),
            architecture_summary=derive_architecture_summary(profile),
            architecture_frontend=profile.architecture_frontend,
            architecture_backend=profile.architecture_backend,
            architecture_integrations=profile.architecture_integrations,
            architecture_data=profile.architecture_data,
            architecture_infra=profile.architecture_infra,
            product_context=profile.product_context,
            business_rules=derive_business_rules(profile),
            business_rules_core=profile.business_rules_core,
            business_rules_permissions=profile.business_rules_permissions,
            business_rules_validations=profile.business_rules_validations,
            business_rules_constraints=profile.business_rules_constraints,
            team_context=profile.team_context,
            default_language=profile.default_language,
            documentation_url=profile.documentation_url,
            figma_url=profile.figma_url,
            board_url=profile.board_url,
            api_base_url=profile.api_base_url,
            deployment_url=profile.deployment_url,
            created_at=profile.created_at.isoformat(),
        )


class ProjectResponse(BaseModel):
    id: str
    user_id: str
    name: str
    description: str | None
    status: str
    color: str | None
    repository_url: str | None
    stack: list[str]
    task_count: int
    done_count: int
    last_session_at: str | None
    created_at: str
    current_user_role: ProjectMemberRole | None = None

    @classmethod
    def from_orm(
        cls,
        project,
        *,
        current_user_id=None,
        task_count: int = 0,
        done_count: int = 0,
        last_session_at=None,
    ) -> "ProjectResponse":
        profile = project.profile
        current_user_role = None
        if current_user_id:
            member = next(
                (
                    item
                    for item in (getattr(project, "members", []) or [])
                    if item.user_id == current_user_id
                ),
                None,
            )
            current_user_role = member.role if member else None
            if current_user_role is None and project.user_id == current_user_id:
                current_user_role = "admin"
        return cls(
            id=str(project.id),
            user_id=str(project.user_id),
            name=project.name,
            description=project.description,
            status=project.status,
            color=project.color,
            repository_url=project.repository_url,
            stack=combine_profile_stack(profile) if profile else [],
            task_count=task_count,
            done_count=done_count,
            last_session_at=last_session_at.isoformat() if last_session_at else None,
            created_at=project.created_at.isoformat(),
            current_user_role=current_user_role,
        )


class ProjectMemberSimpleResponse(BaseModel):
    id: str
    user_id: str
    project_id: str
    role: ProjectMemberRole
    created_at: str
    user: UserResponse

    @classmethod
    def from_orm(cls, member) -> "ProjectMemberSimpleResponse":
        return cls(
            id=str(member.id),
            user_id=str(member.user_id),
            project_id=str(member.project_id),
            role=member.role,
            created_at=member.created_at.isoformat(),
            user=UserResponse.from_orm(member.user),
        )


class ProjectMemberCreate(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    role: Literal["editor", "viewer"] = "viewer"


class ProjectMemberUpdate(BaseModel):
    role: Literal["editor", "viewer"]


class UserLookupResponse(BaseModel):
    id: str
    name: str
    email: str
    avatar_url: str | None

    @classmethod
    def from_orm(cls, user) -> "UserLookupResponse":
        return cls(
            id=str(user.id),
            name=user.name,
            email=user.email,
            avatar_url=user.avatar_url,
        )


class ProjectDetailResponse(ProjectResponse):
    profile: ProjectProfileResponse | None
    members: list[ProjectMemberSimpleResponse]

    @classmethod
    def from_orm(cls, project, *, current_user_id=None) -> "ProjectDetailResponse":  # type: ignore[override]
        base = ProjectResponse.from_orm(project, current_user_id=current_user_id)
        members = getattr(project, "members", []) or []
        return cls(
            **base.model_dump(),
            profile=ProjectProfileResponse.from_orm(project.profile) if project.profile else None,
            members=[ProjectMemberSimpleResponse.from_orm(m) for m in members],
        )


class ProjectAttachmentResponse(BaseModel):
    id: str
    project_id: str
    uploaded_by: str
    file_name: str
    file_url: str
    file_type: str | None
    mime_type: str | None
    file_size: int | None
    created_at: str

    @classmethod
    def from_orm(cls, att) -> "ProjectAttachmentResponse":
        return cls(
            id=str(att.id),
            project_id=str(att.project_id),
            uploaded_by=str(att.uploaded_by),
            file_name=att.file_name,
            file_url=att.file_url,
            file_type=att.file_type,
            mime_type=att.mime_type,
            file_size=att.file_size,
            created_at=att.created_at.isoformat(),
        )
