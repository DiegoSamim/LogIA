import asyncio
import json
import logging
from typing import Any

from pydantic import BaseModel, ValidationError

from app.ai.providers.base import AIProviderError
from app.core.config import get_settings

logger = logging.getLogger(__name__)


# Importação lazy (dentro da função) por dois motivos:
#   1. Se google-genai não estiver instalado, o servidor sobe normalmente
#      e só falha quando o provider Gemini for instanciado.
#   2. Evita tempo de startup desnecessário quando AI_PROVIDER != "gemini".
def _load_genai_module():
    try:
        from google import genai
        from google.genai import types as genai_types
    except ImportError as exc:  # pragma: no cover - depende de install
        raise AIProviderError(
            "Pacote google-genai nao instalado. Rode 'pip install google-genai'."
        ) from exc
    return genai, genai_types


# Constrói um novo client a cada chamada — o registry usa @lru_cache nos
# providers, então _build_client() é chamado no máximo uma vez por provider.
def _build_client() -> Any:
    settings = get_settings()
    if not settings.GEMINI_API_KEY:
        raise AIProviderError("GEMINI_API_KEY nao configurada no .env")
    genai, _ = _load_genai_module()
    return genai.Client(api_key=settings.GEMINI_API_KEY)


class GeminiEmbeddingProvider:
    def __init__(self, model: str, output_dimensionality: int) -> None:
        self._model = model
        # output_dimensionality=1536 usa Matryoshka Representation do modelo
        # gemini-embedding-001, que suporta 512/768/1536/3072 dims.
        # Escolhemos 1536 para manter compatibilidade com a coluna pgvector
        # existente sem nenhuma migração de banco.
        self._dim = output_dimensionality

    async def embed(self, text: str) -> list[float]:
        # Delega para embed_batch de um item para evitar duplicação de lógica.
        return (await self.embed_batch([text]))[0]

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []

        _, genai_types = _load_genai_module()
        client = _build_client()

        try:
            config = genai_types.EmbedContentConfig(
                output_dimensionality=self._dim,
            )
            # client.aio = interface assíncrona do SDK.
            # Passar a lista inteira de texts em uma chamada reduz o número
            # de round-trips à API, especialmente no script reembed.py com lotes.
            response = await client.aio.models.embed_content(
                model=self._model,
                contents=texts,
                config=config,
            )
        except Exception as exc:
            logger.warning("Gemini embedding failure: %s", exc)
            raise AIProviderError(f"Falha ao chamar Gemini embedding: {exc}") from exc

        embeddings = getattr(response, "embeddings", None) or []
        if len(embeddings) != len(texts):
            # Garantia de integridade: se o número de embeddings retornados
            # não bater com o enviado, algo quebrou na API. Melhor falhar
            # explicitamente do que salvar embeddings no banco com índice errado.
            raise AIProviderError(
                f"Gemini retornou {len(embeddings)} embeddings para {len(texts)} textos"
            )

        return [list(item.values) for item in embeddings]


class GeminiLLMProvider:
    def __init__(self, model: str) -> None:
        self._model = model

    async def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        response_schema: type[BaseModel],
        timeout_s: float,
    ) -> BaseModel:
        _, genai_types = _load_genai_module()
        client = _build_client()

        config = genai_types.GenerateContentConfig(
            system_instruction=system_prompt,
            # Força o modelo a devolver JSON puro (sem markdown, sem texto extra).
            response_mime_type="application/json",
            # Passa o schema Pydantic como JSON Schema para o Gemini,
            # que usa isso para garantir que a estrutura da resposta esteja correta.
            response_schema=response_schema,
            # 0.2 = conservador. Reduz aleatoriedade — ideal para relatórios
            # técnicos onde precisão importa mais que criatividade.
            temperature=0.2,
        )

        try:
            # asyncio.wait_for enforça o timeout da config sem depender de
            # timeout do cliente HTTP. Se o Gemini demorar mais que timeout_s,
            # TimeoutError é propagado e capturado em _resolve_query_answer.
            response = await asyncio.wait_for(
                client.aio.models.generate_content(
                    model=self._model,
                    contents=user_prompt,
                    config=config,
                ),
                timeout=timeout_s,
            )
        except asyncio.TimeoutError:
            raise  # propaga para o caller lidar com fallback
        except Exception as exc:
            logger.warning("Gemini generation failure: %s", exc)
            raise AIProviderError(f"Falha ao chamar Gemini generate: {exc}") from exc

        # Tentativa 1: SDK novo pode auto-parsear quando response_schema é Pydantic.
        parsed = getattr(response, "parsed", None)
        if isinstance(parsed, response_schema):
            return parsed

        # Tentativa 2: pegar o texto bruto e validar manualmente.
        # Necessário com versões do SDK que não auto-parseiam.
        raw_text = getattr(response, "text", None)
        if not raw_text:
            raise AIProviderError("Gemini retornou resposta vazia")

        try:
            data = json.loads(raw_text)
        except json.JSONDecodeError as exc:
            raise AIProviderError(f"Gemini retornou JSON invalido: {exc}") from exc

        try:
            # model_validate levanta ValidationError se o JSON não bater com
            # o schema Pydantic — capturado e convertido em AIProviderError.
            return response_schema.model_validate(data)
        except ValidationError as exc:
            raise AIProviderError(f"Resposta Gemini nao bate com schema: {exc}") from exc
