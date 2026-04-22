import json
import logging
from typing import Any

import httpx
from pydantic import BaseModel, ValidationError

from app.ai.providers.base import AIProviderError
from app.core.config import get_settings

logger = logging.getLogger(__name__)


# Provider para Ollama — servidor de LLM local (ollama.ai).
# Não requer chave de API nem conexão com internet.
# Útil para desenvolvimento offline e como alternativa ao Gemini.
# Setup: ollama pull llama3.1:8b && ollama pull nomic-embed-text
class OllamaEmbeddingProvider:
    def __init__(self, model: str) -> None:
        self._model = model

    async def embed(self, text: str) -> list[float]:
        settings = get_settings()
        url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/embeddings"
        payload: dict[str, Any] = {"model": self._model, "prompt": text}
        try:
            # httpx.AsyncClient é o cliente HTTP assíncrono recomendado para FastAPI.
            # Criado com `async with` para fechar conexões automaticamente.
            async with httpx.AsyncClient(timeout=settings.AI_REQUEST_TIMEOUT_S) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()  # lança erro em 4xx/5xx
                data = response.json()
        except Exception as exc:
            logger.warning("Ollama embedding failure: %s", exc)
            raise AIProviderError(f"Falha ao chamar Ollama embedding: {exc}") from exc

        embedding = data.get("embedding")
        if not isinstance(embedding, list):
            raise AIProviderError("Ollama nao retornou campo 'embedding'")
        return [float(v) for v in embedding]

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        # Ollama não tem endpoint batch — fazemos chamadas sequenciais.
        # Para grandes volumes, considere paralelizar com asyncio.gather.
        return [await self.embed(text) for text in texts]


class OllamaLLMProvider:
    def __init__(self, model: str) -> None:
        self._model = model

    async def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        response_schema: type[BaseModel],
        timeout_s: float,
    ) -> BaseModel:
        settings = get_settings()
        url = f"{settings.OLLAMA_BASE_URL.rstrip('/')}/api/chat"
        payload: dict[str, Any] = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            # format: "json" instrui o Ollama a forçar saída JSON válida,
            # similar ao response_mime_type do Gemini.
            "format": "json",
            # stream: false aguarda a resposta completa antes de retornar.
            # stream: true enviaria tokens progressivamente (não suportado aqui).
            "stream": False,
            "options": {"temperature": 0.2},
        }

        try:
            async with httpx.AsyncClient(timeout=timeout_s) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                data = response.json()
        except Exception as exc:
            logger.warning("Ollama generation failure: %s", exc)
            raise AIProviderError(f"Falha ao chamar Ollama chat: {exc}") from exc

        content = (data.get("message") or {}).get("content")
        if not content:
            raise AIProviderError("Ollama nao retornou 'message.content'")

        try:
            parsed = json.loads(content)
        except json.JSONDecodeError as exc:
            raise AIProviderError(f"Ollama retornou JSON invalido: {exc}") from exc

        try:
            return response_schema.model_validate(parsed)
        except ValidationError as exc:
            raise AIProviderError(f"Resposta Ollama nao bate com schema: {exc}") from exc
