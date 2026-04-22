"""Re-embeda chunks existentes usando o provedor configurado em settings.

Por que este script existe:
  Os chunks criados antes da ativação da IA têm embeddings gerados por
  blake2b (hash determinístico, sem semântica). Misturar embeddings blake2b
  com embeddings Gemini no mesmo banco quebra a busca semântica, pois os
  vetores vivem em "espaços" completamente diferentes.

  Execute uma vez após configurar GEMINI_API_KEY e AI_ENABLED=True para
  converter todos os chunks para o novo provedor.

Idempotência:
  O script marca `chunk_metadata.embedding_version = 2` após processar cada
  chunk. Execuções subsequentes ignoram chunks já marcados, a menos que
  --force seja passado. Pode ser interrompido e retomado com segurança.

Uso:
    cd Backend
    python -m scripts.reembed                # re-embeda chunks sem embedding_version=2
    python -m scripts.reembed --batch 25     # lotes menores (reduz risco de rate limit)
    python -m scripts.reembed --force        # re-embeda todos, incluindo já processados
"""

import argparse
import asyncio
import logging
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.dialects.postgresql import JSONB

from app.ai.providers.base import AIProviderError
from app.ai.registry import get_embedding_provider
from app.core.config import get_settings
from app.db.engine import AsyncSessionLocal
from app.models.knowledge import KnowledgeChunk

logger = logging.getLogger("reembed")

# Versão do embedding atual. Incrementar aqui e no batch quando trocar
# de provedor força o re-embed de chunks gerados pelo provedor anterior.
EMBEDDING_VERSION = 2


async def _reembed_batch(
    chunks: list[KnowledgeChunk],
    provider: Any,
) -> list[tuple[KnowledgeChunk, list[float]]]:
    """Chama embed_batch para o lote inteiro (uma chamada de rede para N chunks).
    Mais eficiente que N chamadas individuais, especialmente com Gemini que
    tem limites de RPM (requisições por minuto)."""
    texts = [chunk.content for chunk in chunks]
    embeddings = await provider.embed_batch(texts)
    return list(zip(chunks, embeddings, strict=True))


async def _process(batch_size: int, force: bool) -> None:
    settings = get_settings()
    if settings.AI_PROVIDER == "gemini" and not settings.GEMINI_API_KEY:
        raise SystemExit("GEMINI_API_KEY ausente no .env. Configure antes de rodar.")

    provider = get_embedding_provider()

    async with AsyncSessionLocal() as db:
        stmt = select(KnowledgeChunk).order_by(KnowledgeChunk.created_at)
        if not force:
            # Filtra apenas chunks sem embedding_version=2 no metadata JSONB.
            # A condição "== None" cobre chunks sem metadata algum.
            stmt = stmt.where(
                (KnowledgeChunk.chunk_metadata == None)  # noqa: E711
                | (
                    KnowledgeChunk.chunk_metadata["embedding_version"].astext.is_(None)
                )
                | (
                    KnowledgeChunk.chunk_metadata["embedding_version"].cast(JSONB)
                    != EMBEDDING_VERSION
                )
            )
        total_stmt = stmt.with_only_columns(KnowledgeChunk.id)
        total_result = await db.execute(total_stmt)
        total = len(total_result.scalars().all())
        logger.info("Chunks a reembedar: %d", total)

        if total == 0:
            logger.info("Nada para fazer.")
            return

        offset = 0
        done = 0
        while True:
            result = await db.execute(stmt.offset(offset).limit(batch_size))
            chunks = list(result.scalars().all())
            if not chunks:
                break

            try:
                pairs = await _reembed_batch(chunks, provider)
            except AIProviderError as exc:
                # Falha no lote: interrompe para não salvar embeddings parciais
                # que deixariam o banco inconsistente.
                logger.error("Falha do provedor no lote offset=%d: %s", offset, exc)
                raise

            for chunk, embedding in pairs:
                # Preserva todos os campos do metadata existente e adiciona
                # embedding_version para marcar como processado.
                metadata = dict(chunk.chunk_metadata or {})
                metadata["embedding_version"] = EMBEDDING_VERSION
                await db.execute(
                    update(KnowledgeChunk)
                    .where(KnowledgeChunk.id == chunk.id)
                    .values(embedding=embedding, chunk_metadata=metadata)
                )

            await db.commit()
            done += len(chunks)
            logger.info("Progresso: %d/%d", done, total)

            if len(chunks) < batch_size:
                break
            offset += batch_size


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s %(message)s")

    parser = argparse.ArgumentParser()
    parser.add_argument("--batch", type=int, default=25, help="tamanho do lote por chamada batch")
    parser.add_argument("--force", action="store_true", help="re-embeda mesmo os já marcados com embedding_version=2")
    args = parser.parse_args()

    asyncio.run(_process(batch_size=args.batch, force=args.force))


if __name__ == "__main__":
    main()
