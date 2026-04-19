from pydantic import BaseModel


class QueryRunResponse(BaseModel):
    id: str
    session_id: str
    question_message_id: str | None
    response_message_id: str | None
    status: str
    question_key: str
    question_text: str
    error_message: str | None
    result_metadata: dict | None
    started_at: str | None
    completed_at: str | None
    cancelled_at: str | None
    created_at: str
    updated_at: str

    @classmethod
    def from_orm(cls, run) -> "QueryRunResponse":
        return cls(
            id=str(run.id),
            session_id=str(run.session_id),
            question_message_id=str(run.question_message_id) if run.question_message_id else None,
            response_message_id=str(run.response_message_id) if run.response_message_id else None,
            status=run.status,
            question_key=run.question_key,
            question_text=run.question_text,
            error_message=run.error_message,
            result_metadata=run.result_metadata,
            started_at=run.started_at.isoformat() if run.started_at else None,
            completed_at=run.completed_at.isoformat() if run.completed_at else None,
            cancelled_at=run.cancelled_at.isoformat() if run.cancelled_at else None,
            created_at=run.created_at.isoformat(),
            updated_at=run.updated_at.isoformat(),
        )


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
    latest_query_run: QueryRunResponse | None = None

    @classmethod
    def from_orm(cls, session) -> "ChatSessionResponse":
        latest_query_run = None
        runs = getattr(session, "query_runs", None)
        if runs:
            latest_query_run = QueryRunResponse.from_orm(runs[0])

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
            latest_query_run=latest_query_run,
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


class QueryStartRequest(BaseModel):
    session_id: str | None = None
    question_key: str
    question_text: str


class QueryStartResponse(BaseModel):
    session: ChatSessionResponse
    run: QueryRunResponse
    question_message: ChatMessageResponse


class QueryCancelResponse(BaseModel):
    run: QueryRunResponse
    cancellation_message: ChatMessageResponse | None = None
