import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import get_current_user
from app.db.engine import get_db
from app.models.user import User
from app.schemas.chat import (
    ChatMessageCreate,
    ChatMessageResponse,
    QueryCancelResponse,
    QueryRunResponse,
    QueryStartRequest,
    QueryStartResponse,
    ChatSessionCreate,
    ChatSessionResponse,
    ChatSessionUpdate,
)
from app.services import chat_service

router = APIRouter()


@router.post("/projects/{project_id}/sessions", response_model=ChatSessionResponse, status_code=201)
async def create_session(
    project_id: uuid.UUID,
    data: ChatSessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await chat_service.create_session(db, current_user.id, project_id, data)
    return ChatSessionResponse.from_orm(session)


@router.get("/projects/{project_id}/sessions", response_model=list[ChatSessionResponse])
async def list_sessions(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    sessions = await chat_service.list_sessions(db, project_id, current_user.id)
    return [ChatSessionResponse.from_orm(s) for s in sessions]


@router.get("/sessions/{session_id}", response_model=ChatSessionResponse)
async def get_session(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await chat_service.get_session(db, session_id, current_user.id)
    return ChatSessionResponse.from_orm(session)


@router.patch("/sessions/{session_id}", response_model=ChatSessionResponse)
async def update_session(
    session_id: uuid.UUID,
    data: ChatSessionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await chat_service.update_session(db, session_id, current_user.id, data)
    return ChatSessionResponse.from_orm(session)


@router.patch("/sessions/{session_id}/finish", response_model=ChatSessionResponse)
async def finish_session(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await chat_service.finish_session(db, session_id, current_user.id)
    return ChatSessionResponse.from_orm(session)


@router.post("/sessions/{session_id}/messages", response_model=ChatMessageResponse, status_code=201)
async def add_message(
    session_id: uuid.UUID,
    data: ChatMessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    msg = await chat_service.add_message(db, session_id, current_user.id, data)
    return ChatMessageResponse.from_orm(msg)


@router.get("/sessions/{session_id}/messages", response_model=list[ChatMessageResponse])
async def list_messages(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    messages = await chat_service.list_messages(db, session_id, current_user.id)
    return [ChatMessageResponse.from_orm(m) for m in messages]


@router.post("/projects/{project_id}/query-runs", response_model=QueryStartResponse, status_code=201)
async def start_query(
    project_id: uuid.UUID,
    data: QueryStartRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session, run, question_message = await chat_service.start_query(
        db, current_user.id, project_id, data
    )
    return QueryStartResponse(
        session=ChatSessionResponse.from_orm(session),
        run=QueryRunResponse.from_orm(run),
        question_message=ChatMessageResponse.from_orm(question_message),
    )


@router.get("/query-runs/{run_id}", response_model=QueryRunResponse)
async def get_query_run(
    run_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    run = await chat_service.get_query_run(db, run_id, current_user.id)
    return QueryRunResponse.from_orm(run)


@router.post("/query-runs/{run_id}/cancel", response_model=QueryCancelResponse)
async def cancel_query_run(
    run_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    run, cancellation_message = await chat_service.cancel_query_run(db, run_id, current_user.id)
    return QueryCancelResponse(
        run=QueryRunResponse.from_orm(run),
        cancellation_message=ChatMessageResponse.from_orm(cancellation_message)
        if cancellation_message
        else None,
    )
