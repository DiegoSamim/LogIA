from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

# Tipos que o frontend aceita para colorir elementos do relatório.
# Mapeamento visual: success=verde, warning=amarelo, danger=vermelho,
# accent=violeta, muted=cinza, default=branco.
AIToneLiteral = Literal["default", "accent", "success", "warning", "danger", "muted"]

# Tipos de seção que QueryConversationMessage.tsx sabe renderizar.
# Cada tipo tem um componente visual diferente no frontend.
AISectionTypeLiteral = Literal[
    "highlights",    # cards de destaque com eyebrow + title + description
    "task_cards",    # lista de tarefas com status, dot colorido e summary
    "timeline",      # linha do tempo vertical com dot e badge
    "status_list",   # linhas label/valor com dot de status
    "blocker_cards", # cards estruturados de causa/impacto/destravamento
    "executive_summary", # bloco destacado de maturidade/gargalo/recomendação
    "bullet_list",   # lista de bullets simples
    "rich_text",     # parágrafos de prosa
    "empty_state",   # estado vazio centralizado
]


# Representa um número/métrica exibido no topo do relatório.
# Exemplo: {"label": "Tarefas concluídas", "value": "3", "tone": "success"}
class AIInsight(BaseModel):
    # extra="ignore" descarta campos extras que o Gemini possa inventar,
    # em vez de lançar ValidationError. Mais resiliente a versões futuras do LLM.
    model_config = ConfigDict(extra="ignore")

    label: str
    value: str
    tone: AIToneLiteral = "default"
    icon_key: str | None = None  # chave de ícone usada pelo frontend


# Item genérico de seção. Campos opcionais permitem que o mesmo modelo
# sirva para todos os 7 tipos de seção sem criar subclasses.
# O Gemini preenche apenas os campos relevantes para o tipo.
class AISectionItem(BaseModel):
    model_config = ConfigDict(extra="ignore")

    title: str | None = None          # task_cards, highlights, timeline, status_list
    description: str | None = None    # highlights, timeline, status_list
    summary: str | None = None        # task_cards (resumo curto da tarefa)
    status: str | None = None         # task_cards (valor interno: "done", "blocked"...)
    status_label: str | None = None   # task_cards (texto em PT-BR: "Concluída")
    tone: AIToneLiteral | None = None # cor do elemento
    eyebrow: str | None = None        # highlights (texto pequeno acima do título)
    badge: str | None = None          # timeline (badge lateral)
    text: str | None = None           # bullet_list
    content: str | None = None        # rich_text (parágrafo)
    label: str | None = None          # status_list (coluna esquerda)
    value: str | None = None          # status_list (coluna direita)
    causes: list[str] | None = None
    impacts: list[str] | None = None
    actions: list[str] | None = None
    days_blocked: int | None = None
    severity: str | None = None
    severity_label: str | None = None
    maturity_label: str | None = None
    bottleneck: str | None = None
    recommendation: str | None = None


# Bloco de conteúdo do relatório. Um relatório tem 1-4 seções.
class AISection(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str                           # slug único no relatório (ex: "open-tasks")
    type: AISectionTypeLiteral        # define como o frontend renderiza
    title: str                        # cabeçalho da seção
    subtitle: str | None = None       # texto secundário opcional
    items: list[AISectionItem] = Field(default_factory=list)


# Contrato completo que o Gemini deve devolver.
# Este é o "molde" enviado como response_schema na chamada ao LLM.
class AIAnswerDraft(BaseModel):
    model_config = ConfigDict(extra="ignore")

    answer_kind: str                  # ex: "weekly_progress", "open_tasks"
    title: str                        # título do relatório
    summary: str                      # 2-4 frases de resumo em PT-BR
    insights: list[AIInsight] = Field(default_factory=list)
    sections: list[AISection] = Field(default_factory=list)

    # UUIDs dos chunks usados pelo Gemini para embasar a resposta.
    # Mecanismo anti-alucinação: _build_references() só aceita IDs
    # que existam de fato nos chunks recuperados do banco.
    cited_chunk_ids: list[str] = Field(default_factory=list)


def to_payload_dict(draft: AIAnswerDraft, references: list[dict[str, Any]]) -> dict[str, Any]:
    """Converte AIAnswerDraft (schema interno) para o dict que o frontend espera.
    O frontend consome QueryAnswerPayload, que tem presentation_version como
    campo raiz para versionamento futuro do contrato."""
    return {
        "presentation_version": 1,
        "answer_kind": draft.answer_kind,
        "title": draft.title,
        "summary": draft.summary,
        "insights": [insight.model_dump(exclude_none=True) for insight in draft.insights],
        "sections": [
            {
                "id": section.id,
                "type": section.type,
                "title": section.title,
                "subtitle": section.subtitle,
                "items": [item.model_dump(exclude_none=True) for item in section.items],
            }
            for section in draft.sections
        ],
        "references": references,
    }
