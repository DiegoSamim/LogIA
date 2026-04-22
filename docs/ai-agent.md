# Agente de IA do LogIA

Documentação técnica completa do sistema RAG (Retrieval-Augmented Generation) integrado ao modo consulta do LogIA.

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Conceitos Fundamentais](#conceitos-fundamentais)
3. [Arquitetura](#arquitetura)
4. [Estrutura de Arquivos](#estrutura-de-arquivos)
5. [Pipeline End-to-End](#pipeline-end-to-end)
6. [Módulos](#módulos)
   - [providers/base.py](#providerbasepy)
   - [providers/gemini.py](#providersgeminipy)
   - [providers/ollama.py](#providersollamapy)
   - [providers/fallback.py](#providersfallbackpy)
   - [registry.py](#registrypy)
   - [schema.py](#schemapy)
   - [prompts.py](#promptspy)
   - [pipeline.py](#pipelinepy)
   - [panel.py](#panelpy)
7. [Serviços Integrados](#serviços-integrados)
   - [knowledge_service.py](#knowledge_servicepy)
   - [chat_service.py](#chat_servicepy)
8. [Banco de Dados](#banco-de-dados)
9. [Configuração](#configuração)
10. [Provedores Suportados](#provedores-suportados)
11. [Fallback e Resiliência](#fallback-e-resiliência)
12. [Formato da Resposta](#formato-da-resposta)
13. [Scripts de Manutenção](#scripts-de-manutenção)
14. [Exemplos Completos](#exemplos-completos)
15. [Guia de Troubleshooting](#guia-de-troubleshooting)

---

## Visão Geral

O LogIA usa um padrão chamado **RAG** (Retrieval-Augmented Generation) para responder às 4 perguntas fixas do modo consulta:

| Pergunta | `question_key` | `answer_kind` |
|---|---|---|
| O que fiz essa semana? | `weekly-progress` | `weekly_progress` |
| Quais bloqueios já registrei? | `recorded-blockers` | `blockers` |
| Resumo técnico do projeto | `technical-summary` | `technical_summary` |
| Tarefas ainda em aberto | `open-tasks` | `open_tasks` |

**Sem RAG**, a IA inventaria respostas sobre o seu projeto porque não tem acesso ao banco de dados. **Com RAG**, o sistema primeiro busca os trechos relevantes do banco (`knowledge_chunks`) e os envia como contexto para o modelo de linguagem (Gemini), que lê esses dados e gera um relatório estruturado.

```
Usuário → Pergunta → Backend → Busca no banco → LLM (Gemini) → Relatório → Frontend
```

---

## Conceitos Fundamentais

### Embedding

Um **embedding** é a representação de um texto como um vetor de números. Textos com significado semelhante produzem vetores matematicamente próximos.

```
"Implementei autenticação JWT"  → [0.12, -0.44, 0.91, ...]  (1536 números)
"Adicionei login com token"     → [0.11, -0.42, 0.89, ...]  ← muito próximo!
"Corrigi padding do CSS"        → [0.67,  0.33, -0.22, ...] ← muito distante
```

O LogIA usa `gemini-embedding-001` para gerar esses vetores. Cada chunk armazenado no banco tem seu embedding. Quando o usuário faz uma pergunta, a pergunta também vira embedding — e o banco retorna os chunks cujos embeddings são mais próximos (busca semântica).

### Chunk

Um **chunk** é um pedaço de texto de até 700 caracteres (`MAX_CHUNK_LENGTH`) gerado a partir de uma tarefa. Uma tarefa longa pode gerar 2-5 chunks. Cada chunk tem seu próprio embedding, content e metadata.

```
Tarefa: "Auth JWT" (1.200 chars)
    ↓ split_text_into_chunks()
Chunk 1: "Tarefa: Auth JWT\nStatus atual: done\nResumo: implementei auth com refresh token" (350 chars)
Chunk 2: "Abordagem tecnica: PyJWT com secret rotacionado a cada 30 dias" (250 chars)
Chunk 3: "Dificuldades: problema com expiração em fuso UTC" (150 chars)
```

### Distância Cosseno

Mede a similaridade entre dois vetores. Menor = mais parecidos.

```
query: "o que fiz essa semana?"    → embedding_query
chunk "Auth JWT done"               → distância 0.12  ← muito relevante
chunk "Dashboard in_progress"       → distância 0.18  ← relevante
chunk "Bug CSS padding"             → distância 0.55  ← pouco relevante
```

O PostgreSQL com a extensão `pgvector` faz essa operação nativamente:
```sql
ORDER BY embedding <=> query_embedding  -- <=> é o operador de distância cosseno
```

### LLM

**LLM** (Large Language Model) é o modelo de linguagem que gera texto. No LogIA, é o **Gemini 2.5 Flash Lite** da Google — disponível gratuitamente no Google AI Studio.

O LLM não tem acesso ao banco de dados; ele apenas processa o texto que você enviar. Por isso o RAG é fundamental: os chunks são enviados junto com a pergunta como contexto.

### Structured Output

Em vez de deixar o Gemini responder em texto livre, o LogIA exige que ele responda em **JSON com formato específico** (definido pela classe `AIAnswerDraft`). Isso é enviado via `response_schema` e `response_mime_type="application/json"`.

Resultado: a resposta sempre tem `title`, `summary`, `insights`, `sections` e `cited_chunk_ids` — garantindo que o frontend consiga renderizar sem tratar texto livre.

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                │
│              QueryConversationMessage.tsx                       │
│         (renderiza QueryAnswerPayload + QueryContextPanel)      │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP polling /query-runs/{id}
┌────────────────────────────▼────────────────────────────────────┐
│                    chat_service.py                              │
│                                                                 │
│  _execute_query_run()                                           │
│    └─ _resolve_query_answer()  ←── ponto de decisão AI vs mock │
│         ├── AI_ENABLED=True  → generate_query_answer()         │
│         └── AI_ENABLED=False → _build_mock_query_answer()      │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     pipeline.py                                 │
│                                                                 │
│  generate_query_answer()                                        │
│    1. embed_provider.embed(question_text)                       │
│    2. _fetch_intent_chunks(db, project_id, question_key, ...)   │
│    3. build_user_prompt(question_text, prompt_chunks)           │
│    4. llm_provider.generate_structured(..., AIAnswerDraft)      │
│    5. _normalize_open_tasks_payload() (se open-tasks)           │
│    6. _build_references(chunks, cited_chunk_ids)                │
└──────────┬──────────────────────────────────────────┬───────────┘
           │                                          │
┌──────────▼──────────┐                  ┌────────────▼───────────┐
│    registry.py      │                  │    PostgreSQL           │
│                     │                  │                         │
│  get_embedding_     │                  │  knowledge_chunks       │
│    provider()       │                  │  ├── content (text)     │
│  get_llm_provider() │                  │  ├── embedding (1536d)  │
│                     │                  │  └── chunk_metadata     │
└──────────┬──────────┘                  └────────────────────────┘
           │
    ┌──────┴──────────────────┐
    │                         │
┌───▼───────────┐  ┌──────────▼────────┐  ┌──────────────────────┐
│ gemini.py     │  │ ollama.py         │  │ fallback.py          │
│               │  │                   │  │                      │
│ GeminiEmbed   │  │ OllamaEmbed       │  │ FallbackEmbed        │
│ GeminiLLM     │  │ OllamaLLM         │  │ (blake2b)            │
│               │  │ (local, sem rede) │  │ FallbackLLM          │
│ Free tier     │  │ ollama pull ...   │  │ (→ AIProviderError)  │
└───────────────┘  └───────────────────┘  └──────────────────────┘
```

---

## Estrutura de Arquivos

```
Backend/
├── app/
│   ├── ai/
│   │   ├── __init__.py          # Exporta símbolos públicos do módulo
│   │   ├── schema.py            # Contrato da resposta (AIAnswerDraft + Pydantic)
│   │   ├── prompts.py           # System/user prompts em inglês, resposta em PT-BR
│   │   ├── pipeline.py          # Orquestrador RAG completo
│   │   ├── panel.py             # Painel lateral de indicadores (sem LLM)
│   │   ├── registry.py          # Factory de providers com @lru_cache
│   │   └── providers/
│   │       ├── __init__.py
│   │       ├── base.py          # Protocol (interface): EmbeddingProvider, LLMProvider
│   │       ├── gemini.py        # Google Gemini (free tier)
│   │       ├── ollama.py        # Ollama local (sem internet)
│   │       └── fallback.py      # Blake2b hash (sem IA)
│   ├── services/
│   │   ├── chat_service.py      # _resolve_query_answer: AI vs mock
│   │   └── knowledge_service.py # aembed_text, reindex_task_snapshot
│   ├── models/
│   │   └── knowledge.py         # KnowledgeChunk (ORM + pgvector)
│   └── core/
│       └── config.py            # Settings: AI_ENABLED, GEMINI_API_KEY...
├── scripts/
│   └── reembed.py               # Re-embeda chunks com novo provedor
└── docs/
    └── ai-agent.md              # Esta documentação
```

---

## Pipeline End-to-End

### Exemplo: usuário clica "Tarefas ainda em aberto"

**Dados de exemplo no banco:**
```
knowledge_chunks:
  id: "a1b2-..."  content: "Tarefa: Auth JWT\nStatus: in_progress\n..." task_status: "in_progress"
  id: "c3d4-..."  content: "Tarefa: Dashboard\nStatus: blocked\n..."   task_status: "blocked"
  id: "e5f6-..."  content: "Tarefa: Auth JWT\nAbordagem: PyJWT..."      task_status: "in_progress"
  id: "g7h8-..."  content: "Tarefa: Tests\nStatus: done\n..."           task_status: "done"
```

**Passo 1 — Frontend dispara a consulta:**
```
POST /api/sessions/{session_id}/query
{
  "question_key": "open-tasks",
  "question_text": "Tarefas ainda em aberto"
}
→ Cria QueryRun com status="pending"
→ Retorna { "run_id": "xyz..." }
```

**Passo 2 — `_execute_query_run` processa em background:**
```python
run.status = "running"
await db.commit()
```

**Passo 3 — `_resolve_query_answer` decide AI vs mock:**
```python
settings.AI_ENABLED == True  # → vai para generate_query_answer()
```

**Passo 4 — `generate_query_answer()` executa o pipeline:**

```python
# 1. Embedding da pergunta
query_embedding = await gemini_embed_provider.embed("Tarefas ainda em aberto")
# → [0.23, -0.11, 0.87, ...]  (1536 números)

# 2. Busca com filtro de intenção (open-tasks usa SQL direto, não semântica)
chunks = await db.execute(
    SELECT * FROM knowledge_chunks
    WHERE project_id = ?
    AND source_type = 'task_snapshot'
    AND metadata->>'task_status' NOT IN ('done', 'cancelled')
    ORDER BY updated_at DESC
    LIMIT 12
)
# → [chunk_a1b2 (Auth JWT, in_progress), chunk_c3d4 (Dashboard, blocked)]

# 3. Formatar chunks como texto para o LLM
user_prompt = """
User question: Tarefas ainda em aberto

Chunks retrieved from the project knowledge base:

[chunk_id: a1b2-...]
Tarefa: Auth JWT
Status atual: in_progress
Resumo: implementando autenticação
(task: Auth JWT; status: in_progress)
---
[chunk_id: c3d4-...]
Tarefa: Dashboard
Status atual: blocked
Motivo do bloqueio: aguardando definição de design
(task: Dashboard; status: blocked)

Produce the JSON report according to the schema.
All text fields must be in Brazilian Portuguese.
"""

# 4. Chamada ao Gemini com schema estruturado
draft = await gemini_llm_provider.generate_structured(
    system_prompt=OPEN_TASKS_PROMPT,
    user_prompt=user_prompt,
    response_schema=AIAnswerDraft,
    timeout_s=25.0,
)
```

**Passo 5 — Gemini responde (JSON estruturado):**
```json
{
  "answer_kind": "open_tasks",
  "title": "Tarefas em Aberto",
  "summary": "Existem 2 tarefas abertas no projeto. A tarefa de autenticação está em andamento e o dashboard está bloqueado aguardando definição de design.",
  "insights": [
    { "label": "Tarefas abertas", "value": "2", "tone": "warning" },
    { "label": "Em andamento",    "value": "1", "tone": "accent"  },
    { "label": "Bloqueadas",      "value": "1", "tone": "danger"  }
  ],
  "sections": [
    {
      "id": "open-tasks",
      "type": "task_cards",
      "title": "Tarefas em Aberto",
      "items": [
        {
          "title": "Auth JWT",
          "summary": "Implementando autenticação com refresh token",
          "status": "in_progress",
          "status_label": "Em andamento",
          "tone": "warning"
        },
        {
          "title": "Dashboard",
          "summary": "Aguardando definição de design",
          "status": "blocked",
          "status_label": "Bloqueada",
          "tone": "danger"
        }
      ]
    }
  ],
  "cited_chunk_ids": ["a1b2-...", "c3d4-..."]
}
```

**Passo 6 — Pós-processamento e referências:**
```python
# Normaliza payload com dados reais do banco
payload = _normalize_open_tasks_payload(payload, chunks)

# Monta referências a partir dos IDs citados
references = _build_references(chunks, ["a1b2-...", "c3d4-..."])
# → [
#     { "task_title": "Auth JWT", "task_status": "in_progress", "preview": "..." },
#     { "task_title": "Dashboard", "task_status": "blocked", "preview": "..." }
#   ]
```

**Passo 7 — Frontend recebe e renderiza:**
```
GET /api/query-runs/{run_id}
→ status: "completed"
→ msg_metadata.answer_payload = { ... }

QueryConversationMessage.tsx renderiza:
  - Título: "Tarefas em Aberto"
  - Insights row: 2 abertas | 1 em andamento | 1 bloqueada
  - Section task_cards: 2 cards com dot de status colorido
  - References: [1] Auth JWT  [2] Dashboard
```

---

## Módulos

### `providers/base.py`

Define os contratos (interfaces) que todos os providers devem seguir.

```python
class EmbeddingProvider(Protocol):
    async def embed(self, text: str) -> list[float]: ...
    async def embed_batch(self, texts: list[str]) -> list[list[float]]: ...

class LLMProvider(Protocol):
    async def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        response_schema: type[BaseModel],
        timeout_s: float,
    ) -> BaseModel: ...

class AIProviderError(Exception): ...
```

**Por que Protocol em vez de herança?** Permite que providers externos (ex: um futuro provider de Anthropic ou Cohere) implementem a interface sem precisar herdar de uma classe base do projeto. Mais flexível e Pythonico.

---

### `providers/gemini.py`

Implementação dos providers usando o SDK `google-genai`.

**`GeminiEmbeddingProvider`**
```python
provider = GeminiEmbeddingProvider(
    model="gemini-embedding-001",
    output_dimensionality=1536
)

embedding = await provider.embed("Implementei JWT")
# → [0.12, -0.44, 0.91, ...]  (1536 números)

embeddings = await provider.embed_batch(["texto 1", "texto 2", "texto 3"])
# → [[...], [...], [...]]  (uma chamada de rede para 3 textos)
```

**`GeminiLLMProvider`**
```python
provider = GeminiLLMProvider(model="gemini-2.5-flash-lite")

draft = await provider.generate_structured(
    system_prompt="You are a technical assistant...",
    user_prompt="User question: ...\n\nChunks: ...",
    response_schema=AIAnswerDraft,
    timeout_s=25.0,
)
# → AIAnswerDraft(title="...", sections=[...], cited_chunk_ids=["..."])
```

**Configurações relevantes:**
- `temperature=0.2` — conservador para relatórios técnicos
- `response_mime_type="application/json"` — forçar JSON puro
- `asyncio.wait_for(..., timeout=25)` — timeout explícito

---

### `providers/ollama.py`

Provider para [Ollama](https://ollama.ai) — servidor de LLM local, sem internet.

**Setup:**
```bash
# Instalar Ollama: https://ollama.ai
ollama pull llama3.1:8b        # modelo de geração
ollama pull nomic-embed-text   # modelo de embedding
```

**Configuração no `.env`:**
```env
AI_PROVIDER=ollama
AI_GENERATION_MODEL=llama3.1:8b
AI_EMBEDDING_MODEL=nomic-embed-text
AI_EMBEDDING_DIM=768   # nomic-embed-text retorna 768 dims (ver nota abaixo)
OLLAMA_BASE_URL=http://localhost:11434
```

> **Nota sobre dimensionalidade:** `nomic-embed-text` retorna vetores de 768 dimensões, diferente dos 1536 do Gemini. Se trocar para Ollama, é necessário alterar `AI_EMBEDDING_DIM=768` e executar uma migração Alembic para redimensionar a coluna `embedding` no PostgreSQL, além de re-embdar todos os chunks com `scripts/reembed.py`.

---

### `providers/fallback.py`

Provider local usando blake2b (hash criptográfico). **Não é semântico** — textos parecidos não geram vetores próximos. Usado quando a IA está desabilitada ou quando o provedor falha durante a indexação de tarefas.

```python
provider = FallbackEmbeddingProvider(dim=1536)
embedding = await provider.embed("Implementei JWT")
# → vetor determinístico, sempre igual para o mesmo texto
# → NÃO representa semântica, apenas serve como índice estável
```

`FallbackLLMProvider.generate_structured()` sempre lança `AIProviderError`, forçando o caller a usar o mock.

---

### `registry.py`

Factory com cache que instancia o provider correto baseado em `settings.AI_PROVIDER`.

```python
# Singleton: chamadas subsequentes retornam o mesmo objeto
embed_provider = get_embedding_provider()  # lê settings.AI_PROVIDER
llm_provider   = get_llm_provider()

# Degradação graciosa: sem chave → FallbackProvider (não lança erro)
# AI_PROVIDER=gemini + GEMINI_API_KEY vazia → warning no log + fallback

# Para testes que precisam trocar de provider:
reset_provider_cache()
```

**Hierarquia de seleção:**
```
settings.AI_PROVIDER
├── "gemini" + GEMINI_API_KEY presente → GeminiProvider
├── "gemini" + GEMINI_API_KEY ausente  → FallbackProvider (+ warning log)
├── "ollama"                           → OllamaProvider
└── qualquer outro valor               → FallbackProvider
```

---

### `schema.py`

Define o formato exato que o Gemini deve devolver (`AIAnswerDraft`) e a função que converte para o formato do frontend (`to_payload_dict`).

```python
# O que o Gemini deve produzir:
class AIAnswerDraft(BaseModel):
    answer_kind: str           # "weekly_progress" | "blockers" | etc
    title: str                 # em PT-BR
    summary: str               # 2-4 frases em PT-BR
    insights: list[AIInsight]  # métricas no topo (ex: "3 tarefas concluídas")
    sections: list[AISection]  # blocos de conteúdo
    cited_chunk_ids: list[str] # IDs dos chunks que embasaram a resposta

# O que o frontend recebe:
payload = to_payload_dict(draft, references)
# → {
#     "presentation_version": 1,
#     "answer_kind": "open_tasks",
#     "title": "Tarefas em Aberto",
#     "summary": "...",
#     "insights": [...],
#     "sections": [...],
#     "references": [...]
#   }
```

**Tipos disponíveis:**

| `tone` | Cor visual | Uso |
|---|---|---|
| `success` | Verde | Tarefa concluída, sem bloqueios |
| `warning` | Amarelo | Em andamento, atenção necessária |
| `danger`  | Vermelho | Bloqueada, crítico |
| `accent`  | Violeta | Destaque técnico, consulta |
| `muted`   | Cinza | Cancelada, secundário |
| `default` | Branco | Neutro |

| `section.type` | Componente visual |
|---|---|
| `highlights` | Cards com eyebrow + title + description |
| `task_cards` | Lista com dot de status + título + resumo |
| `timeline`   | Linha vertical com dot + badge |
| `status_list`| Linhas label/valor com dot |
| `bullet_list`| Lista de bullets simples |
| `rich_text`  | Parágrafos de prosa |
| `empty_state`| Mensagem centralizada de estado vazio |

---

### `prompts.py`

Contém os system prompts para cada tipo de pergunta e a função `build_user_prompt`.

**Por que em inglês?** Modelos como Gemini foram treinados majoritariamente em inglês. Instruções em inglês produzem seguimento mais preciso das regras. O conteúdo gerado (title, summary, etc.) é em PT-BR por instrução explícita no prompt.

**Estrutura do system prompt:**
```
BASE_SYSTEM_RULES          → regras comuns a todas as perguntas
    + prompt específico    → instruções para o tipo de relatório
```

**Regras críticas em `BASE_SYSTEM_RULES`:**
- Não inventar dados fora dos chunks
- Citar apenas `chunk_id`s presentes nos chunks recebidos
- Responder em PT-BR
- Não usar markdown/emojis nos campos de texto

**`build_user_prompt` — exemplo de saída:**
```
User question: Quais bloqueios já registrei?

Chunks retrieved from the project knowledge base:

[chunk_id: 3f2a-1234-...]
Tarefa: Dashboard
Tipo de atualizacao: blocker
Resumo: Aguardando definição da equipe de design
(task: Dashboard; status: blocked; update: blocker)
---
[chunk_id: 8b1c-5678-...]
Tarefa: Auth JWT
Status atual: blocked
Motivo do bloqueio: certificado SSL expirado no ambiente de staging
(task: Auth JWT; status: blocked)

Produce the JSON report according to the schema.
All text fields must be in Brazilian Portuguese.
```

---

### `pipeline.py`

Módulo central — orquestra todo o pipeline RAG.

**`generate_query_answer(db, project_id, question_key, question_text)`**

Retorna `(payload_dict, references_list, fallback_text)`.

**Estratégias de busca por `question_key`:**

| question_key | Estratégia | Motivo |
|---|---|---|
| `open-tasks` | SQL direto: `task_status NOT IN ('done', 'cancelled')` | Intenção completamente definida pelo status |
| `recorded-blockers` | SQL direto: `update_type='blocker' OR task_status='blocked'` | Intenção completamente definida pelo tipo de update |
| `weekly-progress` | Semântica nos últimos 7 dias → fallback sem filtro | Prioriza atividade recente |
| `technical-summary` | Semântica pura (top-K por relevância) | Sem recorte temporal |

**`_build_references(chunks, cited_chunk_ids)` — anti-alucinação:**
```python
# Passo 1: apenas chunks citados pelo Gemini que existem no banco
for cited_id in cited_chunk_ids:
    chunk = chunk_by_id.get(cited_id)
    if not chunk:
        continue  # ID inventado → ignorado silenciosamente

# Passo 2: completa com demais chunks até o limite de 8
for chunk in remaining_chunks:
    references.append(_chunk_reference(chunk))
```

**`_normalize_open_tasks_payload` — correção pós-LLM:**

Para `open-tasks`, o backend verifica se as contagens do Gemini batem com o banco real e corrige `insights` e `task_cards` se necessário. Isso previne casos onde o Gemini agrupa `todo` com `in_progress` ou erra contagens.

---

### `panel.py`

Constrói o painel lateral de indicadores (sidebar) da consulta. **Não faz nenhuma chamada ao LLM** — usa apenas os chunks recuperados e as referências para calcular métricas localmente.

```python
panel = build_query_panel_payload(
    question_key="open-tasks",
    answer_payload=payload,
    references=references,
    chunks=chunks,
    chunks_retrieved=len(chunks),
    ai_used=True,
)
# → {
#     "panel_kind": "open_tasks",
#     "summary_metric": { "label": "Abertas", "value": "3", "tone": "warning" },
#     "metrics": [
#       { "label": "Categorias", "value": 2 },
#       { "label": "Tags técnicas", "value": 5 }
#     ],
#     "groups": [
#       { "title": "Status", "type": "distribution", "items": [...] },
#       { "title": "Stack e tags técnicas", "type": "tag_list", "items": [...] },
#       { "title": "Fontes principais", "type": "source_list", "items": [...] }
#     ]
#   }
```

Métricas do painel por tipo de pergunta:

| question_key | summary_metric | groups adicionais |
|---|---|---|
| `weekly-progress` | Tarefas tocadas | Status, tipos de update, categorias |
| `recorded-blockers` | Bloqueios | Tarefas bloqueadas, eventos registrados |
| `technical-summary` | Temas técnicos | Tags técnicas, categorias |
| `open-tasks` | Tarefas abertas | Categorias, tags, prioridades |

---

## Serviços Integrados

### `knowledge_service.py`

Responsável por indexar tarefas como chunks no banco.

**`aembed_text(text, dim=1536)` — a ponte entre indexação e IA:**
```python
async def aembed_text(text, dim=1536):
    if not settings.AI_ENABLED:
        return embed_text(text, dim)    # blake2b local

    provider = get_embedding_provider()
    try:
        return await provider.embed(text)  # Gemini/Ollama
    except AIProviderError:
        return embed_text(text, dim)    # fallback silencioso
```

**Ciclo de vida de uma tarefa:**
```
Usuário cria/atualiza tarefa
    ↓
task_service.py chama reindex_task_snapshot(db, task)
    ↓
split_text_into_chunks(snapshot_text)  → ["chunk1", "chunk2", ...]
    ↓
para cada chunk:
    await aembed_text(content)  → [0.12, -0.44, ...]
    INSERT INTO knowledge_chunks (content, embedding, chunk_metadata, ...)
```

**`split_text_into_chunks(text, max_length=700)`:**

Divide o texto por parágrafos (`\n\n`) respeitando o limite de 700 chars. Parágrafos maiores são quebrados por palavras (nunca no meio de uma palavra).

```python
texto = "Parágrafo 1 longo...\n\nParágrafo 2...\n\nParágrafo 3..."
chunks = split_text_into_chunks(texto)
# ["Parágrafo 1 longo...\n\nParágrafo 2...", "Parágrafo 3..."]
# (agrupados até 700 chars, depois separados)
```

---

### `chat_service.py`

**`_resolve_query_answer` — ponto de decisão:**

```python
async def _resolve_query_answer(db, *, project_id, question_key, question_text):
    # Retorna: (answer_payload, panel_payload, references, answer_text, debug_info)

    if settings.AI_ENABLED:
        try:
            return await generate_query_answer(...)
            # debug_info["answer_source"] = "ai"
        except (AIProviderError, TimeoutError):
            if not settings.AI_FALLBACK_TO_MOCK:
                raise  # falha explícita em produção com fallback desabilitado
            # warning no log, continua para o mock

    return await _build_mock_query_answer(...)
    # debug_info["answer_source"] = "mock"
```

O `debug_info` retornado inclui:
```json
{
  "answer_source": "ai",          // "ai" ou "mock"
  "ai_enabled": true,
  "llm_called": true,
  "provider": "gemini",
  "generation_model": "gemini-2.5-flash-lite",
  "embedding_model": "gemini-embedding-001",
  "fallback_used": false
}
```

---

## Banco de Dados

### Tabela `knowledge_chunks`

```sql
CREATE TABLE knowledge_chunks (
    id              UUID PRIMARY KEY,
    task_id         UUID REFERENCES tasks(id) ON DELETE SET NULL,
    task_update_id  UUID REFERENCES task_updates(id) ON DELETE SET NULL,
    project_id      UUID REFERENCES projects(id) ON DELETE CASCADE,
    source_type     TEXT,      -- "task_snapshot" | "task_update"
    content         TEXT,      -- texto bruto do chunk (máx 700 chars)
    embedding       VECTOR(1536), -- vetor semântico
    metadata        JSONB,     -- task_title, task_status, update_type, etc.
    created_at      TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ
);

-- Índice para busca por cosine distance (criado pelo pgvector)
CREATE INDEX ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops);
```

**Operador de busca semântica:**
```sql
SELECT *, embedding <=> $1 AS distance
FROM knowledge_chunks
WHERE project_id = $2
ORDER BY distance ASC
LIMIT 12;
-- $1 = embedding da pergunta (array de 1536 floats)
-- $2 = UUID do projeto
```

### Estrutura de `chunk_metadata`

**Para `source_type = "task_snapshot"`:**
```json
{
  "entity": "task",
  "task_title": "Auth JWT",
  "task_status": "done",
  "chunk_index": 0,
  "chunk_total": 2,
  "embedding_version": 2   // adicionado após reembed.py
}
```

**Para `source_type = "task_update"`:**
```json
{
  "entity": "task_update",
  "task_title": "Dashboard",
  "update_type": "blocker",
  "old_status": "in_progress",
  "new_status": "blocked",
  "chunk_index": 0,
  "chunk_total": 1,
  "embedding_version": 2
}
```

---

## Configuração

### Variáveis de Ambiente (`.env`)

```env
# ── Feature flags ─────────────────────────────────────────────
# Master switch. False = modo pré-IA (mock + blake2b)
AI_ENABLED=True

# Provider: gemini | ollama | fallback
AI_PROVIDER=gemini

# ── Modelos ───────────────────────────────────────────────────
# LLM de geração. Gratuito no AI Studio (15 RPM, 1500 RPD).
AI_GENERATION_MODEL=gemini-2.5-flash-lite

# Modelo de embedding. Suporta output_dimensionality.
AI_EMBEDDING_MODEL=gemini-embedding-001

# Deve coincidir com Vector(N) na coluna do banco.
AI_EMBEDDING_DIM=1536

# ── Comportamento ─────────────────────────────────────────────
# Timeout de cada chamada ao LLM em segundos.
AI_REQUEST_TIMEOUT_S=25

# Se True, falhas do LLM não quebram a UX — usa o mock.
AI_FALLBACK_TO_MOCK=True

# ── Credenciais ───────────────────────────────────────────────
# Obter em: https://aistudio.google.com/apikey (gratuito)
GEMINI_API_KEY=AIza...

# URL do servidor Ollama local (quando AI_PROVIDER=ollama)
OLLAMA_BASE_URL=http://localhost:11434
```

---

## Provedores Suportados

### Gemini (recomendado para começar)

| Item | Valor |
|---|---|
| Chave | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) |
| Modelo LLM | `gemini-2.5-flash-lite` |
| Modelo Embedding | `gemini-embedding-001` |
| Free tier LLM | 15 RPM / 1.500 RPD |
| Free tier Embedding | 100 RPM / 30.000 RPD |
| Dimensionalidade | 1536 (nativo) — sem migração |

### Ollama (desenvolvimento offline)

| Item | Valor |
|---|---|
| Instalação | [ollama.ai](https://ollama.ai) |
| Modelo LLM sugerido | `llama3.1:8b` ou `qwen2.5:7b` |
| Modelo Embedding sugerido | `nomic-embed-text` |
| Dimensionalidade | 768 — **requer migração de banco** |
| Custo | Zero (roda local) |

### Fallback (blake2b)

| Item | Valor |
|---|---|
| Dependência | Nenhuma (Python stdlib) |
| Semântica | Não — apenas hash determinístico |
| Uso | AI_ENABLED=False ou falha de rede |
| Dimensionalidade | 1536 (configurável) |

---

## Fallback e Resiliência

O sistema tem 3 camadas de fallback:

```
Chamada ao Gemini
    ↓
    ├── Sucesso → retorna AIAnswerDraft
    ↓
    ├── AIProviderError (quota, rede, JSON inválido)
    │       ↓
    │   AI_FALLBACK_TO_MOCK=True  → usa _build_mock_query_answer
    │   AI_FALLBACK_TO_MOCK=False → propaga erro (status="failed")
    ↓
    ├── asyncio.TimeoutError (> 25s)
    │       ↓ (mesmo tratamento que AIProviderError)
    ↓
    └── GEMINI_API_KEY ausente
            ↓
        registry usa FallbackProvider → AIProviderError imediato → mock
```

**Para indexação de tarefas (reindex_task_snapshot):**
```
await aembed_text(content)
    ├── AI_ENABLED=False → blake2b (sem rede)
    ├── Gemini OK        → embedding semântico
    └── AIProviderError  → blake2b silencioso (tarefa salva sem bloqueio)
```

---

## Formato da Resposta

### `QueryAnswerPayload` (consumido pelo frontend)

```typescript
interface QueryAnswerPayload {
  presentation_version: 1;
  answer_kind: "weekly_progress" | "blockers" | "technical_summary" | "open_tasks";
  title: string;
  summary: string;
  insights: Array<{
    label: string;
    value: string;
    tone: "default" | "accent" | "success" | "warning" | "danger" | "muted";
    icon_key?: string;
  }>;
  sections: Array<{
    id: string;
    type: "highlights" | "task_cards" | "timeline" | "status_list"
        | "bullet_list" | "rich_text" | "empty_state";
    title: string;
    subtitle?: string;
    items: SectionItem[];
  }>;
  references: Array<{
    id: string;
    chunk_id: string;
    task_id: string | null;
    task_title: string | null;
    task_status: string | null;
    source_type: string;
    preview: string;
  }>;
}
```

### Exemplo completo de payload (`blockers`)

```json
{
  "presentation_version": 1,
  "answer_kind": "blockers",
  "title": "Bloqueios Registrados",
  "summary": "Foram encontrados 2 bloqueios ativos no projeto. O dashboard está aguardando decisão de design e a autenticação tem problema com SSL no staging.",
  "insights": [
    { "label": "Bloqueios ativos", "value": "2", "tone": "danger" }
  ],
  "sections": [
    {
      "id": "blockers-list",
      "type": "status_list",
      "title": "Bloqueios",
      "items": [
        {
          "title": "Dashboard",
          "description": "Aguardando definição da equipe de design",
          "value": "Bloqueada",
          "tone": "danger"
        },
        {
          "title": "Auth JWT",
          "description": "Certificado SSL expirado no ambiente de staging",
          "value": "Bloqueada",
          "tone": "danger"
        }
      ]
    }
  ],
  "references": [
    {
      "id": "c3d4-...",
      "chunk_id": "c3d4-...",
      "task_id": "1111-...",
      "task_title": "Dashboard",
      "task_status": "blocked",
      "source_type": "task_update",
      "preview": "Tarefa: Dashboard\nTipo de atualizacao: blocker\nResumo: Aguardando..."
    }
  ]
}
```

---

## Scripts de Manutenção

### `scripts/reembed.py`

Re-embeda todos os chunks existentes com o provedor configurado. Execute após ativar a IA pela primeira vez ou ao trocar de provedor.

```bash
cd Backend

# Re-embeda somente os sem embedding_version=2 (idempotente)
python -m scripts.reembed

# Lotes menores (25 chunks por chamada batch) para respeitar quota
python -m scripts.reembed --batch 10

# Força re-embed de todos, incluindo já processados
python -m scripts.reembed --force
```

**Saída esperada:**
```
INFO reembed Chunks a reembedar: 47
INFO reembed Progresso: 25/47
INFO reembed Progresso: 47/47
```

**Como funciona a idempotência:**
```python
# Antes: chunk_metadata = {"task_title": "Auth JWT", "task_status": "done"}
# Depois: chunk_metadata = {"task_title": "Auth JWT", "task_status": "done", "embedding_version": 2}

# Na próxima execução, chunks com embedding_version=2 são ignorados automaticamente.
```

---

## Exemplos Completos

### Exemplo 1: Ativar IA do zero

```bash
# 1. Instalar dependências
cd Backend && pip install -r requirements.txt

# 2. Configurar .env
echo "AI_ENABLED=True"                           >> .env
echo "GEMINI_API_KEY=AIza_sua_chave_aqui"        >> .env

# 3. Re-embdar chunks existentes (blake2b → Gemini)
python -m scripts.reembed

# 4. Subir o servidor
uvicorn app.main:app --reload
```

### Exemplo 2: Trocar para Ollama

```bash
# 1. Instalar e baixar modelos
ollama pull llama3.1:8b
ollama pull nomic-embed-text

# 2. Configurar .env
AI_PROVIDER=ollama
AI_GENERATION_MODEL=llama3.1:8b
AI_EMBEDDING_MODEL=nomic-embed-text
AI_EMBEDDING_DIM=768

# 3. Migrar coluna do banco (768 dims)
# Em alembic/versions/xxxx_resize_embedding.py:
# op.execute("ALTER TABLE knowledge_chunks ALTER COLUMN embedding TYPE vector(768)")

# 4. Re-embdar com nomic-embed-text
python -m scripts.reembed --force
```

### Exemplo 3: Testar fallback

```bash
# Simular falha do Gemini: invalidar a chave temporariamente
# .env:  GEMINI_API_KEY=chave_invalida

# Disparar consulta no frontend
# Observar no log:
# WARNING  app.services.chat_service:chat_service.py:560
#   [LogIA AI] Pipeline de IA falhou (AIProviderError); usando mock como fallback.

# A consulta deve retornar status="completed" com payload do mock
# debug_info.answer_source = "mock"
# debug_info.fallback_used = true
```

### Exemplo 4: Adicionar novo provider

```python
# 1. Criar app/ai/providers/cohere.py

from app.ai.providers.base import AIProviderError
from pydantic import BaseModel

class CohereEmbeddingProvider:
    def __init__(self, api_key: str, model: str, dim: int) -> None:
        self._api_key = api_key
        self._model = model
        self._dim = dim

    async def embed(self, text: str) -> list[float]:
        # Chamar Cohere Embed API
        ...

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        ...

# 2. Adicionar ao registry.py
if provider == "cohere":
    from app.ai.providers.cohere import CohereEmbeddingProvider
    return CohereEmbeddingProvider(
        api_key=settings.COHERE_API_KEY,
        model=settings.AI_EMBEDDING_MODEL,
        dim=settings.AI_EMBEDDING_DIM,
    )

# 3. Adicionar COHERE_API_KEY ao config.py e .env.example
```

---

## Guia de Troubleshooting

### A consulta continua usando o mock mesmo com AI_ENABLED=True

1. Verificar se a chave está correta:
   ```bash
   grep GEMINI_API_KEY .env
   ```
2. Verificar log do backend: procurar por `[LogIA AI]`
3. Checar se o provider foi instanciado:
   ```python
   from app.ai.registry import get_embedding_provider
   p = get_embedding_provider()
   print(type(p))  # deve ser GeminiEmbeddingProvider
   ```

### Erro `AIProviderError: GEMINI_API_KEY nao configurada`

- `GEMINI_API_KEY` está em branco ou ausente no `.env`
- Reinicie o servidor após editar o `.env` (as configurações são lidas no startup com `@lru_cache`)

### Respostas do Gemini com texto em inglês

- Verificar se `BASE_SYSTEM_RULES` em `prompts.py` contém a linha:
  `All text fields [...] must be written in Brazilian Portuguese.`
- O Gemini às vezes ignora essa instrução em `summary`. Adicionar no `build_user_prompt` ao final:
  `"All text fields must be in Brazilian Portuguese."`

### Busca semântica retorna chunks irrelevantes

- Os chunks podem ter embeddings blake2b antigos. Executar:
  ```bash
  python -m scripts.reembed
  ```
- Verificar se `AI_ENABLED=True` quando os novos chunks foram criados

### `TimeoutError` frequente na consulta

- Aumentar `AI_REQUEST_TIMEOUT_S` no `.env` (padrão: 25s)
- O modelo `gemini-2.5-flash-lite` é mais lento que `gemini-2.0-flash`; trocar se latência for crítica
- Com `AI_FALLBACK_TO_MOCK=True`, o usuário vê a resposta mock enquanto o timeout ocorre silenciosamente

### Rate limit (429) do Gemini

- Free tier: 15 RPM para geração, 100 RPM para embedding
- `AI_FALLBACK_TO_MOCK=True` protege o usuário: a consulta usa o mock sem erro visível
- Para aumentar quota: criar projeto no Google Cloud e habilitar billing (mas free tier é suficiente para desenvolvimento)

### Erro `ValidationError` ao parsear resposta do Gemini

- O Gemini retornou JSON com campos inválidos (ex: `tone: "purple"` que não existe no Literal)
- O `GeminiLLMProvider` captura isso como `AIProviderError` e o fallback assume
- Para debug: adicionar `logger.debug("raw_text: %s", raw_text)` em `gemini.py` antes do `json.loads`

### Chunks com `source_type` nulo não aparecem nas buscas

- Isso não deve acontecer; `source_type` é `NOT NULL` no modelo
- Se acontecer: `UPDATE knowledge_chunks SET source_type = 'task_snapshot' WHERE source_type IS NULL`
