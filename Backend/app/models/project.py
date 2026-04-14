import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
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
    architecture_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    product_context: Mapped[str | None] = mapped_column(Text, nullable=True)
    business_rules: Mapped[str | None] = mapped_column(Text, nullable=True)
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
