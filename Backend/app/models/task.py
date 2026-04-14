import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class ProjectMember(Base):
    __tablename__ = "project_members"
    __table_args__ = (UniqueConstraint("user_id", "project_id"),)

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    role: Mapped[str] = mapped_column(String(50), default="member")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped["User"] = relationship(back_populates="project_members")  # type: ignore[name-defined]
    project: Mapped["Project"] = relationship(back_populates="members")  # type: ignore[name-defined]


class Task(Base, TimestampMixin):
    __tablename__ = "tasks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str] = mapped_column(String(500))
    feature_or_ticket: Mapped[str | None] = mapped_column(Text, nullable=True)
    what_was_done: Mapped[str | None] = mapped_column(Text, nullable=True)
    technical_approach: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(50), default="feature")
    status: Mapped[str] = mapped_column(String(30), default="todo")
    priority: Mapped[str | None] = mapped_column(String(30), nullable=True)
    blocked_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    next_steps: Mapped[str | None] = mapped_column(Text, nullable=True)
    people_involved: Mapped[str | None] = mapped_column(Text, nullable=True)
    tags: Mapped[list[str]] = mapped_column(ARRAY(Text), server_default="{}", default=list)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    creator: Mapped["User"] = relationship(  # type: ignore[name-defined]
        foreign_keys=[created_by], back_populates="tasks"
    )
    project: Mapped["Project"] = relationship(back_populates="tasks")  # type: ignore[name-defined]
    updates: Mapped[list["TaskUpdate"]] = relationship(
        back_populates="task", cascade="all, delete-orphan"
    )
    checkpoints: Mapped[list["TaskCheckpoint"]] = relationship(
        back_populates="task",
        cascade="all, delete-orphan",
        order_by="TaskCheckpoint.order_index",
    )
    attachments: Mapped[list["TaskAttachment"]] = relationship(
        back_populates="task", cascade="all, delete-orphan"
    )
    knowledge_chunks: Mapped[list["KnowledgeChunk"]] = relationship(  # type: ignore[name-defined]
        back_populates="task", cascade="all, delete-orphan"
    )


class TaskUpdate(Base):
    __tablename__ = "task_updates"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), index=True
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    update_type: Mapped[str] = mapped_column(String(50))
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    old_status: Mapped[str | None] = mapped_column(String(30), nullable=True)
    new_status: Mapped[str | None] = mapped_column(String(30), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    task: Mapped["Task"] = relationship(back_populates="updates")
    creator: Mapped["User"] = relationship(  # type: ignore[name-defined]
        foreign_keys=[created_by], back_populates="task_updates"
    )
    knowledge_chunks: Mapped[list["KnowledgeChunk"]] = relationship(  # type: ignore[name-defined]
        back_populates="task_update", cascade="all, delete-orphan"
    )


class TaskCheckpoint(Base, TimestampMixin):
    __tablename__ = "task_checkpoints"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), index=True
    )
    description: Mapped[str] = mapped_column(Text)
    is_done: Mapped[bool] = mapped_column(Boolean, default=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0)

    task: Mapped["Task"] = relationship(back_populates="checkpoints")


class TaskAttachment(Base):
    __tablename__ = "task_attachments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), index=True
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

    task: Mapped["Task"] = relationship(back_populates="attachments")
    uploader: Mapped["User"] = relationship(  # type: ignore[name-defined]
        foreign_keys=[uploaded_by], back_populates="task_attachments"
    )
