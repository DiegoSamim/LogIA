import uuid

from pgvector.sqlalchemy import Vector
from sqlalchemy import ForeignKey, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


# Tabela central do sistema RAG. Cada linha representa um pedaço de texto
# (chunk) de uma tarefa, com seu embedding vetorial para busca semântica.
class KnowledgeChunk(Base, TimestampMixin):
    __tablename__ = "knowledge_chunks"

    # UUID gerado automaticamente. Usado pelo Gemini em `cited_chunk_ids`
    # para indicar quais fontes embasaram a resposta.
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Referência à tarefa-mãe do chunk. SET NULL garante que o chunk
    # sobreviva se a tarefa for deletada (histórico preservado).
    task_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tasks.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Referência ao update específico que gerou este chunk.
    # Nulo quando o chunk vem do snapshot completo da tarefa.
    task_update_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("task_updates.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # CASCADE: deletar o projeto remove todos os chunks. Não faz sentido
    # manter conhecimento de um projeto inexistente.
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        index=True,
    )

    # "task_snapshot" ou "task_update" — indica a origem do chunk.
    # Usado nos filtros de intenção do pipeline (ex: open-tasks filtra
    # somente task_snapshot).
    source_type: Mapped[str] = mapped_column(Text)

    # O texto bruto do chunk, enviado ao Gemini como contexto.
    content: Mapped[str] = mapped_column(Text)

    # Vetor de 1536 floats gerado pelo modelo de embedding (Gemini
    # gemini-embedding-001 ou blake2b no fallback). O tipo Vector(1536)
    # é da extensão pgvector e permite ORDER BY cosine_distance().
    embedding: Mapped[list[float]] = mapped_column(Vector(1536))

    # Metadados estruturados sobre a origem do chunk. Exemplos:
    #   task_snapshot: {"task_title": "Auth JWT", "task_status": "done",
    #                   "chunk_index": 0, "chunk_total": 2}
    #   task_update:   {"update_type": "blocker", "old_status": "in_progress",
    #                   "new_status": "blocked", "embedding_version": 2}
    # Coluna JSONB permite filtros diretos no PostgreSQL sem JOIN.
    chunk_metadata: Mapped[dict | None] = mapped_column(JSONB, name="metadata", nullable=True)

    project: Mapped["Project"] = relationship(back_populates="knowledge_chunks")  # type: ignore[name-defined]
    task: Mapped["Task | None"] = relationship(back_populates="knowledge_chunks")  # type: ignore[name-defined]
    task_update: Mapped["TaskUpdate | None"] = relationship(back_populates="knowledge_chunks")  # type: ignore[name-defined]
