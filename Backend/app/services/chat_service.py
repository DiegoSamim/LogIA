import asyncio
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import cast, or_, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.engine import AsyncSessionLocal
from app.models.chat import ChatMessage, ChatSession, QueryRun
from app.models.knowledge import KnowledgeChunk
from app.models.project import Project
from app.models.task import ProjectMember
from app.schemas.chat import (
    ChatMessageCreate,
    ChatSessionCreate,
    ChatSessionUpdate,
    QueryStartRequest,
)
from app.services.knowledge_service import (
    TASK_SNAPSHOT_SOURCE,
    TASK_UPDATE_SOURCE,
    embed_text,
    search_by_project,
)

RUNNING_QUERY_TASKS: dict[str, asyncio.Task[None]] = {}

QUERY_QUESTION_CATALOG: dict[str, str] = {
    "weekly-progress": "O que fiz essa semana?",
    "recorded-blockers": "Quais bloqueios já registrei?",
    "technical-summary": "Resumo técnico do projeto",
    "open-tasks": "Tarefas ainda em aberto",
}

TERMINAL_RUN_STATUSES = {"completed", "failed", "cancelled"}
ACTIVE_RUN_STATUSES = {"pending", "running"}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _touch_session(session: ChatSession) -> None:
    session.updated_at = _now()


def _chunk_reference(chunk: KnowledgeChunk) -> dict:
    metadata = chunk.chunk_metadata or {}
    return {
        "chunk_id": str(chunk.id),
        "task_id": str(chunk.task_id) if chunk.task_id else None,
        "task_update_id": str(chunk.task_update_id) if chunk.task_update_id else None,
        "source_type": chunk.source_type,
        "task_title": metadata.get("task_title"),
        "task_status": metadata.get("task_status"),
        "update_type": metadata.get("update_type"),
    }


def _build_open_tasks_answer(chunks: list[KnowledgeChunk]) -> tuple[str, list[dict]]:
    if not chunks:
        return (
            "Nao encontrei tarefas abertas indexadas ainda. Assim que novas tarefas forem registradas, a consulta passa a resumir esse contexto aqui.",
            [],
        )

    lines = ["Encontrei estas tarefas que seguem abertas no projeto:"]
    references: list[dict] = []

    for chunk in chunks[:5]:
        metadata = chunk.chunk_metadata or {}
        title = metadata.get("task_title") or "Tarefa sem titulo"
        status_label = metadata.get("task_status") or "status nao informado"
        preview = chunk.content.split("\n\n", 1)[-1].strip()
        preview = preview[:180].rstrip()
        lines.append(f"- {title} ({status_label}): {preview}")
        references.append(_chunk_reference(chunk))

    return "\n".join(lines), references


def _build_blockers_answer(chunks: list[KnowledgeChunk]) -> tuple[str, list[dict]]:
    if not chunks:
        return (
            "Nao encontrei bloqueios registrados ate agora. Se algum impedimento for documentado nas tarefas, ele passa a aparecer nesta consulta.",
            [],
        )

    lines = ["Estes sao os bloqueios que aparecem no historico atual:"]
    references: list[dict] = []

    for chunk in chunks[:5]:
        metadata = chunk.chunk_metadata or {}
        title = metadata.get("task_title") or "Tarefa sem titulo"
        preview = chunk.content[:220].rstrip()
        lines.append(f"- {title}: {preview}")
        references.append(_chunk_reference(chunk))

    return "\n".join(lines), references


def _build_weekly_progress_answer(chunks: list[KnowledgeChunk]) -> tuple[str, list[dict]]:
    if not chunks:
        return (
            "Ainda nao ha contexto suficiente para resumir a semana. Registre mais tarefas ou updates para que a consulta consiga consolidar esse panorama.",
            [],
        )

    lines = ["Aqui esta um panorama do que foi registrado mais recentemente:"]
    references: list[dict] = []

    for chunk in chunks[:5]:
        metadata = chunk.chunk_metadata or {}
        title = metadata.get("task_title") or "Registro tecnico"
        source = "update" if chunk.source_type == TASK_UPDATE_SOURCE else "snapshot"
        preview = chunk.content[:220].rstrip()
        lines.append(f"- {title} ({source}): {preview}")
        references.append(_chunk_reference(chunk))

    return "\n".join(lines), references


def _build_technical_summary_answer(chunks: list[KnowledgeChunk]) -> tuple[str, list[dict]]:
    if not chunks:
        return (
            "Ainda nao encontrei material tecnico suficiente indexado para montar um resumo. Conforme o time registrar mais tarefas e updates, esta resposta fica mais rica.",
            [],
        )

    lines = ["Resumo tecnico consolidado a partir do historico indexado:"]
    references: list[dict] = []

    for chunk in chunks[:4]:
        metadata = chunk.chunk_metadata or {}
        title = metadata.get("task_title") or "Contexto tecnico"
        preview = chunk.content[:260].rstrip()
        lines.append(f"- {title}: {preview}")
        references.append(_chunk_reference(chunk))

    return "\n".join(lines), references


async def _build_mock_query_answer(
    db: AsyncSession,
    project_id: uuid.UUID,
    question_key: str,
    question_text: str,
) -> tuple[str, list[dict]]:
    if question_key == "open-tasks":
        result = await db.execute(
            select(KnowledgeChunk)
            .where(
                KnowledgeChunk.project_id == project_id,
                KnowledgeChunk.source_type == TASK_SNAPSHOT_SOURCE,
                cast(KnowledgeChunk.chunk_metadata, JSONB)["task_status"].astext.notin_(["done", "cancelled"]),
            )
            .order_by(KnowledgeChunk.updated_at.desc())
            .limit(6)
        )
        return _build_open_tasks_answer(list(result.scalars().all()))

    if question_key == "recorded-blockers":
        result = await db.execute(
            select(KnowledgeChunk)
            .where(
                KnowledgeChunk.project_id == project_id,
                or_(
                    cast(KnowledgeChunk.chunk_metadata, JSONB)["update_type"].astext == "blocker",
                    cast(KnowledgeChunk.chunk_metadata, JSONB)["task_status"].astext == "blocked",
                ),
            )
            .order_by(KnowledgeChunk.updated_at.desc())
            .limit(6)
        )
        return _build_blockers_answer(list(result.scalars().all()))

    semantic_chunks = await search_by_project(db, project_id, embed_text(question_text), limit=6)

    if question_key == "technical-summary":
        return _build_technical_summary_answer(semantic_chunks)

    return _build_weekly_progress_answer(semantic_chunks)


async def _verify_project_ownership(db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID) -> None:
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            (Project.user_id == user_id) | Project.members.any(ProjectMember.user_id == user_id),
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projeto não encontrado.")


async def _verify_session_ownership(
    db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID
) -> ChatSession:
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.id == session_id, ChatSession.user_id == user_id)
        .options(selectinload(ChatSession.query_runs))
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sessão não encontrada.")
    return session


async def _verify_query_run_ownership(
    db: AsyncSession, run_id: uuid.UUID, user_id: uuid.UUID
) -> QueryRun:
    result = await db.execute(
        select(QueryRun)
        .join(ChatSession, QueryRun.session_id == ChatSession.id)
        .where(QueryRun.id == run_id, ChatSession.user_id == user_id)
        .options(selectinload(QueryRun.session))
    )
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consulta não encontrada.")
    return run


async def _get_active_session_run(db: AsyncSession, session_id: uuid.UUID) -> QueryRun | None:
    result = await db.execute(
        select(QueryRun)
        .where(
            QueryRun.session_id == session_id,
            QueryRun.status.in_(ACTIVE_RUN_STATUSES),
        )
        .order_by(QueryRun.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


def _launch_query_run(run_id: uuid.UUID) -> None:
    task_key = str(run_id)
    existing = RUNNING_QUERY_TASKS.get(task_key)
    if existing and not existing.done():
        return

    RUNNING_QUERY_TASKS[task_key] = asyncio.create_task(_execute_query_run(run_id), name=f"query-run-{task_key}")


async def _execute_query_run(run_id: uuid.UUID) -> None:
    task_key = str(run_id)
    try:
        async with AsyncSessionLocal() as db:
            run = await db.get(QueryRun, run_id, options=[selectinload(QueryRun.session)])
            if not run:
                return
            if run.status == "cancelled":
                return

            run.status = "running"
            run.started_at = _now()
            run.error_message = None
            _touch_session(run.session)
            await db.commit()

        await asyncio.sleep(1.1)

        async with AsyncSessionLocal() as db:
            run = await db.get(QueryRun, run_id, options=[selectinload(QueryRun.session)])
            if not run or run.status == "cancelled":
                return

            answer_text, references = await _build_mock_query_answer(
                db,
                run.session.project_id,
                run.question_key,
                run.question_text,
            )

            await db.refresh(run)
            if run.status == "cancelled":
                return

            answer_message = ChatMessage(
                id=uuid.uuid4(),
                session_id=run.session_id,
                sender="assistant",
                message_type="query_answer",
                content=answer_text,
                msg_metadata={
                    "run_id": str(run.id),
                    "question_key": run.question_key,
                    "status": "completed",
                    "references": references,
                },
            )
            db.add(answer_message)
            await db.flush()

            run.status = "completed"
            run.completed_at = _now()
            run.response_message_id = answer_message.id
            run.result_metadata = {"references": references}
            _touch_session(run.session)
            await db.commit()
    except asyncio.CancelledError:
        raise
    except Exception as exc:
        async with AsyncSessionLocal() as db:
            run = await db.get(QueryRun, run_id, options=[selectinload(QueryRun.session)])
            if not run or run.status == "cancelled":
                return

            error_text = "A consulta falhou antes de produzir uma resposta."
            error_message = ChatMessage(
                id=uuid.uuid4(),
                session_id=run.session_id,
                sender="assistant",
                message_type="query_error",
                content=error_text,
                msg_metadata={
                    "run_id": str(run.id),
                    "question_key": run.question_key,
                    "status": "failed",
                    "error_message": str(exc),
                },
            )
            db.add(error_message)
            await db.flush()

            run.status = "failed"
            run.error_message = str(exc)
            run.completed_at = _now()
            run.response_message_id = error_message.id
            _touch_session(run.session)
            await db.commit()
    finally:
        RUNNING_QUERY_TASKS.pop(task_key, None)


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
    return await get_session(db, session.id, user_id)


async def list_sessions(
    db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID
) -> list[ChatSession]:
    await _verify_project_ownership(db, project_id, user_id)
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.project_id == project_id, ChatSession.user_id == user_id)
        .options(selectinload(ChatSession.query_runs))
        .order_by(ChatSession.updated_at.desc())
    )
    return list(result.scalars().unique().all())


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
    _touch_session(session)
    await db.commit()
    return await get_session(db, session_id, user_id)


async def finish_session(
    db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID
) -> ChatSession:
    session = await _verify_session_ownership(db, session_id, user_id)
    session.status = "finished"
    session.ended_at = _now()
    _touch_session(session)
    await db.commit()
    return await get_session(db, session_id, user_id)


async def delete_session(
    db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID
) -> None:
    session = await _verify_session_ownership(db, session_id, user_id)
    await db.delete(session)
    await db.commit()


async def add_message(
    db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID, data: ChatMessageCreate
) -> ChatMessage:
    session = await _verify_session_ownership(db, session_id, user_id)
    msg = ChatMessage(
        id=uuid.uuid4(),
        session_id=session_id,
        sender=data.sender,
        message_type=data.message_type,
        content=data.content,
        msg_metadata=data.metadata,
    )
    db.add(msg)
    _touch_session(session)
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


async def start_query(
    db: AsyncSession,
    user_id: uuid.UUID,
    project_id: uuid.UUID,
    data: QueryStartRequest,
) -> tuple[ChatSession, QueryRun, ChatMessage]:
    await _verify_project_ownership(db, project_id, user_id)

    if data.question_key not in QUERY_QUESTION_CATALOG:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Pergunta fixa inválida para o modo consulta.",
        )

    session: ChatSession
    if data.session_id:
        session = await _verify_session_ownership(db, uuid.UUID(data.session_id), user_id)
        if session.project_id != project_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sessão não pertence ao projeto informado.",
            )
        if session.mode != "query":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Apenas sessões de consulta aceitam esse fluxo.",
            )
    else:
        session = ChatSession(
            id=uuid.uuid4(),
            user_id=user_id,
            project_id=project_id,
            mode="query",
            title=data.question_text,
        )
        db.add(session)
        await db.flush()

    active_run = await _get_active_session_run(db, session.id)
    if active_run:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe uma consulta em andamento nesta sessão.",
        )

    question_message = ChatMessage(
        id=uuid.uuid4(),
        session_id=session.id,
        sender="user",
        message_type="query_question",
        content=data.question_text,
        msg_metadata={
            "question_key": data.question_key,
            "status": "submitted",
        },
    )
    db.add(question_message)
    await db.flush()

    run = QueryRun(
        id=uuid.uuid4(),
        session_id=session.id,
        question_message_id=question_message.id,
        status="pending",
        question_key=data.question_key,
        question_text=data.question_text,
    )
    db.add(run)
    question_message.msg_metadata = {
        **(question_message.msg_metadata or {}),
        "run_id": str(run.id),
    }
    if not session.title:
        session.title = data.question_text
    _touch_session(session)

    await db.commit()

    session = await get_session(db, session.id, user_id)
    await db.refresh(question_message)
    await db.refresh(run)
    _launch_query_run(run.id)
    return session, run, question_message


async def get_query_run(
    db: AsyncSession, run_id: uuid.UUID, user_id: uuid.UUID
) -> QueryRun:
    return await _verify_query_run_ownership(db, run_id, user_id)


async def cancel_query_run(
    db: AsyncSession, run_id: uuid.UUID, user_id: uuid.UUID
) -> tuple[QueryRun, ChatMessage | None]:
    run = await _verify_query_run_ownership(db, run_id, user_id)

    if run.status in TERMINAL_RUN_STATUSES:
        return run, None

    run.status = "cancelled"
    run.cancelled_at = _now()
    run.completed_at = run.completed_at or run.cancelled_at
    cancellation_message = ChatMessage(
        id=uuid.uuid4(),
        session_id=run.session_id,
        sender="system",
        message_type="query_cancelled",
        content="Consulta cancelada pelo usuário.",
        msg_metadata={
            "run_id": str(run.id),
            "question_key": run.question_key,
            "status": "cancelled",
        },
    )
    db.add(cancellation_message)
    await db.flush()

    run.response_message_id = cancellation_message.id
    run.result_metadata = {"status": "cancelled"}
    _touch_session(run.session)
    await db.commit()
    await db.refresh(run)
    await db.refresh(cancellation_message)

    task = RUNNING_QUERY_TASKS.get(str(run.id))
    if task and not task.done():
        task.cancel()

    return run, cancellation_message
