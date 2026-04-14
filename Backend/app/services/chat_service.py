import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat import ChatMessage, ChatSession
from app.models.project import Project
from app.schemas.chat import ChatMessageCreate, ChatSessionCreate, ChatSessionUpdate


async def _verify_project_ownership(db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID) -> None:
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projeto não encontrado.")


async def _verify_session_ownership(
    db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID
) -> ChatSession:
    result = await db.execute(
        select(ChatSession).where(
            ChatSession.id == session_id, ChatSession.user_id == user_id
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sessão não encontrada.")
    return session


async def create_session(
    db: AsyncSession, user_id: uuid.UUID, project_id: uuid.UUID, data: ChatSessionCreate
) -> ChatSession:
    await _verify_project_ownership(db, project_id, user_id)
    session = ChatSession(
        id=uuid.uuid4(),
        user_id=user_id,
        project_id=project_id,
        mode=data.mode,
        title=data.title,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def list_sessions(
    db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID
) -> list[ChatSession]:
    await _verify_project_ownership(db, project_id, user_id)
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.project_id == project_id, ChatSession.user_id == user_id)
        .order_by(ChatSession.created_at.desc())
    )
    return list(result.scalars().all())


async def get_session(
    db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID
) -> ChatSession:
    return await _verify_session_ownership(db, session_id, user_id)


async def update_session(
    db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID, data: ChatSessionUpdate
) -> ChatSession:
    session = await _verify_session_ownership(db, session_id, user_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(session, field, value)
    await db.commit()
    await db.refresh(session)
    return session


async def finish_session(
    db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID
) -> ChatSession:
    session = await _verify_session_ownership(db, session_id, user_id)
    session.status = "finished"
    session.ended_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(session)
    return session


async def add_message(
    db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID, data: ChatMessageCreate
) -> ChatMessage:
    await _verify_session_ownership(db, session_id, user_id)
    msg = ChatMessage(
        id=uuid.uuid4(),
        session_id=session_id,
        sender=data.sender,
        message_type=data.message_type,
        content=data.content,
        msg_metadata=data.metadata,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg


async def list_messages(
    db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID
) -> list[ChatMessage]:
    await _verify_session_ownership(db, session_id, user_id)
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
    )
    return list(result.scalars().all())
