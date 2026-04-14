from pydantic import BaseModel


class KnowledgeChunkCreate(BaseModel):
    project_id: str
    source_type: str
    content: str
    embedding: list[float]
    chunk_metadata: dict | None = None
    task_id: str | None = None
    task_update_id: str | None = None


class KnowledgeChunkResponse(BaseModel):
    id: str
    project_id: str
    task_id: str | None
    task_update_id: str | None
    source_type: str
    content: str
    chunk_metadata: dict | None
    created_at: str
    updated_at: str

    @classmethod
    def from_orm(cls, chunk) -> "KnowledgeChunkResponse":
        return cls(
            id=str(chunk.id),
            project_id=str(chunk.project_id),
            task_id=str(chunk.task_id) if chunk.task_id else None,
            task_update_id=str(chunk.task_update_id) if chunk.task_update_id else None,
            source_type=chunk.source_type,
            content=chunk.content,
            chunk_metadata=chunk.chunk_metadata,
            created_at=chunk.created_at.isoformat(),
            updated_at=chunk.updated_at.isoformat(),
        )
