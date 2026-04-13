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
    def from_orm(cls, project) -> "ProjectResponse":
        profile = project.profile
        return cls(
            id=str(project.id),
            name=project.name,
            description=project.description,
            status=project.status,
            color=project.color,
            repository_url=project.repository_url,
            stack=profile.main_stack if profile else [],
            task_count=0,
            done_count=0,
            last_session_at=None,
            created_at=project.created_at.isoformat(),
        )


class ProjectDetailResponse(ProjectResponse):
    profile: ProjectProfileResponse | None

    @classmethod
    def from_orm(cls, project) -> "ProjectDetailResponse":  # type: ignore[override]
        base = ProjectResponse.from_orm(project)
        return cls(
            **base.model_dump(),
            profile=ProjectProfileResponse.from_orm(project.profile) if project.profile else None,
        )
