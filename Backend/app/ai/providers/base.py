from typing import Protocol, TypeVar, runtime_checkable

from pydantic import BaseModel


# Exceção específica para falhas de provedores de IA.
# Usar uma classe própria (em vez de Exception genérica) permite que o
# caller faça `except AIProviderError` sem capturar bugs de lógica
# acidentalmente. Exemplos de causas: rede fora, quota esgotada, JSON inválido.
class AIProviderError(Exception):
    """Raised when an AI provider fails (network, rate limit, invalid output)."""


TModel = TypeVar("TModel", bound=BaseModel)


# Protocol é a forma Pythonica de definir interfaces (como interface em Java
# ou TypeScript). Qualquer classe com os métodos corretos satisfaz o Protocol,
# sem precisar herdar explicitamente.
#
# @runtime_checkable permite usar isinstance(obj, EmbeddingProvider) em
# testes e no registry para verificar que o provider está correto.
@runtime_checkable
class EmbeddingProvider(Protocol):
    # Converte um único texto em um vetor de floats (embedding).
    # Retorna list[float] com comprimento == AI_EMBEDDING_DIM (padrão 1536).
    async def embed(self, text: str) -> list[float]: ...

    # Versão batch: mais eficiente quando há múltiplos textos,
    # pois muitos provedores aceitam lotes em uma única chamada de rede.
    async def embed_batch(self, texts: list[str]) -> list[list[float]]: ...


@runtime_checkable
class LLMProvider(Protocol):
    # Gera uma resposta estruturada (Pydantic model) a partir de prompts.
    # response_schema é a classe Pydantic que define o formato esperado —
    # enviada ao LLM como JSON Schema para forçar saída estruturada.
    # timeout_s permite que cada chamada tenha seu próprio timeout,
    # independente do timeout HTTP global do servidor.
    async def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        response_schema: type[BaseModel],
        timeout_s: float,
    ) -> BaseModel: ...
