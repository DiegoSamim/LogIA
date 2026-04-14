from pydantic import BaseModel, Field


class ProjectMemberResponse(BaseModel):
    id: str
    user_id: str
    project_id: str
    role: str
    created_at: str

    @classmethod
    def from_orm(cls, member) -> "ProjectMemberResponse":
        return cls(
            id=str(member.id),
            user_id=str(member.user_id),
            project_id=str(member.project_id),
            role=member.role,
            created_at=member.created_at.isoformat(),
        )


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    feature_or_ticket: str | None = None
    what_was_done: str | None = None
    technical_approach: str | None = None
    category: str = "feature"
    status: str = "todo"
    priority: str | None = None
    blocked_reason: str | None = None
    next_steps: str | None = None
    people_involved: str | None = None
    tags: list[str] = []
    started_at: str | None = None
    completed_at: str | None = None


class TaskPatch(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=500)
    feature_or_ticket: str | None = None
    what_was_done: str | None = None
    technical_approach: str | None = None
    category: str | None = None
    status: str | None = None
    priority: str | None = None
    blocked_reason: str | None = None
    next_steps: str | None = None
    people_involved: str | None = None
    tags: list[str] | None = None
    started_at: str | None = None
    completed_at: str | None = None


class TaskResponse(BaseModel):
    id: str
    project_id: str
    created_by: str
    title: str
    feature_or_ticket: str | None
    what_was_done: str | None
    technical_approach: str | None
    category: str
    status: str
    priority: str | None
    blocked_reason: str | None
    next_steps: str | None
    people_involved: str | None
    tags: list[str]
    started_at: str | None
    completed_at: str | None
    created_at: str
    updated_at: str

    @classmethod
    def from_orm(cls, task) -> "TaskResponse":
        return cls(
            id=str(task.id),
            project_id=str(task.project_id),
            created_by=str(task.created_by),
            title=task.title,
            feature_or_ticket=task.feature_or_ticket,
            what_was_done=task.what_was_done,
            technical_approach=task.technical_approach,
            category=task.category,
            status=task.status,
            priority=task.priority,
            blocked_reason=task.blocked_reason,
            next_steps=task.next_steps,
            people_involved=task.people_involved,
            tags=task.tags or [],
            started_at=task.started_at.isoformat() if task.started_at else None,
            completed_at=task.completed_at.isoformat() if task.completed_at else None,
            created_at=task.created_at.isoformat(),
            updated_at=task.updated_at.isoformat(),
        )


class TaskUpdateCreate(BaseModel):
    update_type: str
    summary: str | None = None
    details: str | None = None
    old_status: str | None = None
    new_status: str | None = None


class TaskUpdateResponse(BaseModel):
    id: str
    task_id: str
    created_by: str
    update_type: str
    summary: str | None
    details: str | None
    old_status: str | None
    new_status: str | None
    created_at: str

    @classmethod
    def from_orm(cls, update) -> "TaskUpdateResponse":
        return cls(
            id=str(update.id),
            task_id=str(update.task_id),
            created_by=str(update.created_by),
            update_type=update.update_type,
            summary=update.summary,
            details=update.details,
            old_status=update.old_status,
            new_status=update.new_status,
            created_at=update.created_at.isoformat(),
        )


class TaskCheckpointCreate(BaseModel):
    description: str = Field(min_length=1)
    order_index: int = 0


class TaskCheckpointPatch(BaseModel):
    description: str | None = None
    is_done: bool | None = None
    order_index: int | None = None


class TaskCheckpointResponse(BaseModel):
    id: str
    task_id: str
    description: str
    is_done: bool
    order_index: int
    created_at: str
    updated_at: str

    @classmethod
    def from_orm(cls, cp) -> "TaskCheckpointResponse":
        return cls(
            id=str(cp.id),
            task_id=str(cp.task_id),
            description=cp.description,
            is_done=cp.is_done,
            order_index=cp.order_index,
            created_at=cp.created_at.isoformat(),
            updated_at=cp.updated_at.isoformat(),
        )
