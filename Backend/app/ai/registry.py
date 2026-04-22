import logging
from functools import lru_cache

from app.ai.providers.base import EmbeddingProvider, LLMProvider
from app.ai.providers.fallback import FallbackEmbeddingProvider, FallbackLLMProvider
from app.core.config import get_settings

logger = logging.getLogger(__name__)


# @lru_cache garante que cada função retorne sempre o mesmo objeto após
# a primeira chamada. Isso é importante porque:
#   - Clientes HTTP (httpx.AsyncClient) têm custo de criação e gerenciam
#     pool de conexões; recriar a cada requisição desperdiça recursos.
#   - O SDK do Gemini mantém estado interno de autenticação no client.
# reset_provider_cache() existe para testes que precisam trocar de provider.

@lru_cache
def get_embedding_provider() -> EmbeddingProvider:
    settings = get_settings()
    provider = settings.AI_PROVIDER.lower()

    if provider == "gemini":
        # Degradação graciosa: sem chave, avisa no log mas não levanta erro.
        # Assim o servidor sobe normalmente e o fallback é usado para indexação.
        if not settings.GEMINI_API_KEY:
            logger.warning(
                "AI_PROVIDER=gemini mas GEMINI_API_KEY vazia; usando FallbackEmbeddingProvider"
            )
            return FallbackEmbeddingProvider(dim=settings.AI_EMBEDDING_DIM)
        from app.ai.providers.gemini import GeminiEmbeddingProvider

        return GeminiEmbeddingProvider(
            model=settings.AI_EMBEDDING_MODEL,
            output_dimensionality=settings.AI_EMBEDDING_DIM,
        )

    if provider == "ollama":
        from app.ai.providers.ollama import OllamaEmbeddingProvider

        return OllamaEmbeddingProvider(model=settings.AI_EMBEDDING_MODEL)

    # "fallback" explícito ou qualquer valor desconhecido → blake2b local.
    return FallbackEmbeddingProvider(dim=settings.AI_EMBEDDING_DIM)


@lru_cache
def get_llm_provider() -> LLMProvider:
    settings = get_settings()
    provider = settings.AI_PROVIDER.lower()

    if provider == "gemini":
        if not settings.GEMINI_API_KEY:
            logger.warning(
                "AI_PROVIDER=gemini mas GEMINI_API_KEY vazia; usando FallbackLLMProvider"
            )
            return FallbackLLMProvider()
        from app.ai.providers.gemini import GeminiLLMProvider

        return GeminiLLMProvider(model=settings.AI_GENERATION_MODEL)

    if provider == "ollama":
        from app.ai.providers.ollama import OllamaLLMProvider

        return OllamaLLMProvider(model=settings.AI_GENERATION_MODEL)

    return FallbackLLMProvider()


def reset_provider_cache() -> None:
    """Limpa o cache dos providers. Usado em testes para trocar de provedor
    entre casos de teste sem reiniciar o processo."""
    get_embedding_provider.cache_clear()
    get_llm_provider.cache_clear()
