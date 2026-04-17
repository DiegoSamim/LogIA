import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Project(Base, TimestampMixin):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    repository_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    color: Mapped[str | None] = mapped_column(String(30), nullable=True, default="#6366F1")
    status: Mapped[str] = mapped_column(String(30), default="active")

    profile: Mapped["ProjectProfile | None"] = relationship(
        back_populates="project", cascade="all, delete-orphan", uselist=False
    )
    user: Mapped["User"] = relationship(back_populates="projects")  # type: ignore[name-defined]
    members: Mapped[list["ProjectMember"]] = relationship(  # type: ignore[name-defined]
        back_populates="project", cascade="all, delete-orphan"
    )
    tasks: Mapped[list["Task"]] = relationship(  # type: ignore[name-defined]
        back_populates="project", cascade="all, delete-orphan"
    )
    attachments: Mapped[list["ProjectAttachment"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    chat_sessions: Mapped[list["ChatSession"]] = relationship(  # type: ignore[name-defined]
        back_populates="project", cascade="all, delete-orphan"
    )
    knowledge_chunks: Mapped[list["KnowledgeChunk"]] = relationship(  # type: ignore[name-defined]
        back_populates="project", cascade="all, delete-orphan"
    )


class ProjectProfile(Base):
    __tablename__ = "project_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        unique=True,
        index=True,
    )
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    goal: Mapped[str | None] = mapped_column(Text, nullable=True)
    scope: Mapped[str | None] = mapped_column(Text, nullable=True)
    main_stack: Mapped[list[str]] = mapped_column(
        ARRAY(Text), server_default="{}", default=list
    )
    frontend_stack: Mapped[list[str]] = mapped_column(
        ARRAY(Text), server_default="{}", default=list
    )
    backend_stack: Mapped[list[str]] = mapped_column(
        ARRAY(Text), server_default="{}", default=list
    )
    infra_stack: Mapped[list[str]] = mapped_column(
        ARRAY(Text), server_default="{}", default=list
    )
    database_stack: Mapped[list[str]] = mapped_column(
        ARRAY(Text), server_default="{}", default=list
    )
    other_stack: Mapped[list[str]] = mapped_column(
        ARRAY(Text), server_default="{}", default=list
    )
    architecture_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    architecture_frontend: Mapped[str | None] = mapped_column(Text, nullable=True)
    architecture_backend: Mapped[str | None] = mapped_column(Text, nullable=True)
    architecture_integrations: Mapped[str | None] = mapped_column(Text, nullable=True)
    architecture_data: Mapped[str | None] = mapped_column(Text, nullable=True)
    architecture_infra: Mapped[str | None] = mapped_column(Text, nullable=True)
    product_context: Mapped[str | None] = mapped_column(Text, nullable=True)
    business_rules: Mapped[str | None] = mapped_column(Text, nullable=True)
    business_rules_core: Mapped[str | None] = mapped_column(Text, nullable=True)
    business_rules_permissions: Mapped[str | None] = mapped_column(Text, nullable=True)
    business_rules_validations: Mapped[str | None] = mapped_column(Text, nullable=True)
    business_rules_constraints: Mapped[str | None] = mapped_column(Text, nullable=True)
    team_context: Mapped[str | None] = mapped_column(Text, nullable=True)
    default_language: Mapped[str | None] = mapped_column(String(50), nullable=True)
    documentation_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    figma_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    board_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    api_base_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    deployment_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    project: Mapped["Project"] = relationship(back_populates="profile")


class ProjectAttachment(Base):
    __tablename__ = "project_attachments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    file_name: Mapped[str] = mapped_column(Text)
    file_url: Mapped[str] = mapped_column(Text)
    file_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    project: Mapped["Project"] = relationship(back_populates="attachments")
    uploader: Mapped["User"] = relationship(  # type: ignore[name-defined]
        foreign_keys=[uploaded_by], back_populates="project_attachments"
    )
