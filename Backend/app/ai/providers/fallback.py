import asyncio
import hashlib
import math
import re

from pydantic import BaseModel

from app.ai.providers.base import AIProviderError

TOKEN_RE = re.compile(r"[a-zA-Z0-9_]+", re.UNICODE)


# Reproduz a lógica original de embed_text (blake2b) como um provider
# assíncrono. Usado em dois casos:
#   1. AI_ENABLED=False — nunca chama APIs externas
#   2. Fallback de erro — quando Gemini/Ollama falha durante indexação
# Manter esta lógica aqui (e não apenas em knowledge_service.py) evita
# duplicação e permite que o registry a instancie como qualquer outro provider.
def _hash_embed(text: str, dim: int) -> list[float]:
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


class FallbackEmbeddingProvider:
    def __init__(self, dim: int = 1536) -> None:
        self._dim = dim

    async def embed(self, text: str) -> list[float]:
        # asyncio.to_thread executa a função síncrona em uma thread separada,
        # sem bloquear o event loop do FastAPI durante o cálculo do hash.
        return await asyncio.to_thread(_hash_embed, text, self._dim)

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        return [await self.embed(text) for text in texts]


class FallbackLLMProvider:
    # Este provider não gera texto — ele sempre falha com AIProviderError.
    # O propósito é forçar o caller (chat_service._resolve_query_answer) a
    # cair no caminho mock, que é quem realmente sabe montar o payload quando
    # não há LLM disponível. Lançar erro explícito é melhor que retornar
    # dados vazios silenciosamente.
    async def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        response_schema: type[BaseModel],
        timeout_s: float,
    ) -> BaseModel:
        raise AIProviderError(
            "FallbackLLMProvider cannot generate structured output; "
            "the caller must handle this by falling back to the mock pipeline."
        )
