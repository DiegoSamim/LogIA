# Ponto de entrada público do módulo de IA.
# Exporta apenas o necessário para que outros módulos não importem
# diretamente de subpastas internas (ex: app.ai.providers.gemini).
# Isso permite trocar implementações internas sem quebrar importadores.
from app.ai.providers.base import (
    AIProviderError,
    EmbeddingProvider,
    LLMProvider,
)
from app.ai.registry import get_embedding_provider, get_llm_provider

__all__ = [
    "AIProviderError",
    "EmbeddingProvider",
    "LLMProvider",
    "get_embedding_provider",
    "get_llm_provider",
]
