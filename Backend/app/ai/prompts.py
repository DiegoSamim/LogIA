from typing import Any

# Prompts em inglês: LLMs como Gemini foram treinados majoritariamente em
# inglês, por isso instruções em inglês tendem a produzir respostas mais
# precisas e estruturadas. A regra de responder em PT-BR está explícita
# dentro dos prompts, garantindo que o conteúdo gerado chegue localizado.

BASE_SYSTEM_RULES = """You are a technical assistant that generates executive reports for developers
based on real task records from a project. You will receive a set of chunks (excerpts from task
records) and must produce a JSON report following EXACTLY the provided schema.

Mandatory rules:
- Use only information present in the chunks. Do not invent tasks, dates, names or numbers.
- Each chunk has an identifier in the format [chunk_id: <uuid>]. Whenever you use information
  from a chunk, add its uuid to `cited_chunk_ids`. Never cite ids that are not in the chunks.
- If the chunks are insufficient to answer, produce a single section of type `empty_state`
  explaining the limitation, leaving `insights` and other sections empty.
- `summary` must have at most 4 sentences, straight to the point, written in Brazilian Portuguese.
- All text fields (title, summary, description, content, text, eyebrow, badge, label, value,
  status_label) must be written in Brazilian Portuguese. No exceptions.
- `insights` (optional) summarises metrics or counts; always derive from the chunk content.
- Valid values for `tone`: `default`, `accent`, `success`, `warning`, `danger`, `muted`.
- Valid values for `section.type`: `highlights`, `task_cards`, `timeline`, `status_list`,
  `bullet_list`, `rich_text`, `empty_state`.
- `section.id` must be a unique slug within the report (e.g. `recent-highlights`, `open-tasks`).
- Do not use backticks, markdown, emojis or HTML in text fields.
"""


# Prompt para "O que fiz essa semana?" (weekly-progress).
# Instrui o modelo a produzir diagnóstico, agrupamento por categoria, timeline e gargalos.
# KPI insights são exibidos somente no painel lateral — NÃO inclua insights numéricos.
WEEKLY_PROGRESS_PROMPT = (
    BASE_SYSTEM_RULES
    + """
Report type: `weekly_progress`. Do NOT populate the `insights` array — those KPIs are shown in a separate panel.

Generate sections IN THIS ORDER:

1. `bullet_list` (id: "weekly-insight", title: "Insight principal")
   Diagnose the week: identify patterns such as high start rate but low completion,
   fragmented context, scope creep, no tasks finished, etc. Write 2-4 short diagnostic
   bullets in Brazilian Portuguese, focusing on WHY not just WHAT.
   If data is too sparse (fewer than 3 tasks), write a single neutral summary bullet.

2. One `status_list` section PER CATEGORY.
   CRITICAL — category rule:
     * Read the category ONLY from the annotation "(... category: <value> ...)" that appears
       after each chunk. Use EXACTLY that value as the section title. Do not infer, abbreviate,
       translate, or create any category name that is not present in the annotations.
     * If a chunk has no "category:" in its annotation, that task belongs to "Geral".
     * Never create categories like "IA", "Backend", "Feature", etc. unless they appear verbatim
       in a chunk annotation.
   Section id: "category-<lowercase-slug>", title: exact category string from the annotation.
   Per task, one item with:
     - title: the task name — copy it EXACTLY from the annotation "task: <name>" of that chunk.
       Never use a generic word. The title must match the task name.
     - status: the status value from the annotation (todo / in_progress / done / blocked / cancelled)
     - status_label: status in Brazilian Portuguese (A fazer / Em andamento / Concluída / Bloqueada / Cancelada)
     - value: compose from chunk text —
         * If the chunk has a "Checklist:" block, compute progress as "XX%" (count [x] lines / total lines)
         * Append "Próximo: <next step text>" from "Proximos passos:" field in the chunk,
           or suggest one based on the task content
         * If status is done, omit the next step
         * If no Checklist and status is not done, omit the percentage

3. `timeline` (id: "weekly-timeline", title: "Linha do tempo")
   Items ordered by updated_at descending (most recent first).
   Per item:
     - eyebrow: the ISO 8601 value from updated_at in the chunk annotation
     - badge: category from annotation (or "Geral")
     - title: EXACT task name from the annotation "task: <name>". Never write "Evento", "Registro"
       or any generic placeholder. If you cannot identify the task name, skip the item.
     - description: 1-2 sentences about what happened in this record
     - status: status from annotation

4. `status_list` (id: "weekly-bottlenecks", title: "Gargalos identificados") — CONDITIONAL.
   Include ONLY if bottlenecks exist:
     - Blocked tasks: for each blocked chunk, compute days blocked = days between its updated_at
       and today (use the actual number, e.g. "bloqueada há 3 dias"). tone = "danger".
       value = "Causa provável: <text from Motivo do bloqueio field, or logical inference>"
     - Low completion (fewer than 40% done with 3+ tasks):
       title = "Baixa taxa de conclusão (NN%)" where NN is the actual percentage, tone = "warning",
       value = "Possível causa: muitas tarefas iniciadas simultaneamente ou escopo mal definido"
   OMIT this section entirely if no bottlenecks are found.

Set `answer_kind` to `weekly_progress`.
"""
)

DAILY_PROGRESS_PROMPT = WEEKLY_PROGRESS_PROMPT.replace(
    "Report type: `weekly_progress`",
    "Report type: `daily_progress`",
).replace(
    "Diagnose the week",
    "Diagnose the day",
).replace(
    "Set `answer_kind` to `weekly_progress`.",
    "Set `answer_kind` to `daily_progress`.",
).replace(
    "weekly-",
    "daily-",
).replace(
    "semana",
    "dia",
).replace(
    "semana?",
    "hoje?",
)

# Prompt para "Quais bloqueios já registrei?" (recorded-blockers).
# Foca em updates com update_type=blocker e tarefas com status=blocked.
BLOCKERS_PROMPT = (
    BASE_SYSTEM_RULES
    + """
Report type: `blockers`. Focus on recorded blockers (updates with update_type=blocker
or tasks with status=blocked).
Suggested structure:
- `insights`: count of open blockers and the most critical blocker (tone `warning` or `danger`).
- Suggested sections:
  1. `blocker_cards`: each blocker as a structured card. Use `causes`, `impacts`, `actions`,
     `days_blocked`, `severity`, `severity_label`, `title`, `status`, `status_label`.
  2. `bullet_list` or `status_list` titled "Plano de ação e priorização" with concrete steps.
  3. `timeline`: only if blocker updates add useful context, without duplicating the cards.
If there are no blockers, return an `empty_state` with a reassuring message.
Set `answer_kind` to `blockers`.
"""
)

# Prompt para "Resumo técnico do projeto" (technical-summary).
# Incentiva rich_text para prosa técnica e bullet_list para padrões/libs.
TECHNICAL_SUMMARY_PROMPT = (
    BASE_SYSTEM_RULES
    + """
Report type: `technical_summary`. Summarise the technical decisions and approaches in the chunks.
Suggested structure:
- Optional `insights` (e.g. languages, tools mentioned).
- Suggested sections:
  1. `rich_text`: up to 2 paragraphs connecting technical points (`content`).
  2. `task_cards`: main tasks that form the technical foundation.
  3. `bullet_list`: risks identified (`title`: "Riscos identificados").
  4. `bullet_list`: technical impact (`title`: "Impacto").
  5. `bullet_list`: strategic next steps (`title`: "Próximos passos estratégicos").
  6. `executive_summary`: final executive synthesis with `content`, `maturity_label`,
     `bottleneck`, and `recommendation`.
Set `answer_kind` to `technical_summary`.
"""
)

# Prompt para "Tarefas ainda em aberto" (open-tasks).
# Regras específicas evitam que o modelo agrupe todo/in_progress ou
# conte o mesmo chunk duas vezes como tarefas diferentes.
OPEN_TASKS_PROMPT = (
    BASE_SYSTEM_RULES
    + """
Report type: `open_tasks`. List tasks that are still open (status other than done/cancelled).
Specific rules:
- Count unique tasks, not chunks. If two chunks belong to the same task, use the task once.
- Never group `todo` as `in_progress`: `todo` should be described as "a fazer" and
  `in_progress` as "em andamento".
- If there is 1 `in_progress` task and 1 `todo` task, state that difference precisely in the summary.
Suggested structure:
- `insights`: count of open, blocked, in-progress and to-do tasks.
- Suggested sections:
  1. `task_cards`: up to 6 open tasks (`title`, `summary`, `status`, `status_label`, `tone`).
  2. `bullet_list`: aggregated next steps (`text`) when it makes sense.
If there are no open tasks, return an `empty_state`.
Set `answer_kind` to `open_tasks`.
"""
)


# Mapa de question_key → system_prompt. Usado em pipeline.py para selecionar
# o prompt correto sem if/elif em cascata.
SYSTEM_PROMPTS_BY_QUESTION: dict[str, str] = {
    "weekly-progress": WEEKLY_PROGRESS_PROMPT,
    "daily-progress": DAILY_PROGRESS_PROMPT,
    "recorded-blockers": BLOCKERS_PROMPT,
    "technical-summary": TECHNICAL_SUMMARY_PROMPT,
    "open-tasks": OPEN_TASKS_PROMPT,
}


def build_user_prompt(
    question_text: str,
    retrieved_chunks: list[dict[str, Any]],
) -> str:
    """Formata os chunks recuperados como contexto legível para o LLM.

    Cada chunk é delimitado por --- e anotado com [chunk_id: <uuid>] para
    que o modelo possa citá-los em cited_chunk_ids. A linha de metadata
    (tarefa, status, update_type) ajuda o modelo a entender a proveniência
    sem precisar parsear o content do chunk.
    """
    if not retrieved_chunks:
        return (
            f"User question: {question_text}\n\n"
            "No chunks were retrieved. Respond with `empty_state` explaining there are no records."
        )

    blocks: list[str] = []
    for chunk in retrieved_chunks:
        meta = chunk.get("metadata") or {}
        source_parts: list[str] = []
        if meta.get("task_title"):
            source_parts.append(f"task: {meta['task_title']}")
        if meta.get("task_status"):
            source_parts.append(f"status: {meta['task_status']}")
        if meta.get("task_category"):
            source_parts.append(f"category: {meta['task_category']}")
        if meta.get("update_type"):
            source_parts.append(f"update: {meta['update_type']}")
        source_line = "; ".join(source_parts) if source_parts else "source: unknown"

        ts = chunk.get("updated_at") or ""
        ts_part = f" | updated_at: {ts}" if ts else ""
        blocks.append(
            f"[chunk_id: {chunk['id']}{ts_part}]\n{chunk['content']}\n({source_line})"
        )

    chunks_block = "\n---\n".join(blocks)

    return (
        f"User question: {question_text}\n\n"
        f"Chunks retrieved from the project knowledge base:\n\n{chunks_block}\n\n"
        "Produce the JSON report according to the schema. All text fields must be in Brazilian Portuguese."
    )
