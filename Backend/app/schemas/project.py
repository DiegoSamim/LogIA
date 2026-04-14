from __future__ import annotations

from pydantic import BaseModel, Field


class ProjectProfileCreate(BaseModel):
    summary: str | None = None
    goal: str | None = None
    scope: str | None = None
    main_stack: list[str] = []
    architecture_summary: str | None = None
    product_context: str | None = None
    business_rules: str | None = None
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
    architecture_summary: str | None
    product_context: str | None
    business_rules: str | None
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
            main_stack=profile.main_stack or [],
            architecture_summary=profile.architecture_summary,
            product_context=profile.product_context,
            business_rules=profile.business_rules,
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

    @classmethod
    def from_orm(
        cls,
        project,
        *,
        task_count: int = 0,
        done_count: int = 0,
        last_session_at=None,
    ) -> "ProjectResponse":
        profile = project.profile
        return cls(
            id=str(project.id),
            name=project.name,
            description=project.description,
            status=project.status,
            color=project.color,
            repository_url=project.repository_url,
            stack=profile.main_stack if profile else [],
            task_count=task_count,
            done_count=done_count,
            last_session_at=last_session_at.isoformat() if last_session_at else None,
            created_at=project.created_at.isoformat(),
        )


class ProjectMemberSimpleResponse(BaseModel):
    id: str
    user_id: str
    project_id: str
    role: str
    created_at: str

    @classmethod
    def from_orm(cls, member) -> "ProjectMemberSimpleResponse":
        return cls(
            id=str(member.id),
            user_id=str(member.user_id),
            project_id=str(member.project_id),
            role=member.role,
            created_at=member.created_at.isoformat(),
        )


class ProjectDetailResponse(ProjectResponse):
    profile: ProjectProfileResponse | None
    members: list[ProjectMemberSimpleResponse]

    @classmethod
    def from_orm(cls, project) -> "ProjectDetailResponse":  # type: ignore[override]
        base = ProjectResponse.from_orm(project)
        members = getattr(project, "members", []) or []
        return cls(
            **base.model_dump(),
            profile=ProjectProfileResponse.from_orm(project.profile) if project.profile else None,
            members=[ProjectMemberSimpleResponse.from_orm(m) for m in members],
        )
