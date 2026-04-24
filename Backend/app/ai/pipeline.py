import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import cast, or_, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.prompts import SYSTEM_PROMPTS_BY_QUESTION, build_user_prompt
from app.ai.panel import build_query_panel_payload
from app.ai.providers.base import AIProviderError
from app.ai.registry import get_embedding_provider, get_llm_provider
from app.ai.schema import AIAnswerDraft, to_payload_dict
from app.core.config import get_settings
from app.core.utils import APP_TIMEZONE, STATUS_LABELS, truncate, today_bounds_utc
from app.models.knowledge import KnowledgeChunk
from app.models.task import Task

logger = logging.getLogger(__name__)

# Constantes espelhadas de knowledge_service para evitar importação circular.
TASK_SNAPSHOT_SOURCE = "task_snapshot"
TASK_UPDATE_SOURCE = "task_update"

# Aliases locais para manter assinaturas internas
_truncate = truncate
_today_bounds_utc = today_bounds_utc


def _chunk_to_prompt_dict(
    chunk: KnowledgeChunk,
    task_lookup: dict[uuid.UUID, Task] | None = None,
) -> dict[str, Any]:
    """Converte um KnowledgeChunk para o formato que build_user_prompt espera.
    O campo 'id' é essencial: o Gemini usa esses UUIDs em cited_chunk_ids.
    O campo 'updated_at' permite ao LLM ordenar eventos e calcular dias bloqueados."""
    metadata = dict(chunk.chunk_metadata or {})
    task = task_lookup.get(chunk.task_id) if task_lookup and chunk.task_id else None
    if task:
        metadata["task_title"] = task.title
        metadata["task_status"] = task.status
        metadata["task_category"] = task.category
        metadata["task_priority"] = task.priority
        metadata["task_updated_at"] = task.updated_at.isoformat() if task.updated_at else None
        metadata["task_created_at"] = task.created_at.isoformat() if task.created_at else None

    return {
        "id": str(chunk.id),
        "content": chunk.content,
        "metadata": metadata,
        "source_type": chunk.source_type,
        "updated_at": (
            task.updated_at.isoformat()
            if task and task.updated_at
            else chunk.updated_at.isoformat()
            if chunk.updated_at
            else None
        ),
    }


def _task_key(chunk: KnowledgeChunk) -> str:
    """Chave única de deduplicação por tarefa.
    Prioriza task_id (UUID estável) e cai para task_title como fallback
    para chunks que perderam a referência por SET NULL."""
    metadata = chunk.chunk_metadata or {}
    if chunk.task_id:
        return str(chunk.task_id)
    if metadata.get("task_title"):
        return str(metadata["task_title"])
    return str(chunk.id)


def _dedupe_chunks_by_task(chunks: list[KnowledgeChunk], limit: int) -> list[KnowledgeChunk]:
    """Remove chunks duplicados da mesma tarefa, mantendo o primeiro encontrado.
    Reduz o contexto enviado ao LLM sem perder cobertura de tarefas únicas."""
    deduped: list[KnowledgeChunk] = []
    seen: set[str] = set()

    for chunk in chunks:
        key = _task_key(chunk)
        if key in seen:
            continue
        seen.add(key)
        deduped.append(chunk)
        if len(deduped) >= limit:
            break

    return deduped


def _extract_label_value(content: str, label: str) -> str | None:
    """Extrai valor de linhas no formato "Label: valor" dentro do conteúdo
    de um chunk. Usado para recuperar Proximos passos em open-tasks."""
    prefix = f"{label}:"
    for line in content.splitlines():
        stripped = line.strip()
        if stripped.lower().startswith(prefix.lower()):
            value = stripped[len(prefix):].strip()
            return value or None
    return None


async def _load_task_lookup(db: AsyncSession, chunks: list[KnowledgeChunk]) -> dict[uuid.UUID, Task]:
    task_ids = {chunk.task_id for chunk in chunks if chunk.task_id}
    if not task_ids:
        return {}
    result = await db.execute(select(Task).where(Task.id.in_(task_ids)))
    return {task.id: task for task in result.scalars().all()}


def _enrich_chunks_with_task_metadata(
    chunks: list[KnowledgeChunk],
    task_lookup: dict[uuid.UUID, Task],
) -> None:
    for chunk in chunks:
        if not chunk.task_id:
            continue
        task = task_lookup.get(chunk.task_id)
        if not task:
            continue
        metadata = dict(chunk.chunk_metadata or {})
        metadata["task_title"] = task.title
        metadata["task_status"] = task.status
        metadata["task_category"] = task.category
        metadata["task_priority"] = task.priority
        metadata["task_hours"] = task.hours_worked
        metadata["task_created_at"] = task.created_at.isoformat() if task.created_at else None
        metadata["task_updated_at"] = task.updated_at.isoformat() if task.updated_at else None
        metadata["blocked_reason"] = task.blocked_reason
        metadata["next_steps"] = task.next_steps
        metadata["what_was_done"] = task.what_was_done
        metadata["technical_approach"] = task.technical_approach
        metadata["task_tags"] = task.tags or []
        chunk.chunk_metadata = metadata


def _chunk_reference(chunk: KnowledgeChunk) -> dict[str, Any]:
    """Constrói o dict de referência que o frontend exibe no rodapé.
    Inclui preview truncado do conteúdo para mostrar ao usuário
    sem expor o chunk completo."""
    metadata = chunk.chunk_metadata or {}
    return {
        "id": str(chunk.id),
        "chunk_id": str(chunk.id),
        "task_id": str(chunk.task_id) if chunk.task_id else None,
        "task_update_id": str(chunk.task_update_id) if chunk.task_update_id else None,
        "source_type": chunk.source_type,
        "task_title": metadata.get("task_title"),
        "task_status": metadata.get("task_status"),
        "update_type": metadata.get("update_type"),
        "preview": _truncate(chunk.content, limit=220),
    }


def _build_references(
    chunks: list[KnowledgeChunk],
    cited_chunk_ids: list[str],
    limit: int = 8,
) -> list[dict[str, Any]]:
    """Monta a lista de referências do relatório a partir dos IDs citados
    pelo Gemini. A estratégia em dois passos garante que:
    1. Fontes que o Gemini usou aparecem primeiro (ordenadas por relevância do LLM).
    2. Se o Gemini não citou o suficiente, completamos com os chunks restantes.
    3. IDs inventados pelo Gemini são silenciosamente ignorados — segurança
       contra alucinação de referências inexistentes."""
    chunk_by_id = {str(chunk.id): chunk for chunk in chunks}

    references: list[dict[str, Any]] = []
    seen: set[str] = set()

    # Primeiro: chunks explicitamente citados pelo Gemini
    for cited in cited_chunk_ids:
        chunk = chunk_by_id.get(cited)
        if not chunk:
            continue  # ID inventado → ignora
        key = _task_key(chunk) if chunk.task_id else cited
        if key in seen:
            continue
        seen.add(key)
        references.append(_chunk_reference(chunk))
        if len(references) >= limit:
            return references

    # Segundo: completa com os demais chunks até o limite
    for chunk in chunks:
        key = _task_key(chunk) if chunk.task_id else str(chunk.id)
        if key in seen:
            continue
        seen.add(key)
        references.append(_chunk_reference(chunk))
        if len(references) >= limit:
            break

    return references


def _open_task_counts(chunks: list[KnowledgeChunk]) -> tuple[dict[str, int], list[dict[str, Any]]]:
    """Agrega contagens de status e lista de tarefas abertas a partir dos chunks.
    Usado por _normalize_open_tasks_payload para corrigir possíveis imprecisões
    do LLM no campo de insights de open_tasks."""
    counts = {"blocked": 0, "in_progress": 0, "todo": 0}
    tasks_by_key: dict[str, dict[str, Any]] = {}

    for chunk in chunks:
        key = _task_key(chunk)
        metadata = chunk.chunk_metadata or {}
        status_value = metadata.get("task_status")
        content = chunk.content or ""
        task = tasks_by_key.setdefault(
            key,
            {
                "title": metadata.get("task_title") or "Tarefa sem titulo",
                "status": status_value,
                "status_label": {
                    "todo": "A fazer",
                    "in_progress": "Em andamento",
                    "blocked": "Bloqueada",
                }.get(status_value or "", status_value or "Sem status"),
                "next_steps": None,
            },
        )
        if not task.get("status") and status_value:
            task["status"] = status_value
        if not task.get("next_steps"):
            task["next_steps"] = _extract_label_value(content, "Proximos passos")

    tasks = list(tasks_by_key.values())
    for task in tasks:
        status_value = task.get("status")
        if status_value in counts:
            counts[status_value] += 1

    return counts, tasks


def _aware_datetime(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _days_since(value: datetime | None) -> int:
    date_value = _aware_datetime(value)
    if date_value is None:
        return 0
    delta = datetime.now(timezone.utc) - date_value
    return max(delta.days, 0)


def _priority_rank(priority: str | None) -> int:
    return {"critical": 0, "high": 1, "medium": 2, "low": 3}.get(priority or "", 99)


def _task_context_rank(task: Task) -> int:
    if task.blocked_reason:
        return 0
    if task.next_steps:
        return 1
    if task.what_was_done:
        return 2
    return 3


def _open_task_infos(
    chunks: list[KnowledgeChunk],
    task_lookup: dict[uuid.UUID, Task],
) -> list[dict[str, Any]]:
    tasks_by_id: dict[uuid.UUID, Task] = {}
    for chunk in chunks:
        if not chunk.task_id:
            continue
        task = task_lookup.get(chunk.task_id)
        if not task or task.status in {"done", "cancelled"}:
            continue
        tasks_by_id[task.id] = task

    infos: list[dict[str, Any]] = []
    for task in tasks_by_id.values():
        days_stale = _days_since(task.updated_at or task.created_at)
        infos.append(
            {
                "task": task,
                "days_stale": days_stale,
                "title": task.title,
                "status": task.status,
                "status_label": STATUS_LABELS.get(task.status, task.status or "Sem status"),
                "next_steps": task.next_steps,
            }
        )
    return infos


def _open_task_alert_items(task_infos: list[dict[str, Any]]) -> list[dict[str, Any]]:
    thresholds = [
        (1, "sem update há +1 dia", "default"),
        (3, "sem update há +3 dias", "warning"),
        (5, "parada há +5 dias", "danger"),
    ]
    items: list[dict[str, Any]] = []
    for threshold, label, tone in thresholds:
        count = sum(1 for info in task_infos if int(info.get("days_stale") or 0) >= threshold)
        if not count:
            continue
        task_word = "tarefa" if count == 1 else "tarefas"
        items.append({"text": f"{count} {task_word} {label}", "tone": tone})
    if not items:
        items.append({"text": "As tarefas abertas possuem updates recentes.", "tone": "success"})
    return items


def _critical_open_task(task_infos: list[dict[str, Any]]) -> Task | None:
    if not task_infos:
        return None
    selected = sorted(
        task_infos,
        key=lambda info: (
            _priority_rank(getattr(info["task"], "priority", None)),
            -int(info.get("days_stale") or 0),
            _task_context_rank(info["task"]),
        ),
    )[0]
    return selected["task"]


def _critical_task_suggestion(task: Task | None) -> str | None:
    if not task:
        return None

    title = task.title
    next_steps = _truncate(task.next_steps, limit=180)
    blocked_reason = _truncate(task.blocked_reason, limit=180)
    what_was_done = _truncate(task.what_was_done, limit=180)

    if task.status == "blocked":
        reason = blocked_reason or "o bloqueio ainda precisa ser detalhado"
        action = next_steps or "validar o bloqueio em um escopo menor e registrar o resultado antes de avançar"
        return f"Priorize {title}: o bloqueio registrado é {reason}. Próximo passo recomendado: {action}."

    if task.status == "todo":
        action = next_steps or what_was_done or "definir o primeiro entregável pequeno e registrar um update inicial"
        return f"Comece por {title}: transforme a pendência em uma primeira ação concreta, como {action}."

    if task.status == "in_progress":
        action = next_steps or what_was_done or "registrar o ponto atual e escolher a menor etapa que reduza incerteza"
        return f"Foque em {title}: execute {action} e registre um update para deixar claro o que mudou."

    action = next_steps or blocked_reason or what_was_done
    if action:
        return f"Revise {title}: o caminho mais concreto agora é {action}."
    return f"Revise {title}: falta registrar um próximo passo específico para destravar a continuidade."


CRITICAL_CONTEXT_TAGS = {"embeddings", "quota", "api", "database", "infra", "pgvector", "gemini"}
TECHNICAL_RISK_TAGS = {
    "gemini", "quota", "embeddings", "pgvector", "reindex", "observability",
    "logging", "rag", "fallback", "intent-classifier", "llm-router",
}


def _severity_from_rank(rank: int) -> tuple[str, str, str]:
    if rank >= 70:
        return "critical", "🔴 Crítico", "danger"
    if rank >= 50:
        return "high", "🟠 Alto", "danger"
    if rank >= 30:
        return "medium", "🟡 Médio", "warning"
    return "low", "⚪ Baixo", "muted"


def _stale_tone(days: int) -> str:
    if days >= 5:
        return "danger"
    if days >= 3:
        return "warning"
    return "muted"


def _blocker_rank(task: Task, days_blocked: int, chunks: list[KnowledgeChunk]) -> int:
    priority_points = {"critical": 40, "high": 30, "medium": 20, "low": 10}.get(task.priority or "", 5)
    if days_blocked >= 7:
        time_points = 30
    elif days_blocked >= 5:
        time_points = 25
    elif days_blocked >= 3:
        time_points = 15
    elif days_blocked >= 1:
        time_points = 8
    else:
        time_points = 0

    context_points = 0
    if task.blocked_reason:
        context_points += 15
    if task.next_steps:
        context_points += 10
    if any((chunk.chunk_metadata or {}).get("update_type") == "blocker" for chunk in chunks):
        context_points += 10
    tags = {tag.lower() for tag in (task.tags or [])}
    if tags.intersection(CRITICAL_CONTEXT_TAGS):
        context_points += 5
    return priority_points + time_points + context_points


def _append_unique(items: list[str], value: str | None, *, limit: int = 140) -> None:
    text = _truncate(value, limit=limit)
    if text and text not in items:
        items.append(text)


def _blocker_causes(task: Task, chunks: list[KnowledgeChunk]) -> list[str]:
    causes: list[str] = []
    _append_unique(causes, task.blocked_reason)
    for chunk in chunks:
        metadata = chunk.chunk_metadata or {}
        if metadata.get("update_type") != "blocker":
            continue
        content = chunk.content or ""
        _append_unique(causes, _extract_label_value(content, "Resumo"), limit=150)
        _append_unique(causes, _extract_label_value(content, "Detalhes"), limit=150)
    if not causes and task.technical_approach:
        _append_unique(causes, task.technical_approach, limit=150)
    if not causes:
        causes.append("Bloqueio registrado sem causa detalhada no histórico.")
    return causes[:3]


def _blocker_impacts(task: Task) -> list[str]:
    tags = {tag.lower() for tag in (task.tags or [])}
    impacts: list[str] = []
    if tags.intersection({"embeddings", "pgvector", "reindex"}):
        impacts.append("Pode gerar inconsistência na busca semântica.")
    if tags.intersection({"gemini", "api", "quota"}):
        impacts.append("Afeta chamadas externas e a estabilidade das respostas com IA.")
    if task.category == "infra":
        impacts.append("Afeta a infraestrutura necessária para o fluxo continuar com segurança.")
    if task.what_was_done:
        _append_unique(impacts, task.what_was_done, limit=150)
    if not impacts:
        impacts.append("Impede a continuidade da tarefa até que a causa seja validada.")
    return impacts[:3]


def _blocker_actions(task: Task, causes: list[str]) -> list[str]:
    if task.next_steps:
        return [_truncate(task.next_steps, limit=180)]
    if causes:
        return [f"Validar em menor escopo: {causes[0]}"]
    return ["Registrar a causa do bloqueio, validar o menor teste possível e definir o próximo passo."]


def _blocker_infos(
    chunks: list[KnowledgeChunk],
    task_lookup: dict[uuid.UUID, Task],
) -> list[dict[str, Any]]:
    chunks_by_task: dict[uuid.UUID, list[KnowledgeChunk]] = {}
    for chunk in chunks:
        if not chunk.task_id:
            continue
        task = task_lookup.get(chunk.task_id)
        if not task:
            continue
        metadata = chunk.chunk_metadata or {}
        is_blocker = task.status == "blocked" or metadata.get("update_type") == "blocker"
        if not is_blocker:
            continue
        chunks_by_task.setdefault(task.id, []).append(chunk)

    infos: list[dict[str, Any]] = []
    for task_id, task_chunks in chunks_by_task.items():
        task = task_lookup[task_id]
        days_blocked = _days_since(task.updated_at or task.created_at)
        rank = _blocker_rank(task, days_blocked, task_chunks)
        severity, severity_label, tone = _severity_from_rank(rank)
        causes = _blocker_causes(task, task_chunks)
        impacts = _blocker_impacts(task)
        actions = _blocker_actions(task, causes)
        infos.append(
            {
                "task": task,
                "chunks": task_chunks,
                "days_blocked": days_blocked,
                "rank": rank,
                "severity": severity,
                "severity_label": severity_label,
                "tone": tone,
                "causes": causes,
                "impacts": impacts,
                "actions": actions,
            }
        )
    return sorted(infos, key=lambda item: (-item["rank"], -item["days_blocked"], item["task"].title))


def _normalize_blockers_payload(
    payload: dict[str, Any],
    chunks: list[KnowledgeChunk],
    task_lookup: dict[uuid.UUID, Task],
) -> dict[str, Any]:
    blocker_infos = _blocker_infos(chunks, task_lookup)
    if not blocker_infos:
        return payload

    critical_info = blocker_infos[0]
    high_count = sum(1 for info in blocker_infos if info["severity"] in {"critical", "high"})
    max_days = max(info["days_blocked"] for info in blocker_infos)

    blocker_items = []
    action_items = []
    timeline_items = []
    for index, info in enumerate(blocker_infos, start=1):
        task = info["task"]
        blocker_items.append(
            {
                "id": str(task.id),
                "title": task.title,
                "status": task.status,
                "status_label": STATUS_LABELS.get(task.status, task.status),
                "tone": info["tone"],
                "causes": info["causes"],
                "impacts": info["impacts"],
                "actions": info["actions"],
                "days_blocked": info["days_blocked"],
                "severity": info["severity"],
                "severity_label": info["severity_label"],
                "summary": info["actions"][0] if info["actions"] else None,
            }
        )
        action_items.append(
            {
                "title": f"{index}. {task.title}",
                "description": info["actions"][0] if info["actions"] else "Definir ação de destravamento.",
                "value": info["severity_label"],
                "tone": info["tone"],
                "status": task.status,
                "status_label": STATUS_LABELS.get(task.status, task.status),
            }
        )
        blocker_updates = [
            chunk for chunk in info["chunks"]
            if (chunk.chunk_metadata or {}).get("update_type") == "blocker"
        ]
        for chunk in blocker_updates[:2]:
            timeline_items.append(
                {
                    "title": task.title,
                    "description": _chunk_event_description(chunk, task),
                    "badge": task.category,
                    "eyebrow": chunk.updated_at.isoformat() if chunk.updated_at else None,
                    "label": info["severity_label"],
                    "value": f"{info['days_blocked']}d",
                    "status": task.status,
                    "status_label": STATUS_LABELS.get(task.status, task.status),
                    "tone": info["tone"],
                }
            )

    normalized = dict(payload)
    normalized["title"] = "Relatório de Bloqueios"
    normalized["summary"] = (
        f"O sistema está travado por {len(blocker_infos)} bloqueio(s). "
        f"O bloqueio mais crítico é \"{critical_info['task'].title}\", "
        f"com nível {critical_info['severity_label']} e {critical_info['days_blocked']} dia(s) bloqueado."
    )
    normalized["insights"] = [
        {"label": "Bloqueios", "value": str(len(blocker_infos)), "tone": "danger", "icon_key": "alert"},
        {"label": "Mais crítico", "value": critical_info["task"].title, "tone": critical_info["tone"], "icon_key": "alert"},
        {"label": "Criticidade alta", "value": str(high_count), "tone": "danger" if high_count else "success", "icon_key": "spark"},
        {"label": "Maior tempo", "value": f"{max_days}d", "tone": _stale_tone(max_days), "icon_key": "clock"},
    ]
    sections = [
        {
            "id": "blocker-cards",
            "type": "blocker_cards",
            "title": "Tarefas com bloqueios",
            "subtitle": "Causa, impacto, tempo bloqueado e ação concreta para destravar.",
            "items": blocker_items,
            "collapsed": len(blocker_items) > 5,
            "accent": "danger",
        },
        {
            "id": "blocker-action-plan",
            "type": "status_list",
            "title": "Plano de ação e priorização",
            "subtitle": "Resolva primeiro os bloqueios de nível mais alto.",
            "items": action_items,
            "accent": "warning",
        },
    ]
    if timeline_items:
        sections.append(
            {
                "id": "blocker-timeline",
                "type": "timeline",
                "title": "Histórico dos bloqueios",
                "items": timeline_items,
                "collapsed": len(timeline_items) > 5,
                "accent": "danger",
            }
        )
    normalized["sections"] = sections
    normalized["validation"] = {
        "blockers_total": len(blocker_infos),
        "high_criticality_count": high_count,
        "max_days_blocked": max_days,
        "critical_task_id": str(critical_info["task"].id),
        "normalized_by_backend": True,
    }
    return normalized


def _unique_tasks_from_chunks(
    chunks: list[KnowledgeChunk],
    task_lookup: dict[uuid.UUID, Task],
) -> list[Task]:
    tasks_by_id: dict[uuid.UUID, Task] = {}
    for chunk in chunks:
        if chunk.task_id and chunk.task_id in task_lookup:
            tasks_by_id[chunk.task_id] = task_lookup[chunk.task_id]
    return list(tasks_by_id.values())


def _task_tag_set(tasks: list[Task]) -> set[str]:
    tags: set[str] = set()
    for task in tasks:
        tags.update(str(tag).lower() for tag in (task.tags or []))
        tags.add((task.category or "").lower())
        if task.title:
            lowered = task.title.lower()
            for marker in TECHNICAL_RISK_TAGS:
                if marker in lowered:
                    tags.add(marker)
    return tags


def _technical_risks(tasks: list[Task]) -> tuple[list[str], list[str]]:
    tags = _task_tag_set(tasks)
    blocked_tasks = [task for task in tasks if task.status == "blocked" or task.blocked_reason]
    open_tasks = [task for task in tasks if task.status in {"todo", "in_progress", "blocked"}]

    risks: list[str] = []
    impacts: list[str] = []
    if tags.intersection({"gemini", "quota", "api"}):
        risks.append("Dependência forte da API Gemini, incluindo quota e estabilidade.")
        impacts.append("Pode afetar disponibilidade, latência e previsibilidade das respostas com IA.")
    if tags.intersection({"embeddings", "pgvector", "reindex", "rag"}):
        risks.append("Possível inconsistência entre embeddings antigos e novos na base vetorial.")
        impacts.append("Pode degradar a qualidade da busca semântica e das respostas recuperadas.")
    if tags.intersection({"observability", "logging"}) or any("observabilidade" in task.title.lower() for task in tasks):
        risks.append("Falta de observabilidade completa no pipeline de consulta e geração.")
        impacts.append("Dificulta debugging, medição de qualidade e evolução segura do sistema.")
    if tags.intersection({"fallback", "intent-classifier", "llm-router"}):
        risks.append("Roteamento de intenção ainda em evolução, com risco de fallback excessivo para LLM.")
        impacts.append("Pode reduzir previsibilidade das consultas e aumentar dependência da interpretação do modelo.")
    if blocked_tasks:
        risks.append(f"{len(blocked_tasks)} tarefa(s) técnica(s) com bloqueio ou impedimento registrado.")
    if open_tasks:
        impacts.append("Parte da maturidade técnica ainda depende da conclusão das tarefas abertas.")

    return risks[:5], impacts[:5]


def _technical_next_steps(tasks: list[Task], risks: list[str]) -> list[str]:
    tags = _task_tag_set(tasks)
    steps: list[str] = []
    if tags.intersection({"embeddings", "pgvector", "reindex", "rag"}):
        steps.append("Finalizar reindexação e validação dos embeddings como base do RAG.")
    if tags.intersection({"intent-classifier", "llm-router", "fallback"}):
        steps.append("Evoluir roteador de intenção para reduzir fallback e melhorar previsibilidade.")
    if tags.intersection({"observability", "logging"}) or any("observabilidade" in task.title.lower() for task in tasks):
        steps.append("Implementar observabilidade completa do pipeline de consulta.")
    steps.append("Refinar a qualidade das respostas usando dados reais de uso e novas execuções.")

    deduped: list[str] = []
    for step in steps:
        if step not in deduped:
            deduped.append(step)
    return deduped[:4]


def _technical_maturity(tasks: list[Task], risks: list[str]) -> str:
    if not tasks:
        return "Inicial"
    done_count = sum(1 for task in tasks if task.status == "done")
    blocked_count = sum(1 for task in tasks if task.status == "blocked")
    completion_rate = done_count / len(tasks)
    if completion_rate >= 0.7 and blocked_count == 0 and len(risks) <= 1:
        return "Avançado"
    if completion_rate >= 0.3 or done_count > 0:
        return "Intermediário"
    return "Inicial"


def _technical_bottleneck(tasks: list[Task], risks: list[str]) -> str:
    tags = _task_tag_set(tasks)
    if tags.intersection({"embeddings", "pgvector", "reindex", "rag"}):
        return "consistência da base vetorial"
    if tags.intersection({"observability", "logging"}):
        return "observabilidade do pipeline"
    if tags.intersection({"intent-classifier", "llm-router", "fallback"}):
        return "roteamento de intenção"
    if tags.intersection({"gemini", "quota", "api"}):
        return "dependência de provider externo"
    if risks:
        return risks[0].rstrip(".").lower()
    return "evolução contínua da qualidade técnica"


def _normalize_technical_payload(
    payload: dict[str, Any],
    chunks: list[KnowledgeChunk],
    task_lookup: dict[uuid.UUID, Task],
) -> dict[str, Any]:
    tasks = _unique_tasks_from_chunks(chunks, task_lookup)
    if not tasks and not chunks:
        return payload

    risks, impacts = _technical_risks(tasks)
    next_steps = _technical_next_steps(tasks, risks)
    maturity = _technical_maturity(tasks, risks)
    bottleneck = _technical_bottleneck(tasks, risks)
    if not risks:
        impacts = ["Nenhum risco técnico relevante foi identificado no contexto recuperado."]

    normalized = dict(payload)
    normalized["title"] = "Resumo técnico do projeto"
    normalized["summary"] = (
        f"O projeto está em estágio {maturity.lower()} de maturidade técnica, "
        f"com {len(tasks)} tarefa(s) analisada(s) e {len(risks)} risco(s) técnico(s) mapeado(s)."
    )
    risk_context = (
        "Os principais riscos ainda estão concentrados nos componentes que sustentam a confiabilidade do agente."
        if risks
        else "O contexto recuperado não aponta riscos técnicos relevantes neste momento."
    )
    executive_text = (
        f"A base técnica já saiu do estágio experimental: há um pipeline funcional e tarefas importantes concluídas. "
        f"A maturidade ainda é {maturity.lower()} porque a evolução depende de estabilizar o ponto mais sensível do sistema. "
        f"{risk_context}"
    )

    existing_sections = normalized.get("sections") if isinstance(normalized.get("sections"), list) else []
    # Preserva apenas rich_text e task_cards gerados pelo Gemini.
    # Filtrando por type (não por id) para evitar que seções do Gemini com IDs
    # diferentes dos esperados coexistam com as seções normalizadas abaixo.
    _REPLACED_TYPES = {"bullet_list", "executive_summary"}
    preserved_sections = [
        s for s in existing_sections
        if isinstance(s, dict) and s.get("type") not in _REPLACED_TYPES
    ]

    generated_sections: list[dict[str, Any]] = []
    if risks:
        generated_sections.append(
            {
                "id": "technical-risks",
                "type": "bullet_list",
                "title": "Riscos identificados",
                "items": [{"text": risk, "tone": "warning"} for risk in risks],
                "accent": "warning",
            }
        )
    generated_sections.extend(
        [
            {
                "id": "technical-impact",
                "type": "bullet_list",
                "title": "Impacto",
                "items": [{"text": impact, "tone": "danger" if risks else "success"} for impact in impacts],
                "accent": "danger" if risks else "success",
            },
            {
                "id": "technical-strategic-next-steps",
                "type": "bullet_list",
                "title": "Próximos passos estratégicos",
                "items": [{"text": f"{index}. {step}", "tone": "accent"} for index, step in enumerate(next_steps, start=1)],
                "accent": "accent",
            },
            {
                "id": "technical-executive-summary",
                "type": "executive_summary",
                "title": "",
                "items": [
                    {
                        "content": executive_text,
                        "maturity_label": maturity,
                        "bottleneck": bottleneck,
                        "recommendation": next_steps[0] if next_steps else None,
                        "tone": "warning" if risks else "success",
                    }
                ],
                "accent": "warning" if risks else "success",
            },
        ]
    )

    normalized["sections"] = [*preserved_sections, *generated_sections]
    normalized["validation"] = {
        "technical_task_count": len(tasks),
        "technical_risk_count": len(risks),
        "technical_maturity": maturity,
        "technical_bottleneck": bottleneck,
        "normalized_by_backend": True,
    }
    return normalized


def _normalize_open_tasks_payload(
    payload: dict[str, Any],
    chunks: list[KnowledgeChunk],
    task_lookup: dict[uuid.UUID, Task],
) -> dict[str, Any]:
    """Pós-processa o payload de open_tasks para garantir que insights e
    task_cards reflitam os dados reais do banco, não apenas a interpretação
    do Gemini. Corrige casos onde o LLM erra a contagem ou agrupa status."""
    task_infos = _open_task_infos(chunks, task_lookup)
    counts, tasks = _open_task_counts(chunks)
    if task_infos:
        counts = {"blocked": 0, "in_progress": 0, "todo": 0}
        tasks = []
        for info in task_infos:
            status_value = info.get("status")
            if status_value in counts:
                counts[status_value] += 1
            tasks.append(
                {
                    "title": info["title"],
                    "status": status_value,
                    "status_label": info["status_label"],
                    "next_steps": info.get("next_steps"),
                }
            )
    total = sum(counts.values())
    if total == 0:
        return payload

    alert_items = _open_task_alert_items(task_infos)
    critical_task = _critical_open_task(task_infos)
    critical_suggestion = _critical_task_suggestion(critical_task)

    parts: list[str] = []
    if counts["blocked"]:
        parts.append(f"{counts['blocked']} bloqueada(s)")
    if counts["in_progress"]:
        parts.append(f"{counts['in_progress']} em andamento")
    if counts["todo"]:
        parts.append(f"{counts['todo']} a fazer")
    status_sentence = ", ".join(parts)

    normalized = dict(payload)
    # Campo de validação para debug: permite confirmar que a normalização ocorreu
    normalized["validation"] = {
        "open_tasks_total": total,
        "status_counts": counts,
        "status_sentence": status_sentence,
        "stale_counts": {
            "+1d": sum(1 for info in task_infos if int(info.get("days_stale") or 0) >= 1),
            "+3d": sum(1 for info in task_infos if int(info.get("days_stale") or 0) >= 3),
            "+5d": sum(1 for info in task_infos if int(info.get("days_stale") or 0) >= 5),
        },
        "critical_task_id": str(critical_task.id) if critical_task else None,
        "normalized_by_backend": True,
    }

    # Corrige summary vazio ou genérico
    if not str(normalized.get("summary") or "").strip():
        normalized["summary"] = f"Existem {total} tarefas em aberto no projeto: {status_sentence}."

    # Corrige insights vazios: garante que as contagens reais apareçam
    if not isinstance(normalized.get("insights"), list) or not normalized["insights"]:
        normalized["insights"] = [
            {"label": "Tarefas abertas", "value": str(total), "tone": "warning", "icon_key": "tasks"},
            {"label": "Bloqueadas", "value": str(counts["blocked"]), "tone": "danger", "icon_key": "alert"},
            {"label": "Em andamento", "value": str(counts["in_progress"]), "tone": "accent", "icon_key": "spark"},
            {"label": "A fazer", "value": str(counts["todo"]), "tone": "warning", "icon_key": "clock"},
        ]

    # Corrige task_cards: garante que os dados de status venham do banco
    sections = normalized.get("sections")
    if isinstance(sections, list):
        normalized_sections = []
        for section in sections:
            if isinstance(section, dict) and section.get("id") in {
                "open-tasks-main-insight",
                "open-tasks-critical-suggestion",
            }:
                continue
            if not isinstance(section, dict) or section.get("type") != "task_cards":
                normalized_sections.append(section)
                continue

            items_by_title = {
                str(item.get("title")): item
                for item in section.get("items", [])
                if isinstance(item, dict) and item.get("title")
            }
            normalized_items = []
            for task in tasks:
                item = dict(items_by_title.get(task["title"], {}))
                item["title"] = task["title"]
                item["status"] = task["status"]
                item["status_label"] = task["status_label"]
                if task.get("next_steps"):
                    item["summary"] = f"Próximos passos: {task['next_steps']}"
                elif not item.get("summary"):
                    item["summary"] = ""
                normalized_items.append(item)

            section = dict(section)
            section["items"] = normalized_items
            normalized_sections.append(section)

        insight_section = {
            "id": "open-tasks-main-insight",
            "type": "bullet_list",
            "title": "Insight principal",
            "subtitle": "Risco operacional calculado pelo tempo desde o último update.",
            "items": alert_items,
            "accent": "warning",
        }
        normalized_sections.insert(0, insight_section)

        if critical_suggestion:
            normalized_sections.append(
                {
                    "id": "open-tasks-critical-suggestion",
                    "type": "bullet_list",
                    "title": "Sugestão para destravar",
                    "subtitle": "Baseada na prioridade, tempo parado e contexto registrado.",
                    "items": [{"text": critical_suggestion, "tone": "warning"}],
                    "accent": "warning",
                }
            )

        normalized["sections"] = normalized_sections

    return normalized


def _chunk_event_description(chunk: KnowledgeChunk, task: Task | None) -> str:
    content = chunk.content or ""
    summary = _extract_label_value(content, "Resumo")
    details = _extract_label_value(content, "Detalhes")
    if summary:
        return _truncate(summary, limit=180)
    if details:
        return _truncate(details, limit=180)
    if task and task.what_was_done:
        return _truncate(task.what_was_done, limit=180)
    return _truncate(content, limit=180)


def _task_progress_value(task: Task) -> str:
    if task.status == "done":
        if task.next_steps:
            return f"Próximo: {task.next_steps}"
        return "Concluída."
    if task.status == "blocked":
        reason = task.blocked_reason or task.next_steps or "Bloqueio registrado."
        return f"Bloqueio: {reason}"
    if task.next_steps:
        return f"Próximo: {task.next_steps}"
    return "Sem próximo passo registrado."


def _hours_label(hours: float | None) -> str | None:
    if hours is None:
        return None
    if float(hours).is_integer():
        return f"{int(hours)}h"
    return f"{hours:.1f}h".replace(".", ",")


def _tone_for_status(status: str | None) -> str:
    return {
        "done": "success",
        "blocked": "danger",
        "in_progress": "warning",
        "todo": "muted",
        "cancelled": "muted",
    }.get(status or "", "default")


def _normalize_weekly_payload(
    payload: dict[str, Any],
    chunks: list[KnowledgeChunk],
    task_lookup: dict[uuid.UUID, Task],
) -> dict[str, Any]:
    tasks_by_id: dict[uuid.UUID, Task] = {}
    for chunk in chunks:
        if chunk.task_id and chunk.task_id in task_lookup:
            tasks_by_id[chunk.task_id] = task_lookup[chunk.task_id]

    if not tasks_by_id:
        return payload

    normalized = dict(payload)
    sections = normalized.get("sections")
    preserved_sections: list[dict[str, Any]] = []
    if isinstance(sections, list):
        preserved_sections = [
            section
            for section in sections
            if isinstance(section, dict)
            and section.get("id") in {"weekly-insight", "daily-insight"}
            and section.get("type") == "bullet_list"
        ][:1]

    tasks_by_category: dict[str, list[Task]] = {}
    for task in tasks_by_id.values():
        tasks_by_category.setdefault(task.category or "sem_categoria", []).append(task)

    category_sections: list[dict[str, Any]] = []
    for category, tasks in sorted(tasks_by_category.items()):
        items = []
        for task in sorted(tasks, key=lambda item: item.updated_at or item.created_at, reverse=True):
            items.append(
                {
                    "title": task.title,
                    "description": _truncate(task.what_was_done, limit=180) if task.what_was_done else None,
                    "value": _task_progress_value(task),
                    "status": task.status,
                    "status_label": STATUS_LABELS.get(task.status, task.status),
                    "tone": _tone_for_status(task.status),
                }
            )
        category_sections.append(
            {
                "id": f"category-{category.lower().replace('_', '-')}",
                "type": "status_list",
                "title": category,
                "items": items,
            }
        )

    latest_chunk_by_task: dict[uuid.UUID, KnowledgeChunk] = {}
    for chunk in sorted(chunks, key=lambda item: item.updated_at or datetime.min.replace(tzinfo=timezone.utc), reverse=True):
        if chunk.task_id and chunk.task_id not in latest_chunk_by_task:
            latest_chunk_by_task[chunk.task_id] = chunk

    timeline_items = []
    sorted_tasks = sorted(
        tasks_by_id.values(),
        key=lambda task: task.updated_at or task.created_at,
        reverse=True,
    )
    for task in sorted_tasks:
        chunk = latest_chunk_by_task.get(task.id)
        timeline_items.append(
            {
                "title": task.title,
                "description": _chunk_event_description(chunk, task) if chunk else _truncate(task.what_was_done, limit=180),
                "badge": task.category,
                "eyebrow": (task.updated_at or task.created_at).isoformat() if (task.updated_at or task.created_at) else None,
                "label": STATUS_LABELS.get(task.status, task.status),
                "value": _hours_label(task.hours_worked),
                "status": task.status,
                "status_label": STATUS_LABELS.get(task.status, task.status),
                "tone": _tone_for_status(task.status),
            }
        )

    generated_sections = [
        *category_sections,
        {
            "id": "daily-timeline" if normalized.get("answer_kind") == "daily_progress" else "weekly-timeline",
            "type": "timeline",
            "title": "Linha do tempo",
            "items": timeline_items,
        },
    ]

    blocked_tasks = [task for task in tasks_by_id.values() if task.status == "blocked"]
    if blocked_tasks:
        generated_sections.append(
            {
                "id": "daily-bottlenecks" if normalized.get("answer_kind") == "daily_progress" else "weekly-bottlenecks",
                "type": "status_list",
                "title": "Gargalos identificados",
                "items": [
                    {
                        "title": task.title,
                        "description": _truncate(task.blocked_reason, limit=180) if task.blocked_reason else None,
                        "value": _task_progress_value(task),
                        "status": task.status,
                        "status_label": STATUS_LABELS.get(task.status, task.status),
                        "tone": "danger",
                    }
                    for task in blocked_tasks
                ],
            }
        )

    normalized["sections"] = [*preserved_sections, *generated_sections]
    normalized["validation"] = {
        "weekly_categories": sorted(tasks_by_category.keys()),
        "weekly_task_count": len(tasks_by_id),
        "normalized_by_backend": True,
    }
    return normalized


async def _fetch_intent_chunks(
    db: AsyncSession,
    project_id: uuid.UUID,
    question_key: str,
    query_embedding: list[float] | None,
    limit: int,
) -> list[KnowledgeChunk]:
    """Busca os chunks mais relevantes com filtros específicos por intenção.

    Cada question_key tem uma estratégia de busca diferente:
    - open-tasks:         filtro SQL direto por status (sem embedding)
    - recorded-blockers:  filtro SQL direto por update_type/status (sem embedding)
    - weekly-progress:    busca semântica restrita aos últimos 7 dias
    - technical-summary:  busca semântica pura (sem filtro de data)

    Para as duas últimas, o query_embedding é obrigatório.
    Para as duas primeiras, o embedding é ignorado — a intenção já
    está completamente definida pelo status/update_type no banco.
    """
    if question_key == "open-tasks":
        result = await db.execute(
            select(KnowledgeChunk)
            .where(
                KnowledgeChunk.project_id == project_id,
                KnowledgeChunk.source_type == TASK_SNAPSHOT_SOURCE,
                # Filtra no JSONB diretamente no PostgreSQL, sem trazer
                # todos os chunks para a memória do Python.
                cast(KnowledgeChunk.chunk_metadata, JSONB)["task_status"]
                .astext.notin_(["done", "cancelled"]),
            )
            .order_by(KnowledgeChunk.updated_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    if question_key == "recorded-blockers":
        result = await db.execute(
            select(KnowledgeChunk)
            .where(
                KnowledgeChunk.project_id == project_id,
                or_(
                    cast(KnowledgeChunk.chunk_metadata, JSONB)["update_type"].astext == "blocker",
                    cast(KnowledgeChunk.chunk_metadata, JSONB)["task_status"].astext == "blocked",
                ),
            )
            .order_by(KnowledgeChunk.updated_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    if query_embedding is None:
        return []

    if question_key == "daily-progress":
        start_utc, end_utc = _today_bounds_utc()
        result = await db.execute(
            select(KnowledgeChunk)
            .join(Task, KnowledgeChunk.task_id == Task.id)
            .where(
                KnowledgeChunk.project_id == project_id,
                Task.updated_at >= start_utc,
                Task.updated_at < end_utc,
            )
            .order_by(Task.updated_at.desc(), KnowledgeChunk.updated_at.desc())
            .limit(limit * 2)
        )
        return list(result.scalars().all())

    if question_key == "weekly-progress":
        # Tenta primeiro o período da pergunta para priorizar atividade recente.
        # Se não houver chunks nesse período, cai para busca semântica geral.
        cutoff = datetime.now(timezone.utc) - timedelta(days=7)
        result = await db.execute(
            select(KnowledgeChunk)
            .join(Task, KnowledgeChunk.task_id == Task.id)
            .where(
                KnowledgeChunk.project_id == project_id,
                Task.updated_at >= cutoff,
            )
            .order_by(Task.updated_at.desc(), KnowledgeChunk.updated_at.desc())
            .limit(limit * 2)
        )
        chunks = list(result.scalars().all())
        if chunks:
            return chunks

    # Busca semântica pura: retorna os K chunks com embedding mais próximo
    # ao embedding da pergunta, independente de data ou filtro de campo.
    result = await db.execute(
        select(KnowledgeChunk)
        .where(KnowledgeChunk.project_id == project_id)
        .order_by(KnowledgeChunk.embedding.cosine_distance(query_embedding))
        .limit(limit)
    )
    return list(result.scalars().all())


async def generate_query_answer(
    db: AsyncSession,
    project_id: uuid.UUID,
    question_key: str,
    question_text: str,
    *,
    limit: int = 12,
) -> tuple[dict[str, Any], dict[str, Any], list[dict[str, Any]], str]:
    """Orquestra o pipeline RAG completo para uma pergunta do modo consulta.

    Fluxo:
    1. Transforma a pergunta em embedding (Gemini ou fallback)
    2. Recupera os chunks mais relevantes com filtros por intenção
    3. Formata os chunks como contexto textual para o LLM
    4. Chama o LLM com system_prompt + user_prompt e response_schema
    5. Valida e pós-processa a resposta
    6. Constrói as referências filtrando IDs citados
    7. Converte para o dict QueryAnswerPayload do frontend

    Retorna: (payload_dict, references_list, fallback_text)
    - payload_dict: consumido pelo frontend via QueryConversationMessage.tsx
    - references_list: fontes exibidas no rodapé do relatório
    - fallback_text: texto simples caso o frontend não consiga renderizar o payload
    """
    settings = get_settings()

    if question_key not in SYSTEM_PROMPTS_BY_QUESTION:
        raise AIProviderError(f"question_key desconhecido: {question_key}")

    embed_provider = get_embedding_provider()
    llm_provider = get_llm_provider()

    # Passo 1: embedding da pergunta para busca semântica
    query_embedding = await embed_provider.embed(question_text)

    # Passo 2: busca com filtros por intenção
    chunks = await _fetch_intent_chunks(
        db, project_id, question_key, query_embedding, limit=limit
    )
    task_lookup = await _load_task_lookup(db, chunks)
    _enrich_chunks_with_task_metadata(chunks, task_lookup)

    if question_key == "daily-progress" and not chunks:
        payload = {
            "presentation_version": 1,
            "answer_kind": "daily_progress",
            "title": "Ainda sem panorama diário",
            "summary": "Ainda nao ha registros de hoje para consolidar um relatório diário deste projeto.",
            "insights": [],
            "sections": [
                {
                    "id": "empty-state",
                    "type": "empty_state",
                    "title": "Poucos registros recentes",
                    "items": [
                        {
                            "title": "Poucos registros recentes",
                            "description": "Registre tarefas ou updates hoje para que a consulta consiga consolidar um panorama diario util.",
                        }
                    ],
                    "accent": "muted",
                }
            ],
            "references": [],
        }
        panel_payload = build_query_panel_payload(
            question_key=question_key,
            answer_payload=payload,
            references=[],
            chunks=[],
            chunks_retrieved=0,
            cited_chunk_ids=None,
            ai_used=False,
        )
        return payload, panel_payload, [], payload["summary"]

    # Passo 3: serialização dos chunks para o prompt
    prompt_chunks = [_chunk_to_prompt_dict(chunk, task_lookup) for chunk in chunks]

    # Passo 4: chamada ao LLM com schema estruturado
    draft = await llm_provider.generate_structured(
        system_prompt=SYSTEM_PROMPTS_BY_QUESTION[question_key],
        user_prompt=build_user_prompt(question_text, prompt_chunks),
        response_schema=AIAnswerDraft,
        timeout_s=settings.AI_REQUEST_TIMEOUT_S,
    )
    # assert garante que o tipo é correto antes de acessar .cited_chunk_ids,
    # capturando bugs de implementação em novos providers.
    assert isinstance(draft, AIAnswerDraft)

    # Passo 5: pós-processamento específico para open_tasks
    payload = to_payload_dict(draft, [])  # referências adicionadas abaixo
    if question_key == "open-tasks":
        payload = _normalize_open_tasks_payload(payload, chunks, task_lookup)
    if question_key == "recorded-blockers":
        payload = _normalize_blockers_payload(payload, chunks, task_lookup)
    if question_key == "technical-summary":
        payload = _normalize_technical_payload(payload, chunks, task_lookup)
    if question_key in {"weekly-progress", "daily-progress"}:
        payload = _normalize_weekly_payload(payload, chunks, task_lookup)

    # Passo 6: construção de referências com anti-alucinação
    references = _build_references(chunks, draft.cited_chunk_ids)
    payload["references"] = references

    fallback_text = draft.summary or draft.title

    panel_payload = build_query_panel_payload(
        question_key=question_key,
        answer_payload=payload,
        references=references,
        chunks=chunks,
        chunks_retrieved=len(chunks),
        cited_chunk_ids=draft.cited_chunk_ids,
        ai_used=True,
    )

    logger.info(
        "AI query answer generated",
        extra={
            "question_key": question_key,
            "chunks_retrieved": len(chunks),
            "sections": len(draft.sections),
            "insights": len(draft.insights),
            "citations": len(draft.cited_chunk_ids),
        },
    )

    return payload, panel_payload, references, fallback_text
