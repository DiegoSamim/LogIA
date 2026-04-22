import hashlib
import math
import re
import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.knowledge import KnowledgeChunk
from app.schemas.knowledge import KnowledgeChunkCreate

if TYPE_CHECKING:
    from app.models.task import Task, TaskUpdate


# Deve coincidir com Vector(N) em KnowledgeChunk.embedding e AI_EMBEDDING_DIM no .env.
# Alterar exige migração Alembic + re-embed de todos os chunks.
KNOWLEDGE_EMBEDDING_DIM = 1536

# Dois tipos de fonte para os chunks:
# - task_snapshot: representa o estado completo da tarefa em um dado momento
# - task_update: representa um evento/atualização específico (bloqueio, progresso...)
TASK_SNAPSHOT_SOURCE = "task_snapshot"
TASK_UPDATE_SOURCE = "task_update"

# Tamanho máximo de cada chunk em caracteres.
# Chunks menores = mais precisos na busca, mas perdem contexto entre parágrafos.
# Chunks maiores = mais contexto, mas o embedding captura menos a essência.
# 700 é um bom equilíbrio para textos técnicos de tarefas.
MAX_CHUNK_LENGTH = 700
TOKEN_RE = re.compile(r"[a-zA-Z0-9_]+", re.UNICODE)


def _normalize_text(value: str | None) -> str:
    if not value:
        return ""
    return re.sub(r"\s+", " ", value).strip()


def _stringify_value(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, list):
        cleaned = [_normalize_text(str(item)) for item in value if _normalize_text(str(item))]
        return ", ".join(cleaned)
    return _normalize_text(str(value))


def _split_long_paragraph(paragraph: str, max_length: int = MAX_CHUNK_LENGTH) -> list[str]:
    words = paragraph.split()
    if not words:
        return []

    chunks: list[str] = []
    current = words[0]
    for word in words[1:]:
        candidate = f"{current} {word}"
        if len(candidate) <= max_length:
            current = candidate
            continue
        chunks.append(current)
        current = word

    chunks.append(current)
    return chunks


def split_text_into_chunks(text: str, max_length: int = MAX_CHUNK_LENGTH) -> list[str]:
    normalized = text.strip()
    if not normalized:
        return []

    paragraphs = [_normalize_text(part) for part in normalized.split("\n\n")]
    paragraphs = [part for part in paragraphs if part]
    if not paragraphs:
        return []

    chunks: list[str] = []
    current = ""

    for paragraph in paragraphs:
        if len(paragraph) > max_length:
            if current:
                chunks.append(current)
                current = ""
            chunks.extend(_split_long_paragraph(paragraph, max_length=max_length))
            continue

        candidate = paragraph if not current else f"{current}\n\n{paragraph}"
        if len(candidate) <= max_length:
            current = candidate
            continue

        chunks.append(current)
        current = paragraph

    if current:
        chunks.append(current)

    return chunks


def embed_text(text: str, dim: int = KNOWLEDGE_EMBEDDING_DIM) -> list[float]:
    tokens = TOKEN_RE.findall(text.lower())
    if not tokens:
        tokens = ["__empty__"]

    vector = [0.0] * dim
    for token in tokens:
        digest = hashlib.blake2b(token.encode("utf-8"), digest_size=16).digest()
        first_index = int.from_bytes(digest[:4], "big") % dim
        second_index = int.from_bytes(digest[4:8], "big") % dim
        first_sign = 1.0 if digest[8] % 2 == 0 else -1.0
        second_sign = 1.0 if digest[9] % 2 == 0 else -1.0
        first_weight = 1.0 + (digest[10] / 255.0)
        second_weight = 0.5 + (digest[11] / 255.0)

        vector[first_index] += first_sign * first_weight
        vector[second_index] += second_sign * second_weight

    norm = math.sqrt(sum(value * value for value in vector))
    if norm == 0:
        return vector
    return [value / norm for value in vector]


async def aembed_text(text: str, dim: int = KNOWLEDGE_EMBEDDING_DIM) -> list[float]:
    """Wrapper assíncrono de embedding com degradação graciosa.

    Hierarquia de fallback:
    1. AI_ENABLED=False  → blake2b local (sem rede, sem custo)
    2. Provedor AI_PROVIDER (Gemini/Ollama) → embedding semântico real
    3. AIProviderError   → blake2b local (provedor falhou, tarefa não fica bloqueada)

    Imports internos evitam importação circular entre knowledge_service ↔ ai/*.
    Esses módulos se referenciam mutuamente; importar no topo causaria ImportError.
    """
    from app.ai.providers.base import AIProviderError
    from app.ai.registry import get_embedding_provider
    from app.core.config import get_settings

    settings = get_settings()
    if not settings.AI_ENABLED:
        return embed_text(text, dim=dim)

    provider = get_embedding_provider()
    try:
        return await provider.embed(text)
    except AIProviderError:
        # Falha silenciosa: a tarefa é salva com embedding blake2b.
        # O script reembed.py pode corrigir esse chunk posteriormente.
        return embed_text(text, dim=dim)


def _build_task_snapshot_text(task: "Task") -> str:
    sections: list[str] = [
        f"Tarefa: {task.title}",
        f"Categoria: {_stringify_value(task.category) or 'Nao informada'}",
        f"Status atual: {_stringify_value(task.status) or 'Nao informado'}",
    ]

    optional_fields = [
        ("Feature ou ticket", task.feature_or_ticket),
        ("Resumo da tarefa", task.what_was_done),
        ("Abordagem tecnica", task.technical_approach),
        ("Prioridade", task.priority),
        ("Motivo do bloqueio", task.blocked_reason),
        ("Proximos passos", task.next_steps),
        ("Pessoas envolvidas", task.people_involved),
        ("Tags", task.tags or []),
        ("Horas trabalhadas", task.hours_worked),
        ("Inicio", task.started_at),
        ("Conclusao", task.completed_at),
    ]

    for label, value in optional_fields:
        rendered = _stringify_value(value)
        if rendered:
            sections.append(f"{label}: {rendered}")

    # Avoid async lazy-loading here. During task creation we may receive a freshly
    # flushed Task instance with relationships not eagerly loaded yet.
    checkpoints = task.__dict__.get("checkpoints") or []
    if checkpoints:
        checkpoint_lines = [
            f"- [{'x' if checkpoint.is_done else ' '}] {checkpoint.description}"
            for checkpoint in sorted(checkpoints, key=lambda item: item.order_index)
            if _normalize_text(checkpoint.description)
        ]
        if checkpoint_lines:
            sections.append("Checklist:\n" + "\n".join(checkpoint_lines))

    return "\n\n".join(sections)


def _build_task_update_text(task: "Task", update: "TaskUpdate") -> str:
    sections: list[str] = [
        f"Tarefa: {task.title}",
        f"Tipo de atualizacao: {_stringify_value(update.update_type) or 'Nao informado'}",
    ]

    summary = _stringify_value(update.summary)
    details = _stringify_value(update.details)
    old_status = _stringify_value(update.old_status)
    new_status = _stringify_value(update.new_status)
    created_at = _stringify_value(update.created_at)

    if summary:
        sections.append(f"Resumo: {summary}")
    if details:
        sections.append(f"Detalhes: {details}")
    if old_status or new_status:
        sections.append(
            f"Status: {old_status or 'Nao informado'} -> {new_status or 'Nao informado'}"
        )
    if created_at:
        sections.append(f"Data da atualizacao: {created_at}")

    return "\n\n".join(sections)


async def create_chunk(
    db: AsyncSession,
    data: KnowledgeChunkCreate,
    *,
    commit: bool = True,
) -> KnowledgeChunk:
    chunk = KnowledgeChunk(
        id=uuid.uuid4(),
        project_id=uuid.UUID(data.project_id),
        task_id=uuid.UUID(data.task_id) if data.task_id else None,
        task_update_id=uuid.UUID(data.task_update_id) if data.task_update_id else None,
        source_type=data.source_type,
        content=data.content,
        embedding=data.embedding,
        chunk_metadata=data.chunk_metadata,
    )
    db.add(chunk)
    await db.flush()
    await db.refresh(chunk)

    if commit:
        await db.commit()

    return chunk


async def delete_chunks_for_task(
    db: AsyncSession,
    task_id: uuid.UUID,
    *,
    source_type: str | None = None,
) -> None:
    query = delete(KnowledgeChunk).where(KnowledgeChunk.task_id == task_id)
    if source_type:
        query = query.where(KnowledgeChunk.source_type == source_type)
    await db.execute(query)


async def reindex_task_snapshot(db: AsyncSession, task: "Task") -> None:
    await delete_chunks_for_task(db, task.id, source_type=TASK_SNAPSHOT_SOURCE)

    snapshot_text = _build_task_snapshot_text(task)
    chunks = split_text_into_chunks(snapshot_text)

    for index, content in enumerate(chunks):
        db.add(
            KnowledgeChunk(
                id=uuid.uuid4(),
                project_id=task.project_id,
                task_id=task.id,
                task_update_id=None,
                source_type=TASK_SNAPSHOT_SOURCE,
                content=content,
                embedding=await aembed_text(content),
                chunk_metadata={
                    "entity": "task",
                    "task_title": task.title,
                    "task_status": task.status,
                    "task_category": _stringify_value(task.category) or None,
                    "chunk_index": index,
                    "chunk_total": len(chunks),
                },
            )
        )

    await db.flush()


async def index_task_update(db: AsyncSession, task: "Task", update: "TaskUpdate") -> None:
    update_text = _build_task_update_text(task, update)
    chunks = split_text_into_chunks(update_text)

    for index, content in enumerate(chunks):
        db.add(
            KnowledgeChunk(
                id=uuid.uuid4(),
                project_id=task.project_id,
                task_id=task.id,
                task_update_id=update.id,
                source_type=TASK_UPDATE_SOURCE,
                content=content,
                embedding=await aembed_text(content),
                chunk_metadata={
                    "entity": "task_update",
                    "task_title": task.title,
                    "task_status": update.new_status or update.old_status or task.status,
                    "task_category": _stringify_value(task.category) or None,
                    "update_type": update.update_type,
                    "old_status": update.old_status,
                    "new_status": update.new_status,
                    "chunk_index": index,
                    "chunk_total": len(chunks),
                },
            )
        )

    await db.flush()


async def search_by_project(
    db: AsyncSession,
    project_id: uuid.UUID,
    query_embedding: list[float],
    limit: int = 10,
) -> list[KnowledgeChunk]:
    result = await db.execute(
        select(KnowledgeChunk)
        .where(KnowledgeChunk.project_id == project_id)
        .order_by(KnowledgeChunk.embedding.cosine_distance(query_embedding))
        .limit(limit)
    )
    return list(result.scalars().all())
