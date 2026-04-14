import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.knowledge import KnowledgeChunk
from app.schemas.knowledge import KnowledgeChunkCreate


async def create_chunk(db: AsyncSession, data: KnowledgeChunkCreate) -> KnowledgeChunk:
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
    await db.commit()
    await db.refresh(chunk)
    return chunk


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
