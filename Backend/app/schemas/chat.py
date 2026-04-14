from pydantic import BaseModel


class ChatSessionCreate(BaseModel):
    mode: str
    title: str | None = None


class ChatSessionUpdate(BaseModel):
    title: str | None = None
    status: str | None = None


class ChatSessionResponse(BaseModel):
    id: str
    user_id: str
    project_id: str
    mode: str
    title: str | None
    status: str
    started_at: str
    ended_at: str | None
    created_at: str
    updated_at: str

    @classmethod
    def from_orm(cls, session) -> "ChatSessionResponse":
        return cls(
            id=str(session.id),
            user_id=str(session.user_id),
            project_id=str(session.project_id),
            mode=session.mode,
            title=session.title,
            status=session.status,
            started_at=session.started_at.isoformat(),
            ended_at=session.ended_at.isoformat() if session.ended_at else None,
            created_at=session.created_at.isoformat(),
            updated_at=session.updated_at.isoformat(),
        )


class ChatMessageCreate(BaseModel):
    sender: str
    message_type: str = "text"
    content: str
    metadata: dict | None = None


class ChatMessageResponse(BaseModel):
    id: str
    session_id: str
    sender: str
    message_type: str
    content: str
    metadata: dict | None
    created_at: str

    @classmethod
    def from_orm(cls, msg) -> "ChatMessageResponse":
        return cls(
            id=str(msg.id),
            session_id=str(msg.session_id),
            sender=msg.sender,
            message_type=msg.message_type,
            content=msg.content,
            metadata=msg.msg_metadata,
            created_at=msg.created_at.isoformat(),
        )
