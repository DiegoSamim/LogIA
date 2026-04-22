from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    FRONTEND_URL: str = "http://localhost:5173"
    EXTRA_ORIGINS: str = ""
    APP_ENV: str = "development"
    UPLOAD_DIR: str = "./uploads"

    # ── Configurações do Agente de IA ─────────────────────────────────────────

    # Feature flag mestre. False = comportamento pré-IA (mock + blake2b).
    # Permite ligar/desligar a IA sem redeploy alterando apenas o .env.
    AI_ENABLED: bool = False

    # Qual provedor usar: "gemini" | "ollama" | "fallback".
    # Lido por registry.py para instanciar o provider correto.
    AI_PROVIDER: str = "gemini"

    # Modelo de geração (LLM). Gemini 2.5 Flash Lite está no free tier.
    AI_GENERATION_MODEL: str = "gemini-2.5-flash-lite"

    # Modelo de embedding. gemini-embedding-001 suporta output_dimensionality,
    # permitindo forçar 1536 dims e manter compatibilidade com a coluna pgvector.
    AI_EMBEDDING_MODEL: str = "gemini-embedding-001"

    # Deve coincidir com Vector(N) em KnowledgeChunk.embedding.
    # Mudar este valor exige migração Alembic + reembed de todos os chunks.
    AI_EMBEDDING_DIM: int = 1536

    # Timeout para chamadas ao LLM. Se exceder, TimeoutError é capturado
    # em _resolve_query_answer e o mock é usado como fallback.
    AI_REQUEST_TIMEOUT_S: float = 25.0

    # Se True, falhas do LLM caem silenciosamente para o mock antigo.
    # Em produção mantenha True para não quebrar a UX por quota/rede.
    AI_FALLBACK_TO_MOCK: bool = True

    # Chave da API do Google AI Studio (gratuita em aistudio.google.com/apikey).
    # Opcional: se ausente e AI_PROVIDER=gemini, registry usa FallbackProvider.
    GEMINI_API_KEY: str | None = None

    # URL base do servidor Ollama local. Usado quando AI_PROVIDER=ollama.
    OLLAMA_BASE_URL: str = "http://localhost:11434"


# Singleton com cache: instanciado uma vez por processo e reutilizado.
# Evita re-leitura do .env a cada chamada get_settings().
@lru_cache
def get_settings() -> Settings:
    return Settings()
