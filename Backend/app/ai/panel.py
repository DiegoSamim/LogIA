from collections import Counter
from datetime import datetime, timezone
from typing import Any, Callable

PRESENTATION_VERSION = 1


# Mapeia status interno → tom visual (cor).
# Centralizado aqui para consistência com o frontend e com os prompts.
def _tone_for_status(status: str | None) -> str:
    return {
        "done": "success",
        "blocked": "danger",
        "in_progress": "warning",
        "todo": "muted",
        "cancelled": "muted",
    }.get(status or "", "default")


# Mapeia status interno → label em PT-BR para exibição ao usuário.
def _status_label(status: str | None) -> str:
    return {
        "todo": "A fazer",
        "in_progress": "Em andamento",
        "done": "Concluida",
        "blocked": "Bloqueada",
        "cancelled": "Cancelada",
    }.get(status or "", status or "Sem status")


def _source_label(source_type: str | None) -> str:
    return {
        "task_snapshot": "Estado atual",
        "task_update": "Atualização",
    }.get(source_type or "", source_type or "Fontes")


def _update_label(update_type: str | None) -> str:
    return {
        "created": "Criação",
        "progress": "Progresso",
        "status_change": "Mudança de status",
        "completion": "Conclusão",
        "blocker": "Bloqueio",
        "edit": "Edição",
    }.get(update_type or "", update_type or "Update")


def _source_badge(reference: dict[str, Any]) -> str | None:
    source_type = reference.get("source_type")
    update_type = reference.get("update_type")
    if source_type == "task_snapshot":
        return "Estado atual"
    if source_type != "task_update":
        return None
    if update_type == "created":
        return "Criação"
    return "Atualização"


def _extract_label_value(content: str, label: str) -> str | None:
    """Extrai o valor de um campo "Label: valor" dentro do texto de um chunk.
    Os chunks são gerados com formato key:value por _build_task_snapshot_text(),
    então esta função faz o caminho inverso para obter dados estruturados."""
    prefix = f"{label}:"
    for line in content.splitlines():
        stripped = line.strip()
        if stripped.lower().startswith(prefix.lower()):
            value = stripped[len(prefix):].strip()
            return value or None
    return None


def _extract_list_value(content: str, label: str) -> list[str]:
    value = _extract_label_value(content, label)
    if not value:
        return []
    return [item.strip() for item in value.split(",") if item.strip()]


def _parse_datetime(value: Any) -> datetime | None:
    if isinstance(value, datetime):
        parsed = value
    elif isinstance(value, str) and value:
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
    else:
        return None

    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def _days_since(value: Any) -> int:
    parsed = _parse_datetime(value)
    if parsed is None:
        return 0
    return max((datetime.now(timezone.utc) - parsed).days, 0)


def _stale_tone(days: int) -> str:
    if days >= 5:
        return "danger"
    if days >= 3:
        return "warning"
    return "muted"


CRITICAL_CONTEXT_TAGS = {"embeddings", "quota", "api", "database", "infra", "pgvector", "gemini"}


def _severity_from_rank(rank: int) -> tuple[str, str, str]:
    if rank >= 70:
        return "critical", "🔴 Crítico", "danger"
    if rank >= 50:
        return "high", "🟠 Alto", "danger"
    if rank >= 30:
        return "medium", "🟡 Médio", "warning"
    return "low", "⚪ Baixo", "muted"


def _blocker_rank(record: dict[str, Any]) -> int:
    priority_points = {"critical": 40, "high": 30, "medium": 20, "low": 10}.get(record.get("priority") or "", 5)
    days = int(record.get("days_stale") or 0)
    if days >= 7:
        time_points = 30
    elif days >= 5:
        time_points = 25
    elif days >= 3:
        time_points = 15
    elif days >= 1:
        time_points = 8
    else:
        time_points = 0

    context_points = 0
    if record.get("blocked_reason"):
        context_points += 15
    if record.get("next_steps"):
        context_points += 10
    if record.get("updates", Counter()).get("blocker"):
        context_points += 10
    tags = {str(tag).lower() for tag in record.get("tags", Counter()).keys()}
    if tags.intersection(CRITICAL_CONTEXT_TAGS):
        context_points += 5
    return priority_points + time_points + context_points


def _with_criticality(record: dict[str, Any]) -> dict[str, Any]:
    rank = _blocker_rank(record)
    severity, severity_label, tone = _severity_from_rank(rank)
    return {**record, "rank": rank, "severity": severity, "severity_label": severity_label, "tone": tone}


def _technical_risk_count(answer_payload: dict[str, Any], task_records: list[dict[str, Any]]) -> int:
    sections = answer_payload.get("sections") if isinstance(answer_payload.get("sections"), list) else []
    for section in sections:
        if not isinstance(section, dict) or section.get("id") != "technical-risks":
            continue
        items = section.get("items") if isinstance(section.get("items"), list) else []
        return len(items)

    risk_tags = {"gemini", "quota", "embeddings", "pgvector", "reindex", "observability", "logging", "rag", "fallback", "intent-classifier", "llm-router"}
    risk_keys: set[str] = set()
    for record in task_records:
        if record.get("status") == "blocked" or record.get("blocked_reason"):
            risk_keys.add("blocked")
        tags = {str(tag).lower() for tag in record.get("tags", Counter()).keys()}
        risk_keys.update(tags.intersection(risk_tags))
    return len(risk_keys)


def _counter_group(
    *,
    title: str,
    items: Counter[str],
    item_label: Callable[[str], str],
    item_tone: Callable[[str], str] | None = None,
    limit: int = 5,
) -> dict[str, Any] | None:
    """Cria um grupo de distribuição (barras ou lista de contagens) para o painel.
    Retorna None se não houver itens, permitindo que build_query_panel_payload
    filtre grupos vazios com [group for group in groups if group]."""
    if not items:
        return None

    rendered_items = []
    for key, value in items.most_common(limit):
        rendered_items.append(
            {
                "label": item_label(key),
                "value": value,
                "tone": item_tone(key) if item_tone else "default",
            }
        )

    return {
        "title": title,
        "type": "distribution",
        "items": rendered_items,
    }


# Agrupa chunks por tarefa-mãe para evitar dupla contagem de métricas.
# Um único task_id pode ter vários chunks (snapshot + updates); todos
# devem contribuir para o mesmo registro de tarefa no painel.
def _task_key_from_chunk(chunk: Any, metadata: dict[str, Any]) -> str:
    task_id = getattr(chunk, "task_id", None)
    if task_id:
        return str(task_id)
    if metadata.get("task_title"):
        return str(metadata["task_title"])
    return str(getattr(chunk, "id", "unknown-task"))


def _build_task_records(chunks: list[Any]) -> list[dict[str, Any]]:
    """Agrega chunks em registros por tarefa, coletando contadores de
    sources, updates, categorias, tags e prioridades."""
    records_by_task: dict[str, dict[str, Any]] = {}

    for chunk in chunks:
        metadata = getattr(chunk, "chunk_metadata", None) or {}
        key = _task_key_from_chunk(chunk, metadata)
        content = getattr(chunk, "content", "") or ""
        record = records_by_task.setdefault(
            key,
            {
                "task_id": key,
                "title": metadata.get("task_title") or "Tarefa sem titulo",
                "status": metadata.get("task_status") or metadata.get("new_status"),
                "sources": Counter(),
                "updates": Counter(),
                "categories": Counter(),
                "tags": Counter(),
                "priorities": Counter(),
                "hours": 0.0,
                "days_stale": 0,
                "priority": metadata.get("task_priority") or _extract_label_value(content, "Prioridade"),
                "blocked_reason": metadata.get("blocked_reason"),
                "next_steps": metadata.get("next_steps"),
                "what_was_done": metadata.get("what_was_done"),
                "technical_approach": metadata.get("technical_approach"),
            },
        )

        if not record.get("status") and (metadata.get("task_status") or metadata.get("new_status")):
            record["status"] = metadata.get("task_status") or metadata.get("new_status")
        if "stale_seen" not in record:
            stale_source = metadata.get("task_updated_at") or metadata.get("task_created_at")
            record["days_stale"] = _days_since(stale_source)
            record["stale_seen"] = True
        if "hours_seen" not in record:
            hours_value = metadata.get("task_hours") or _extract_label_value(content, "Horas trabalhadas")
            try:
                record["hours"] = float(str(hours_value).replace(",", ".")) if hours_value is not None else 0.0
            except ValueError:
                record["hours"] = 0.0
            record["hours_seen"] = True

        source_type = getattr(chunk, "source_type", None)
        if source_type:
            record["sources"][source_type] += 1
        if metadata.get("update_type"):
            record["updates"][metadata["update_type"]] += 1
        if category := metadata.get("task_category") or _extract_label_value(content, "Categoria"):
            record["categories"][category] = 1
        if priority := metadata.get("task_priority") or _extract_label_value(content, "Prioridade"):
            record["priorities"][priority] = 1
            record["priority"] = priority
        # Filtra tags que são na verdade valores de status para evitar
        # poluição nos grupos de tags técnicas do painel.
        ignored_status_tags = {
            "blocked", "done", "todo", "in_progress", "cancelled",
            "bloqueada", "concluida", "a fazer", "em andamento",
        }
        for tag in _extract_list_value(content, "Tags"):
            if tag.lower() in ignored_status_tags:
                continue
            record["tags"][tag] = 1
        for tag in metadata.get("task_tags") or []:
            if str(tag).lower() in ignored_status_tags:
                continue
            record["tags"][str(tag)] = 1

    return list(records_by_task.values())


def build_query_panel_payload(
    *,
    question_key: str,
    answer_payload: dict[str, Any],
    references: list[dict[str, Any]],
    chunks: list[Any],
    chunks_retrieved: int,
    cited_chunk_ids: list[str] | None = None,
    ai_used: bool = False,
) -> dict[str, Any]:
    """Constrói o payload do painel lateral de indicadores da consulta.

    Este painel é gerado 100% localmente (sem chamadas ao LLM), usando os
    chunks recuperados e as referências do relatório principal. Exibe:
    - summary_metric: o número-título da consulta (ex: "3 Bloqueios")
    - metrics: 2-4 métricas secundárias
    - groups: distribuições de status, updates, categorias, tags, prioridades
    - groups.source_list: lista de fontes principais (tarefas citadas)
    """
    answer_kind = str(answer_payload.get("answer_kind") or question_key.replace("-", "_"))
    sections = answer_payload.get("sections") if isinstance(answer_payload.get("sections"), list) else []
    insights = answer_payload.get("insights") if isinstance(answer_payload.get("insights"), list) else []

    task_records = _build_task_records(chunks)

    source_counter = Counter(
        getattr(chunk, "source_type", None)
        for chunk in chunks
        if getattr(chunk, "source_type", None)
    )
    status_counter = Counter(record.get("status") for record in task_records if record.get("status"))
    update_counter = Counter()
    category_counter = Counter()
    tag_counter = Counter()
    priority_counter = Counter()
    for record in task_records:
        update_counter.update(record["updates"])
        category_counter.update(record["categories"])
        tag_counter.update(record["tags"])
        priority_counter.update(record["priorities"])
    total_tasks = len(task_records)
    total_hours = sum(float(record.get("hours") or 0) for record in task_records)
    max_days_stale = max((int(record.get("days_stale") or 0) for record in task_records), default=0)
    blocker_records = [_with_criticality(record) for record in task_records if record.get("status") == "blocked" or record.get("updates", Counter()).get("blocker")]
    technical_risk_count = _technical_risk_count(answer_payload, task_records)

    panel_kind = {
        "weekly-progress": "weekly_progress",
        "daily-progress": "daily_progress",
        "recorded-blockers": "blockers",
        "technical-summary": "technical_summary",
        "open-tasks": "open_tasks",
    }.get(question_key, answer_kind)

    summary_metric = _summary_metric_for_question(
        question_key=question_key,
        task_count=len(task_records),
        references_count=len(references),
        status_counter=status_counter,
        update_counter=update_counter,
        tag_counter=tag_counter,
    )

    metrics = _metrics_for_question(
        question_key=question_key,
        status_counter=status_counter,
        category_counter=category_counter,
        tag_counter=tag_counter,
        priority_counter=priority_counter,
        task_count=total_tasks,
        total_hours=total_hours,
        max_days_stale=max_days_stale,
        blocker_records=blocker_records,
        technical_risk_count=technical_risk_count,
    )

    chips = _build_chips(
        status_counter=status_counter,
        update_counter=update_counter,
        category_counter=category_counter,
        tag_counter=tag_counter,
        priority_counter=priority_counter,
        answer_kind=answer_kind,
    )

    leading_group = _criticality_group(blocker_records) if question_key == "recorded-blockers" else _counter_group(
        title="Status",
        items=status_counter,
        item_label=_status_label,
        item_tone=_tone_for_status,
    )

    groups = [
        leading_group,
        _distribution_group(
            title="Categorias",
            items=category_counter,
            total=total_tasks,
        ),
        _chip_group(
            title="Stack e tags técnicas",
            items=tag_counter,
            tone="accent",
        ),
        _priority_group(
            title="Prioridades",
            items=priority_counter,
        ),
        _build_source_group(references),
    ]

    return {
        "presentation_version": PRESENTATION_VERSION,
        "panel_kind": panel_kind,
        "title": "Indicadores da consulta",
        "summary_metric": summary_metric,
        "metrics": metrics[:4],
        "chips": chips[:10],
        "groups": [group for group in groups if group],
    }


def _summary_metric_for_question(
    *,
    question_key: str,
    task_count: int,
    references_count: int,
    status_counter: Counter[str],
    update_counter: Counter[str],
    tag_counter: Counter[str],
) -> dict[str, Any]:
    """Métrica principal exibida em destaque no painel, calculada localmente."""
    if question_key == "recorded-blockers":
        blocked = status_counter.get("blocked", 0)
        return {"label": "Bloqueios", "value": str(blocked), "tone": "danger" if blocked else "success"}
    if question_key == "open-tasks":
        open_count = sum(value for key, value in status_counter.items() if key not in {"done", "cancelled"})
        return {"label": "Abertas", "value": str(open_count or task_count), "tone": "warning"}
    if question_key == "technical-summary":
        return {"label": "Tarefas", "value": str(task_count or references_count), "tone": "accent"}
    return {"label": "Tarefas tocadas", "value": str(task_count or references_count), "tone": "success"}


def _metrics_for_question(
    *,
    question_key: str,
    status_counter: Counter[str],
    category_counter: Counter[str],
    tag_counter: Counter[str],
    priority_counter: Counter[str],
    task_count: int,
    total_hours: float,
    max_days_stale: int,
    blocker_records: list[dict[str, Any]],
    technical_risk_count: int,
) -> list[dict[str, Any]]:
    """Métricas secundárias fixas, sem repetir a tabela de status."""
    if question_key == "recorded-blockers":
        high_count = sum(1 for record in blocker_records if record.get("severity") in {"critical", "high"})
        max_blocked = max((int(record.get("days_stale") or 0) for record in blocker_records), default=0)
        return [
            {"label": "Criticidade alta", "value": high_count, "tone": "danger" if high_count else "success"},
            {"label": "Maior tempo bloqueado", "value": f"{max_blocked}d", "tone": _stale_tone(max_blocked)},
            {"label": "Total de horas", "value": _format_hours(total_hours), "tone": "accent"},
        ]

    if question_key == "open-tasks":
        return [
            {"label": "Total de horas", "value": _format_hours(total_hours), "tone": "accent"},
            {"label": "Maior tempo parada", "value": f"{max_days_stale}d", "tone": _stale_tone(max_days_stale)},
            {"label": "Bloqueios ativos", "value": status_counter.get("blocked", 0), "tone": "danger" if status_counter.get("blocked", 0) else "success"},
        ]

    if question_key == "technical-summary":
        completion_rate = round((status_counter.get("done", 0) / task_count) * 100) if task_count else 0
        return [
            {"label": "Total de horas", "value": _format_hours(total_hours), "tone": "accent"},
            {"label": "Taxa de conclusão", "value": f"{completion_rate}%", "tone": "success" if completion_rate >= 50 else "warning"},
            {"label": "Riscos identificados", "value": technical_risk_count, "tone": "warning" if technical_risk_count else "success"},
        ]

    completion_rate = round((status_counter.get("done", 0) / task_count) * 100) if task_count else 0
    return [
        {"label": "Total de horas", "value": _format_hours(total_hours), "tone": "accent"},
        {"label": "Taxa de conclusão", "value": f"{completion_rate}%", "tone": "success" if completion_rate >= 50 else "warning"},
        {"label": "Bloqueios ativos", "value": status_counter.get("blocked", 0), "tone": "danger" if status_counter.get("blocked", 0) else "success"},
    ]


def _format_hours(hours: float) -> str:
    if hours == 0:
        return "0h"
    if float(hours).is_integer():
        return f"{int(hours)}h"
    return f"{hours:.1f}h".replace(".", ",")


def _distribution_group(
    *,
    title: str,
    items: Counter[str],
    total: int,
    limit: int = 5,
) -> dict[str, Any] | None:
    if not items:
        return None

    return {
        "title": title,
        "type": "distribution",
        "items": [
            {
                "label": key,
                "value": value,
                "percent": round((value / total) * 100) if total else 0,
                "tone": "default",
            }
            for key, value in items.most_common(limit)
        ],
    }


def _criticality_group(records: list[dict[str, Any]]) -> dict[str, Any] | None:
    if not records:
        return None
    severity_order = [
        ("critical", "🔴 Crítico", "danger"),
        ("high", "🟠 Alto", "danger"),
        ("medium", "🟡 Médio", "warning"),
        ("low", "⚪ Baixo", "muted"),
    ]
    counts = Counter(str(record.get("severity") or "low") for record in records)
    return {
        "title": "Criticidade",
        "type": "distribution",
        "items": [
            {
                "label": label,
                "value": counts.get(key, 0),
                "tone": tone,
            }
            for key, label, tone in severity_order
            if counts.get(key, 0)
        ],
    }


def _build_chips(
    *,
    status_counter: Counter[str],
    update_counter: Counter[str],
    category_counter: Counter[str],
    tag_counter: Counter[str],
    priority_counter: Counter[str],
    answer_kind: str,
) -> list[dict[str, Any]]:
    # Reservado para chips de filtro futuros. Retorna lista vazia por enquanto.
    return []


def _chip_group(
    *,
    title: str,
    items: Counter[str],
    tone: str,
    limit: int = 8,
) -> dict[str, Any] | None:
    """Grupo de tags visuais (pills) para stack técnica e prioridades."""
    if not items:
        return None

    return {
        "title": title,
        "type": "tag_list",
        "items": [
            {
                "label": key,
                "value": value,
                "tone": tone,
            }
            for key, value in items.most_common(limit)
        ],
    }


def _priority_group(*, title: str, items: Counter[str]) -> dict[str, Any] | None:
    if not items:
        return None

    order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    sorted_items = sorted(items.items(), key=lambda entry: (order.get(entry[0], 99), entry[0]))
    return {
        "title": title,
        "type": "tag_list",
        "items": [
            {
                "label": key,
                "value": value,
                "tone": "danger" if key == "critical" else "warning" if key in {"high", "medium"} else "success" if key == "low" else "default",
            }
            for key, value in sorted_items
        ],
    }


def _build_source_group(references: list[dict[str, Any]]) -> dict[str, Any] | None:
    """Constrói o grupo de fontes principais: lista compacta das tarefas
    citadas, deduplicada por task_id para exibir no máximo 5 fontes únicas."""
    if not references:
        return None

    unique_references: list[dict[str, Any]] = []
    seen_tasks: set[str] = set()
    for reference in references:
        key = str(reference.get("task_id") or reference.get("task_title") or reference.get("chunk_id") or reference.get("id"))
        if key in seen_tasks:
            continue
        seen_tasks.add(key)
        unique_references.append(reference)
        if len(unique_references) >= 5:
            break

    return {
        "title": "Fontes principais",
        "type": "source_list",
        "items": [
            {
                "label": reference.get("task_title") or "Fonte",
                "value": _source_badge(reference),
                "tone": _tone_for_status(reference.get("task_status")),
                "preview": reference.get("preview"),
                "task_id": reference.get("task_id"),
                "source_type": reference.get("source_type"),
                "update_type": reference.get("update_type"),
                "source_label": _source_badge(reference),
            }
            for reference in unique_references
        ],
    }
