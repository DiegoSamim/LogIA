import asyncio
import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import cast, or_, select
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.ai.pipeline import generate_query_answer, _normalize_blockers_payload, _normalize_open_tasks_payload, _normalize_technical_payload
from app.ai.panel import build_query_panel_payload
from app.ai.providers.base import AIProviderError
from app.core.config import get_settings
from app.core.utils import APP_TIMEZONE, STATUS_LABELS, status_label, truncate, today_bounds_utc
from app.db.engine import AsyncSessionLocal
from app.models.chat import ChatMessage, ChatSession, QueryRun
from app.models.knowledge import KnowledgeChunk
from app.models.project import Project
from app.models.task import ProjectMember, Task, TaskCheckpoint, TaskUpdate
from app.schemas.chat import (
    ChatMessageCreate,
    ChatSessionCreate,
    ChatSessionUpdate,
    QueryStartRequest,
)
from app.services.knowledge_service import (
    TASK_SNAPSHOT_SOURCE,
    TASK_UPDATE_SOURCE,
    embed_text,
    search_by_project,
)

logger = logging.getLogger(__name__)

RUNNING_QUERY_TASKS: dict[str, asyncio.Task[None]] = {}

QUERY_QUESTION_CATALOG: dict[str, str] = {
    "weekly-progress": "O que fiz essa semana?",
    "daily-progress": "O que fiz hoje?",
    "recorded-blockers": "Quais bloqueios já registrei?",
    "technical-summary": "Resumo técnico do projeto",
    "open-tasks": "Tarefas ainda em aberto",
}

TERMINAL_RUN_STATUSES = {"completed", "failed", "cancelled"}
ACTIVE_RUN_STATUSES = {"pending", "running"}
PRESENTATION_VERSION = 1
SECTION_ITEM_LIMIT = 5
def _now() -> datetime:
    return datetime.now(timezone.utc)


def _touch_session(session: ChatSession) -> None:
    session.updated_at = _now()


# Aliases locais para manter assinaturas internas sem alterar todos os call-sites
_truncate = truncate
_status_label = status_label
_today_bounds_utc = today_bounds_utc


def _source_label(source_type: str | None, update_type: str | None = None) -> str:
    if source_type == TASK_UPDATE_SOURCE:
        update_label = {
            "created": "Criacao",
            "progress": "Progresso",
            "status_change": "Mudanca de status",
            "completion": "Conclusao",
            "blocker": "Bloqueio",
            "edit": "Edicao",
        }.get(update_type or "", "Atualizacao")
        return f"Update · {update_label}"
    if source_type == TASK_SNAPSHOT_SOURCE:
        return "Estado atual"
    return "Contexto"


def _kind_for_question(question_key: str) -> str:
    return {
        "weekly-progress": "weekly_progress",
        "daily-progress": "daily_progress",
        "recorded-blockers": "blockers",
        "technical-summary": "technical_summary",
        "open-tasks": "open_tasks",
    }.get(question_key, "query_report")


def _chunk_reference(chunk: KnowledgeChunk) -> dict[str, Any]:
    metadata = chunk.chunk_metadata or {}
    preview = _truncate(chunk.content, limit=220)
    return {
        "id": str(chunk.id),
        "chunk_id": str(chunk.id),
        "task_id": str(chunk.task_id) if chunk.task_id else None,
        "task_update_id": str(chunk.task_update_id) if chunk.task_update_id else None,
        "source_type": chunk.source_type,
        "task_title": metadata.get("task_title"),
        "task_status": metadata.get("task_status"),
        "update_type": metadata.get("update_type"),
        "preview": preview,
    }


def _dedupe_references(references: list[dict[str, Any]], limit: int = 6) -> list[dict[str, Any]]:
    unique: list[dict[str, Any]] = []
    seen: set[str] = set()

    for reference in references:
        key = next(
            (
                str(value)
                for value in (
                    reference.get("task_update_id"),
                    reference.get("task_id"),
                    reference.get("chunk_id"),
                    reference.get("id"),
                )
                if value
            ),
            "missing-reference-id",
        )
        if key in seen:
            continue
        seen.add(key)
        unique.append(reference)
        if len(unique) >= limit:
            break

    return unique


def _chunk_task_key(chunk: KnowledgeChunk) -> str:
    metadata = chunk.chunk_metadata or {}
    if chunk.task_id:
        return str(chunk.task_id)
    if metadata.get("task_title"):
        return str(metadata["task_title"])
    return str(chunk.id)


def _dedupe_chunks_by_task(chunks: list[KnowledgeChunk], limit: int = SECTION_ITEM_LIMIT) -> list[KnowledgeChunk]:
    unique: list[KnowledgeChunk] = []
    seen: set[str] = set()

    for chunk in chunks:
        key = _chunk_task_key(chunk)
        if key in seen:
            continue
        seen.add(key)
        unique.append(chunk)
        if len(unique) >= limit:
            break

    return unique


def _make_answer_payload(
    *,
    answer_kind: str,
    title: str,
    summary: str,
    insights: list[dict[str, Any]],
    sections: list[dict[str, Any]],
    references: list[dict[str, Any]],
) -> dict[str, Any]:
    return {
        "presentation_version": PRESENTATION_VERSION,
        "answer_kind": answer_kind,
        "title": title,
        "summary": summary,
        "insights": insights[:5],
        "sections": sections,
        "references": _dedupe_references(references),
    }


def _build_empty_answer(
    *,
    question_key: str,
    title: str,
    summary: str,
    empty_title: str,
    empty_description: str,
) -> tuple[dict[str, Any], list[dict[str, Any]], str]:
    payload = _make_answer_payload(
        answer_kind=_kind_for_question(question_key),
        title=title,
        summary=summary,
        insights=[],
        sections=[
            {
                "id": "empty-state",
                "type": "empty_state",
                "title": empty_title,
                "items": [{"title": empty_title, "description": empty_description}],
                "accent": "muted",
            }
        ],
        references=[],
    )
    return payload, [], summary


def _task_card_from_chunk(chunk: KnowledgeChunk) -> dict[str, Any]:
    metadata = chunk.chunk_metadata or {}
    status_value = metadata.get("task_status")
    preview = _truncate(chunk.content.split("\n\n", 1)[-1], limit=190)
    return {
        "id": str(chunk.task_id or chunk.id),
        "title": metadata.get("task_title") or "Tarefa sem titulo",
        "status": status_value,
        "status_label": _status_label(status_value),
        "source_label": _source_label(chunk.source_type, metadata.get("update_type")),
        "summary": preview or "Sem resumo disponivel para este registro.",
    }


def _build_open_tasks_answer(chunks: list[KnowledgeChunk]) -> tuple[dict[str, Any], list[dict[str, Any]], str]:
    chunks = _dedupe_chunks_by_task(chunks)
    if not chunks:
        return _build_empty_answer(
            question_key="open-tasks",
            title="Nenhuma tarefa aberta encontrada",
            summary="Nao encontrei tarefas abertas indexadas para este projeto no momento.",
            empty_title="Sem pendencias abertas",
            empty_description="Assim que novas tarefas forem registradas como abertas, elas aparecerao organizadas aqui.",
        )

    task_cards = [_task_card_from_chunk(chunk) for chunk in chunks[:SECTION_ITEM_LIMIT]]
    status_counts = {
        "blocked": sum(1 for card in task_cards if card["status"] == "blocked"),
        "in_progress": sum(1 for card in task_cards if card["status"] == "in_progress"),
        "todo": sum(1 for card in task_cards if card["status"] == "todo"),
    }
    status_parts = [
        f"{status_counts['blocked']} bloqueada(s)" if status_counts["blocked"] else "",
        f"{status_counts['in_progress']} em andamento" if status_counts["in_progress"] else "",
        f"{status_counts['todo']} a fazer" if status_counts["todo"] else "",
    ]
    status_summary = ", ".join(part for part in status_parts if part)
    references = [_chunk_reference(chunk) for chunk in chunks]
    payload = _make_answer_payload(
        answer_kind=_kind_for_question("open-tasks"),
        title="Panorama das tarefas em aberto",
        summary=f"Encontrei {len(task_cards)} tarefa(s) aberta(s): {status_summary}.",
        insights=[
            {"label": "Tarefas abertas", "value": str(len(task_cards)), "tone": "warning", "icon_key": "tasks"},
            {"label": "Bloqueadas", "value": str(status_counts["blocked"]), "tone": "danger", "icon_key": "alert"},
            {"label": "Em andamento", "value": str(status_counts["in_progress"]), "tone": "accent", "icon_key": "spark"},
            {"label": "A fazer", "value": str(status_counts["todo"]), "tone": "warning", "icon_key": "clock"},
            {
                "label": "Mais recente",
                "value": task_cards[0]["title"],
                "tone": "default",
                "icon_key": "clock",
            },
        ],
        sections=[
            {
                "id": "open-task-cards",
                "type": "task_cards",
                "title": "Tarefas que pedem continuidade",
                "subtitle": "Cards resumidos para bater o olho no que ainda esta pendente.",
                "items": task_cards,
                "collapsed": len(chunks) > SECTION_ITEM_LIMIT,
                "accent": "warning",
            },
            {
                "id": "open-task-bullets",
                "type": "bullet_list",
                "title": "Leituras rapidas",
                "items": [
                    {"text": f"{card['title']} esta {str(card['status_label']).lower()}."}
                    for card in task_cards[:3]
                ],
                "accent": "default",
            },
        ],
        references=references,
    )
    fallback = "Tarefas em aberto:\n" + "\n".join(
        f"- {card['title']} ({card['status_label']}): {card['summary']}" for card in task_cards
    )
    return payload, _dedupe_references(references), fallback


def _build_blockers_answer(chunks: list[KnowledgeChunk]) -> tuple[dict[str, Any], list[dict[str, Any]], str]:
    if not chunks:
        return _build_empty_answer(
            question_key="recorded-blockers",
            title="Nenhum bloqueio registrado",
            summary="Nao encontrei impedimentos documentados no historico atual do projeto.",
            empty_title="Fluxo sem bloqueios visiveis",
            empty_description="Se algum impedimento for registrado nas tarefas ou updates, ele aparecera destacado aqui.",
        )

    references = [_chunk_reference(chunk) for chunk in chunks]
    status_items: list[dict[str, Any]] = []
    timeline_items: list[dict[str, Any]] = []

    for chunk in chunks[:SECTION_ITEM_LIMIT]:
        metadata = chunk.chunk_metadata or {}
        title = metadata.get("task_title") or "Tarefa sem titulo"
        preview = _truncate(chunk.content, limit=180)
        status_items.append(
            {
                "label": title,
                "value": _status_label(metadata.get("task_status")) if metadata.get("task_status") else "Bloqueio registrado",
                "tone": "danger",
                "description": preview,
            }
        )
        timeline_items.append(
            {
                "title": title,
                "description": preview,
                "badge": _source_label(chunk.source_type, metadata.get("update_type")),
            }
        )

    payload = _make_answer_payload(
        answer_kind=_kind_for_question("recorded-blockers"),
        title="Bloqueios registrados no projeto",
        summary=f"Identifiquei {len(status_items)} bloqueio(s) ou sinais de impedimento no historico indexado.",
        insights=[
            {"label": "Bloqueios", "value": str(len(status_items)), "tone": "danger", "icon_key": "alert"},
            {
                "label": "Origem dominante",
                "value": "Updates" if any(chunk.source_type == TASK_UPDATE_SOURCE for chunk in chunks) else "Estado atual",
                "tone": "default",
                "icon_key": "spark",
            },
        ],
        sections=[
            {
                "id": "blocker-status-list",
                "type": "status_list",
                "title": "Impedimentos identificados",
                "items": status_items,
                "collapsed": len(chunks) > SECTION_ITEM_LIMIT,
                "accent": "danger",
            },
            {
                "id": "blocker-timeline",
                "type": "timeline",
                "title": "Contexto recente dos bloqueios",
                "items": timeline_items,
                "accent": "warning",
            },
        ],
        references=references,
    )
    fallback = "Bloqueios registrados:\n" + "\n".join(
        f"- {item['label']}: {item['description']}" for item in status_items
    )
    return payload, _dedupe_references(references), fallback


_EMPTY_FIELD_VALUES = {"nao informada", "nao informado", "não informada", "não informado", "nao informado"}


def _extract_field(content: str, label: str) -> str | None:
    """Extrai 'Label: valor' de uma linha do chunk (case-insensitive).
    Retorna None para valores de placeholder como 'Nao informada'."""
    for line in content.splitlines():
        if line.lower().startswith(label.lower() + ":"):
            val = line.split(":", 1)[1].strip()
            if val and val.lower() not in _EMPTY_FIELD_VALUES:
                return val
    return None


def _compute_progress(content: str, status: str | None) -> str | None:
    """Calcula progresso % a partir do bloco 'Checklist:' do chunk.

    Formato esperado no content:
        Checklist:
        - [x] checkpoint concluído
        - [ ] checkpoint pendente

    Retorna '100%' para done, None se não há checklist, ou 'XX%' baseado em [x].
    """
    if status == "done":
        return "100%"
    lines = content.splitlines()
    in_checklist = False
    total = 0
    done = 0
    for line in lines:
        stripped = line.strip()
        if stripped.lower().startswith("checklist:"):
            in_checklist = True
            continue
        if in_checklist:
            if not stripped:
                continue
            if not stripped.startswith("-"):
                break
            total += 1
            if "[x]" in stripped.lower():
                done += 1
    if total == 0:
        return None
    return f"{round(done / total * 100)}%"


def _build_status_list_value(progress: str | None, next_step: str | None) -> str | None:
    """Monta o campo value do status_list: 'XX% · Próximo: ...'
    O frontend exibe value abaixo do título quando len > 28 chars."""
    parts = []
    if progress:
        parts.append(progress)
    if next_step:
        parts.append(f"Próximo: {_truncate(next_step, 120)}")
    return " · ".join(parts) if parts else None


def _ensure_utc(dt: datetime | None) -> datetime:
    if not dt:
        return datetime(2000, 1, 1, tzinfo=timezone.utc)
    return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)


def _days_since(dt: datetime | None) -> int:
    return max(0, (datetime.now(timezone.utc) - _ensure_utc(dt)).days)


def _chunk_category(chunk: KnowledgeChunk) -> str | None:
    """Lê task_category do metadata (preferência) ou extrai do conteúdo como fallback.
    Retorna None quando a categoria não está definida (→ 'Geral' no caller)."""
    meta = chunk.chunk_metadata or {}
    cat = meta.get("task_category")
    if cat and cat.lower() not in _EMPTY_FIELD_VALUES:
        return cat
    # Fallback: busca no texto do chunk (apenas funciona no primeiro chunk da tarefa)
    return _extract_field(chunk.content, "Categoria")


def _chunk_status(chunk: KnowledgeChunk) -> str | None:
    """Lê o status efectivo do chunk: task_status para snapshots,
    new_status → old_status como fallback para chunks de update."""
    meta = chunk.chunk_metadata or {}
    return meta.get("task_status") or meta.get("new_status") or meta.get("old_status")


def _task_progress(task: Task) -> str | None:
    """Calcula progresso % via checkpoints do Task. Nenhum chunk necessário."""
    if task.status == "done":
        return "100%"
    checkpoints: list[TaskCheckpoint] = list(task.checkpoints or [])
    if not checkpoints:
        return None
    done = sum(1 for c in checkpoints if c.is_done)
    return f"{round(done / len(checkpoints) * 100)}%"


def _task_update_label(update_type: str | None) -> str:
    return {
        "created": "Criação",
        "progress": "Progresso",
        "status_change": "Mudança de status",
        "completion": "Conclusão",
        "blocker": "Bloqueio",
        "edit": "Edição",
    }.get(update_type or "", "Atualização")


def _build_progress_answer(
    tasks: list[Task],
    *,
    question_key: str,
    report_title: str,
    period_label: str,
    empty_title: str,
    empty_description: str,
    section_prefix: str,
) -> tuple[dict[str, Any], list[dict[str, Any]], str]:
    """Monta um relatório de progresso diretamente a partir de objetos Task do banco.
    Categoria, status, checkpoints e updates são campos indexáveis — sem parsing de chunks."""
    if not tasks:
        return _build_empty_answer(
            question_key=question_key,
            title=empty_title,
            summary=f"Ainda nao ha contexto suficiente para resumir {period_label} deste projeto.",
            empty_title="Poucos registros recentes",
            empty_description=empty_description,
        )

    total = len(tasks)
    done_count = sum(1 for t in tasks if t.status == "done")
    in_progress_count = sum(1 for t in tasks if t.status == "in_progress")
    blocked_tasks = [t for t in tasks if t.status == "blocked"]
    completion_rate = round(done_count / total * 100) if total else 0

    sections: list[dict[str, Any]] = []

    # --- Seção 1: Insight Principal ---
    insight_bullets: list[str] = []
    if total >= 3 and in_progress_count > done_count:
        insight_bullets.append("Alto volume de início de tarefas, mas baixa taxa de finalização")
        insight_bullets.append("Indício de contexto fragmentado ou escopo mal definido")
    elif done_count == 0 and total > 0:
        insight_bullets.append("Nenhuma tarefa foi concluída no período analisado")
    else:
        insight_bullets.append(f"{done_count} de {total} tarefa(s) concluída(s) {period_label}")

    sections.append({
        "id": f"{section_prefix}-insight",
        "type": "bullet_list",
        "title": "Insight principal",
        "items": [{"text": t} for t in insight_bullets],
    })

    # --- Seção 2: Relatório por Categoria (campo task.category direto) ---
    category_map: dict[str, list[Task]] = {}
    for task in tasks:
        cat = (task.category or "").strip() or "Geral"
        if cat not in category_map:
            category_map[cat] = []
        category_map[cat].append(task)

    for cat_name, cat_tasks in sorted(category_map.items(), key=lambda x: -len(x[1])):
        slug = cat_name.lower().replace(" ", "-").replace("/", "-")
        items = []
        for task in cat_tasks:
            next_step = task.next_steps if task.status != "done" else None
            items.append({
                "title": task.title,
                "status": task.status,
                "status_label": _status_label(task.status),
                "value": _build_status_list_value(_task_progress(task), next_step),
            })
        sections.append({
            "id": f"category-{slug}",
            "type": "status_list",
            "title": cat_name,
            "items": items,
        })

    # --- Seção 3: Linha do tempo (task_updates ordenados por created_at) ---
    all_updates: list[tuple[TaskUpdate, Task]] = []
    for task in tasks:
        for update in (task.updates or []):
            all_updates.append((update, task))

    all_updates.sort(key=lambda x: _ensure_utc(x[0].created_at), reverse=True)

    timeline_items = []
    for update, task in all_updates[:SECTION_ITEM_LIMIT]:
        status = update.new_status or update.old_status or task.status
        description = _truncate(update.summary or update.details or "", 160)
        timeline_items.append({
            "eyebrow": update.created_at.isoformat() if update.created_at else None,
            "badge": (task.category or "Geral").strip() or "Geral",
            "title": task.title,
            "description": _task_update_label(update.update_type) + (f" · {description}" if description else ""),
            "status": status,
        })

    if timeline_items:
        sections.append({
            "id": f"{section_prefix}-timeline",
            "type": "timeline",
            "title": "Linha do tempo",
            "items": timeline_items,
            "collapsed": len(all_updates) > SECTION_ITEM_LIMIT,
        })

    # --- Seção 4: Gargalos Identificados (condicional) ---
    bottleneck_items: list[dict[str, Any]] = []
    for task in blocked_tasks:
        days = _days_since(_ensure_utc(task.updated_at) if task.updated_at else None)
        days_label = f"{days} dia(s)" if days > 0 else "menos de 1 dia"
        cause = (task.blocked_reason or "").strip() or "Causa não registrada"
        bottleneck_items.append({
            "title": f"{task.title} — bloqueada há {days_label}",
            "tone": "danger",
            "value": f"Causa provável: {cause}",
        })
    if completion_rate < 40 and total >= 3:
        bottleneck_items.append({
            "title": f"Baixa taxa de conclusão ({completion_rate}%)",
            "tone": "warning",
            "value": "Possível causa: muitas tarefas iniciadas simultaneamente ou escopo mal definido",
        })
    if bottleneck_items:
        sections.append({
            "id": f"{section_prefix}-bottlenecks",
            "type": "status_list",
            "title": "Gargalos identificados",
            "items": bottleneck_items,
        })

    references: list[dict[str, Any]] = [
        {
            "id": str(task.id),
            "task_id": str(task.id),
            "task_title": task.title,
            "task_status": task.status,
            "source_type": TASK_SNAPSHOT_SOURCE,
            "preview": _truncate(task.what_was_done or task.next_steps or task.title, 220),
        }
        for task in tasks
    ]

    payload = _make_answer_payload(
        answer_kind=_kind_for_question(question_key),
        title=report_title,
        summary=f"Consolidei o progresso, categorias e gargalos {period_label} com base nos registros do projeto.",
        insights=[
            {"label": "Tarefas tocadas", "value": str(total), "tone": "default", "icon_key": "tasks"},
            {"label": "Concluídas", "value": str(done_count), "tone": "success", "icon_key": "check"},
            {"label": "Em andamento", "value": str(in_progress_count), "tone": "warning", "icon_key": "progress"},
            {"label": "Bloqueadas", "value": str(len(blocked_tasks)), "tone": "danger", "icon_key": "block"},
        ],
        sections=sections,
        references=references,
    )
    fallback = f"{report_title}: {done_count} de {total} tarefa(s) concluída(s)."
    if blocked_tasks:
        fallback += f" {len(blocked_tasks)} tarefa(s) bloqueada(s)."
    return payload, _dedupe_references(references), fallback


def _build_weekly_progress_answer(tasks: list[Task]) -> tuple[dict[str, Any], list[dict[str, Any]], str]:
    return _build_progress_answer(
        tasks,
        question_key="weekly-progress",
        report_title="Relatório semanal",
        period_label="nesta semana",
        empty_title="Ainda sem panorama semanal",
        empty_description="Registre mais tarefas ou updates para que a consulta consiga consolidar um panorama semanal util.",
        section_prefix="weekly",
    )


def _build_daily_progress_answer(tasks: list[Task]) -> tuple[dict[str, Any], list[dict[str, Any]], str]:
    return _build_progress_answer(
        tasks,
        question_key="daily-progress",
        report_title="Relatório diário",
        period_label="hoje",
        empty_title="Ainda sem panorama diário",
        empty_description="Registre tarefas ou updates hoje para que a consulta consiga consolidar um panorama diario util.",
        section_prefix="daily",
    )


def _build_technical_summary_answer(chunks: list[KnowledgeChunk]) -> tuple[dict[str, Any], list[dict[str, Any]], str]:
    if not chunks:
        return _build_empty_answer(
            question_key="technical-summary",
            title="Resumo tecnico indisponivel",
            summary="Ainda nao encontrei material tecnico suficiente indexado para montar um resumo consolidado.",
            empty_title="Base tecnica ainda curta",
            empty_description="Conforme o time registrar mais tarefas e updates, esta resposta fica mais rica e confiavel.",
        )

    references = [_chunk_reference(chunk) for chunk in chunks]
    rich_text_items = [{"content": _truncate(chunk.content, limit=260)} for chunk in chunks[:3]]
    task_cards = [_task_card_from_chunk(chunk) for chunk in chunks[:4]]
    bullet_items = [
        {
            "text": f"{card['title']} apareceu como {card['source_label'].lower()} com status {str(card['status_label']).lower()}."
        }
        for card in task_cards[:3]
    ]

    payload = _make_answer_payload(
        answer_kind=_kind_for_question("technical-summary"),
        title="Resumo tecnico consolidado",
        summary="Organizei os principais trechos tecnicos do historico em um formato mais facil de ler e estilizar.",
        insights=[
            {"label": "Trechos usados", "value": str(len(chunks[:4])), "tone": "accent", "icon_key": "spark"},
            {
                "label": "Estado atual",
                "value": str(sum(1 for chunk in chunks if chunk.source_type == TASK_SNAPSHOT_SOURCE)),
                "tone": "default",
                "icon_key": "layers",
            },
            {
                "label": "Updates",
                "value": str(sum(1 for chunk in chunks if chunk.source_type == TASK_UPDATE_SOURCE)),
                "tone": "success",
                "icon_key": "history",
            },
        ],
        sections=[
            {
                "id": "technical-rich-text",
                "type": "rich_text",
                "title": "Leitura tecnica sintetizada",
                "items": rich_text_items,
                "accent": "accent",
            },
            {
                "id": "technical-task-cards",
                "type": "task_cards",
                "title": "Contextos tecnicos por tarefa",
                "items": task_cards,
                "accent": "default",
            },
            {
                "id": "technical-bullets",
                "type": "bullet_list",
                "title": "Resumo rapido",
                "items": bullet_items,
                "accent": "muted",
            },
        ],
        references=references,
    )
    fallback = "Resumo tecnico:\n" + "\n".join(
        f"- {card['title']}: {card['summary']}" for card in task_cards
    )
    return payload, _dedupe_references(references), fallback


async def _resolve_query_answer(
    db: AsyncSession,
    *,
    project_id: uuid.UUID,
    question_key: str,
    question_text: str,
) -> tuple[dict[str, Any], dict[str, Any], list[dict[str, Any]], str, dict[str, Any]]:
    """Ponto de decisão entre pipeline de IA real e mock.

    Retorna uma tupla de 5 elementos:
    - answer_payload: dict QueryAnswerPayload consumido pelo frontend
    - panel_payload:  dict do painel lateral de indicadores
    - references:     lista de fontes usadas na resposta
    - answer_text:    texto simples de fallback
    - debug_info:     metadados sobre qual caminho foi usado (AI vs mock)

    Lógica de degradação:
    1. AI_ENABLED=True  → tenta generate_query_answer (pipeline RAG + Gemini)
    2. AIProviderError ou TimeoutError → warning + usa mock (se AI_FALLBACK_TO_MOCK=True)
    3. AI_ENABLED=False → vai direto para mock
    4. AI_FALLBACK_TO_MOCK=False + erro → propaga a exceção (falha explícita)
    """
    settings = get_settings()
    if settings.AI_ENABLED:
        try:
            logger.info(
                "[LogIA AI] AI_ENABLED=true; tentando usar pipeline real",
                extra={"project_id": str(project_id), "question_key": question_key},
            )
            answer_payload, panel_payload, references, answer_text = await generate_query_answer(
                db,
                project_id,
                question_key,
                question_text,
            )
            logger.info(
                "[LogIA AI] Resposta gerada por IA",
                extra={"project_id": str(project_id), "question_key": question_key},
            )
            return answer_payload, panel_payload, references, answer_text, {
                "answer_source": "ai",
                "ai_enabled": True,
                "llm_called": True,
                "provider": settings.AI_PROVIDER,
                "generation_model": settings.AI_GENERATION_MODEL,
                "embedding_model": settings.AI_EMBEDDING_MODEL,
                "fallback_used": False,
            }
        except (AIProviderError, asyncio.TimeoutError) as exc:
            logger.warning(
                "[LogIA AI] Pipeline de IA falhou (%s); usando mock como fallback.",
                type(exc).__name__,
                exc_info=False,
            )
            if not settings.AI_FALLBACK_TO_MOCK:
                raise
    else:
        logger.info(
            "[LogIA AI] AI_ENABLED=false; usando mock",
            extra={"project_id": str(project_id), "question_key": question_key},
        )

    answer_payload, panel_payload, references, answer_text = await _build_mock_query_answer(db, project_id, question_key, question_text)
    return answer_payload, panel_payload, references, answer_text, {
        "answer_source": "mock",
        "ai_enabled": settings.AI_ENABLED,
        "llm_called": False,
        "provider": settings.AI_PROVIDER,
        "generation_model": settings.AI_GENERATION_MODEL,
        "embedding_model": settings.AI_EMBEDDING_MODEL,
        "fallback_used": True,
    }


def _enrich_chunk_metadata_from_task(chunks: list[KnowledgeChunk]) -> dict[uuid.UUID, Task]:
    """Popula chunk_metadata com campos da Task usando o relationship já carregado.
    Requer que os chunks tenham sido buscados com selectinload(KnowledgeChunk.task)."""
    task_lookup: dict[uuid.UUID, Task] = {}
    for chunk in chunks:
        if not chunk.task_id or not chunk.task:
            continue
        task = chunk.task
        task_lookup[chunk.task_id] = task
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
    return task_lookup


async def _build_mock_query_answer(
    db: AsyncSession,
    project_id: uuid.UUID,
    question_key: str,
    question_text: str,
) -> tuple[dict[str, Any], dict[str, Any], list[dict[str, Any]], str]:
    """Pipeline mock: monta o QueryAnswerPayload com SQL + templates, sem LLM.
    Mantido como fallback para quando a IA está desabilitada ou falha.
    Garante que o modo consulta funcione mesmo sem GEMINI_API_KEY configurada."""

    def with_panel(
        chunks: list[KnowledgeChunk],
        answer: tuple[dict[str, Any], list[dict[str, Any]], str],
    ) -> tuple[dict[str, Any], dict[str, Any], list[dict[str, Any]], str]:
        answer_payload, references, fallback_text = answer
        panel_payload = build_query_panel_payload(
            question_key=question_key,
            answer_payload=answer_payload,
            references=references,
            chunks=chunks,
            chunks_retrieved=len(chunks),
            cited_chunk_ids=None,
            ai_used=False,
        )
        return answer_payload, panel_payload, references, fallback_text

    if question_key == "open-tasks":
        result = await db.execute(
            select(KnowledgeChunk)
            .where(
                KnowledgeChunk.project_id == project_id,
                KnowledgeChunk.source_type == TASK_SNAPSHOT_SOURCE,
                cast(KnowledgeChunk.chunk_metadata, JSONB)["task_status"].astext.notin_(["done", "cancelled"]),
            )
            .options(selectinload(KnowledgeChunk.task))
            .order_by(KnowledgeChunk.updated_at.desc())
            .limit(18)
        )
        chunks = list(result.scalars().all())
        task_lookup = _enrich_chunk_metadata_from_task(chunks)
        answer_payload, references, fallback_text = _build_open_tasks_answer(chunks)
        answer_payload = _normalize_open_tasks_payload(answer_payload, chunks, task_lookup)
        return with_panel(chunks, (answer_payload, references, fallback_text))

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
            .options(selectinload(KnowledgeChunk.task))
            .order_by(KnowledgeChunk.updated_at.desc())
            .limit(6)
        )
        chunks = list(result.scalars().all())
        task_lookup = _enrich_chunk_metadata_from_task(chunks)
        answer_payload, references, fallback_text = _build_blockers_answer(chunks)
        answer_payload = _normalize_blockers_payload(answer_payload, chunks, task_lookup)
        return with_panel(chunks, (answer_payload, references, fallback_text))

    if question_key == "weekly-progress":
        cutoff = datetime.now(timezone.utc) - timedelta(days=7)
        result = await db.execute(
            select(Task)
            .where(Task.project_id == project_id, Task.updated_at >= cutoff)
            .options(selectinload(Task.checkpoints), selectinload(Task.updates))
            .order_by(Task.updated_at.desc())
        )
        tasks = list(result.scalars().all())
        answer_payload, references, fallback_text = _build_weekly_progress_answer(tasks)
        panel_payload = build_query_panel_payload(
            question_key=question_key,
            answer_payload=answer_payload,
            references=references,
            chunks=[],
            chunks_retrieved=len(tasks),
            cited_chunk_ids=None,
            ai_used=False,
        )
        return answer_payload, panel_payload, references, fallback_text

    if question_key == "daily-progress":
        start_utc, end_utc = _today_bounds_utc()
        result = await db.execute(
            select(Task)
            .where(Task.project_id == project_id, Task.updated_at >= start_utc, Task.updated_at < end_utc)
            .options(selectinload(Task.checkpoints), selectinload(Task.updates))
            .order_by(Task.updated_at.desc())
        )
        tasks = list(result.scalars().all())
        answer_payload, references, fallback_text = _build_daily_progress_answer(tasks)
        panel_payload = build_query_panel_payload(
            question_key=question_key,
            answer_payload=answer_payload,
            references=references,
            chunks=[],
            chunks_retrieved=len(tasks),
            cited_chunk_ids=None,
            ai_used=False,
        )
        return answer_payload, panel_payload, references, fallback_text

    semantic_chunks = await search_by_project(db, project_id, embed_text(question_text), limit=6)

    if question_key == "technical-summary":
        task_lookup = await enrich_chunks_with_tasks(semantic_chunks)
        answer_payload, references, fallback_text = _build_technical_summary_answer(semantic_chunks)
        answer_payload = _normalize_technical_payload(answer_payload, semantic_chunks, task_lookup)
        return with_panel(semantic_chunks, (answer_payload, references, fallback_text))


async def _verify_project_ownership(db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID) -> None:
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            (Project.user_id == user_id) | Project.members.any(ProjectMember.user_id == user_id),
        )
    )
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projeto não encontrado.")


async def _verify_session_ownership(
    db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID
) -> ChatSession:
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.id == session_id, ChatSession.user_id == user_id)
        .options(selectinload(ChatSession.query_runs))
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sessão não encontrada.")
    return session


async def _verify_query_run_ownership(
    db: AsyncSession, run_id: uuid.UUID, user_id: uuid.UUID
) -> QueryRun:
    result = await db.execute(
        select(QueryRun)
        .join(ChatSession, QueryRun.session_id == ChatSession.id)
        .where(QueryRun.id == run_id, ChatSession.user_id == user_id)
        .options(selectinload(QueryRun.session))
    )
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Consulta não encontrada.")
    return run


async def _get_active_session_run(db: AsyncSession, session_id: uuid.UUID) -> QueryRun | None:
    result = await db.execute(
        select(QueryRun)
        .where(
            QueryRun.session_id == session_id,
            QueryRun.status.in_(ACTIVE_RUN_STATUSES),
        )
        .order_by(QueryRun.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


def _launch_query_run(run_id: uuid.UUID) -> None:
    task_key = str(run_id)
    existing = RUNNING_QUERY_TASKS.get(task_key)
    if existing and not existing.done():
        return

    RUNNING_QUERY_TASKS[task_key] = asyncio.create_task(_execute_query_run(run_id), name=f"query-run-{task_key}")


async def _execute_query_run(run_id: uuid.UUID) -> None:
    task_key = str(run_id)
    try:
        async with AsyncSessionLocal() as db:
            run = await db.get(QueryRun, run_id, options=[selectinload(QueryRun.session)])
            if not run:
                return
            if run.status == "cancelled":
                return

            run.status = "running"
            run.started_at = _now()
            run.error_message = None
            _touch_session(run.session)
            await db.commit()

        settings = get_settings()
        if not settings.AI_ENABLED:
            await asyncio.sleep(1.1)

        async with AsyncSessionLocal() as db:
            run = await db.get(QueryRun, run_id, options=[selectinload(QueryRun.session)])
            if not run or run.status == "cancelled":
                return

            answer_payload, panel_payload, references, answer_text, ai_trace = await _resolve_query_answer(
                db,
                project_id=run.session.project_id,
                question_key=run.question_key,
                question_text=run.question_text,
            )
            answer_source = str(ai_trace.get("answer_source") or "unknown")

            await db.refresh(run)
            if run.status == "cancelled":
                return

            answer_message = ChatMessage(
                id=uuid.uuid4(),
                session_id=run.session_id,
                sender="assistant",
                message_type="query_answer",
                content=answer_text,
                msg_metadata={
                    "run_id": str(run.id),
                    "question_key": run.question_key,
                    "status": "completed",
                    "answer_payload": answer_payload,
                    "panel_payload": panel_payload,
                    "references": references,
                    "answer_source": answer_source,
                    "ai_used": answer_source == "ai",
                    "ai_trace": ai_trace,
                },
            )
            db.add(answer_message)
            await db.flush()

            run.status = "completed"
            run.completed_at = _now()
            run.response_message_id = answer_message.id
            run.result_metadata = {
                "answer_payload": answer_payload,
                "panel_payload": panel_payload,
                "references": references,
                "presentation_version": PRESENTATION_VERSION,
                "answer_source": answer_source,
                "ai_used": answer_source == "ai",
                "ai_trace": ai_trace,
            }
            _touch_session(run.session)
            await db.commit()
    except asyncio.CancelledError:
        raise
    except Exception as exc:
        async with AsyncSessionLocal() as db:
            run = await db.get(QueryRun, run_id, options=[selectinload(QueryRun.session)])
            if not run or run.status == "cancelled":
                return

            exc_message = str(exc) or type(exc).__name__
            error_text = "A consulta falhou antes de produzir uma resposta."
            error_message = ChatMessage(
                id=uuid.uuid4(),
                session_id=run.session_id,
                sender="assistant",
                message_type="query_error",
                content=error_text,
                msg_metadata={
                    "run_id": str(run.id),
                    "question_key": run.question_key,
                    "status": "failed",
                    "error_message": exc_message,
                },
            )
            db.add(error_message)
            await db.flush()

            run.status = "failed"
            run.error_message = exc_message
            run.completed_at = _now()
            run.response_message_id = error_message.id
            _touch_session(run.session)
            await db.commit()
    finally:
        RUNNING_QUERY_TASKS.pop(task_key, None)


async def create_session(
    db: AsyncSession, user_id: uuid.UUID, project_id: uuid.UUID, data: ChatSessionCreate
) -> ChatSession:
    await _verify_project_ownership(db, project_id, user_id)
    session = ChatSession(
        id=uuid.uuid4(),
        user_id=user_id,
        project_id=project_id,
        mode=data.mode,
        title=data.title,
    )
    db.add(session)
    await db.commit()
    return await get_session(db, session.id, user_id)


async def list_sessions(
    db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID
) -> list[ChatSession]:
    await _verify_project_ownership(db, project_id, user_id)
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.project_id == project_id, ChatSession.user_id == user_id)
        .options(selectinload(ChatSession.query_runs))
        .order_by(ChatSession.updated_at.desc())
    )
    return list(result.scalars().unique().all())


async def get_session(
    db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID
) -> ChatSession:
    return await _verify_session_ownership(db, session_id, user_id)


async def update_session(
    db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID, data: ChatSessionUpdate
) -> ChatSession:
    session = await _verify_session_ownership(db, session_id, user_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(session, field, value)
    _touch_session(session)
    await db.commit()
    return await get_session(db, session_id, user_id)


async def finish_session(
    db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID
) -> ChatSession:
    session = await _verify_session_ownership(db, session_id, user_id)
    session.status = "finished"
    session.ended_at = _now()
    _touch_session(session)
    await db.commit()
    return await get_session(db, session_id, user_id)


async def delete_session(
    db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID
) -> None:
    session = await _verify_session_ownership(db, session_id, user_id)
    await db.delete(session)
    await db.commit()


async def add_message(
    db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID, data: ChatMessageCreate
) -> ChatMessage:
    session = await _verify_session_ownership(db, session_id, user_id)
    msg = ChatMessage(
        id=uuid.uuid4(),
        session_id=session_id,
        sender=data.sender,
        message_type=data.message_type,
        content=data.content,
        msg_metadata=data.metadata,
    )
    db.add(msg)
    _touch_session(session)
    await db.commit()
    await db.refresh(msg)
    return msg


async def list_messages(
    db: AsyncSession, session_id: uuid.UUID, user_id: uuid.UUID
) -> list[ChatMessage]:
    await _verify_session_ownership(db, session_id, user_id)
    result = await db.execute(
        select(ChatMessage)
        .where(ChatMessage.session_id == session_id)
        .order_by(ChatMessage.created_at.asc())
    )
    return list(result.scalars().all())


async def start_query(
    db: AsyncSession,
    user_id: uuid.UUID,
    project_id: uuid.UUID,
    data: QueryStartRequest,
) -> tuple[ChatSession, QueryRun, ChatMessage]:
    await _verify_project_ownership(db, project_id, user_id)

    if data.question_key not in QUERY_QUESTION_CATALOG:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Pergunta fixa inválida para o modo consulta.",
        )

    session: ChatSession
    if data.session_id:
        session = await _verify_session_ownership(db, uuid.UUID(data.session_id), user_id)
        if session.project_id != project_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Sessão não pertence ao projeto informado.",
            )
        if session.mode != "query":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Apenas sessões de consulta aceitam esse fluxo.",
            )
    else:
        session = ChatSession(
            id=uuid.uuid4(),
            user_id=user_id,
            project_id=project_id,
            mode="query",
            title=data.question_text,
        )
        db.add(session)
        await db.flush()

    active_run = await _get_active_session_run(db, session.id)
    if active_run:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe uma consulta em andamento nesta sessão.",
        )

    question_message = ChatMessage(
        id=uuid.uuid4(),
        session_id=session.id,
        sender="user",
        message_type="query_question",
        content=data.question_text,
        msg_metadata={
            "question_key": data.question_key,
            "status": "submitted",
        },
    )
    db.add(question_message)
    await db.flush()

    run = QueryRun(
        id=uuid.uuid4(),
        session_id=session.id,
        question_message_id=question_message.id,
        status="pending",
        question_key=data.question_key,
        question_text=data.question_text,
    )
    db.add(run)
    question_message.msg_metadata = {
        **(question_message.msg_metadata or {}),
        "run_id": str(run.id),
    }
    if not session.title:
        session.title = data.question_text
    _touch_session(session)

    await db.commit()

    session = await get_session(db, session.id, user_id)
    await db.refresh(question_message)
    await db.refresh(run)
    _launch_query_run(run.id)
    return session, run, question_message


async def get_query_run(
    db: AsyncSession, run_id: uuid.UUID, user_id: uuid.UUID
) -> QueryRun:
    return await _verify_query_run_ownership(db, run_id, user_id)


async def cancel_query_run(
    db: AsyncSession, run_id: uuid.UUID, user_id: uuid.UUID
) -> tuple[QueryRun, ChatMessage | None]:
    run = await _verify_query_run_ownership(db, run_id, user_id)

    if run.status in TERMINAL_RUN_STATUSES:
        return run, None

    run.status = "cancelled"
    run.cancelled_at = _now()
    run.completed_at = run.completed_at or run.cancelled_at
    cancellation_message = ChatMessage(
        id=uuid.uuid4(),
        session_id=run.session_id,
        sender="system",
        message_type="query_cancelled",
        content="Consulta cancelada pelo usuário.",
        msg_metadata={
            "run_id": str(run.id),
            "question_key": run.question_key,
            "status": "cancelled",
        },
    )
    db.add(cancellation_message)
    await db.flush()

    run.response_message_id = cancellation_message.id
    run.result_metadata = {"status": "cancelled"}
    _touch_session(run.session)
    await db.commit()
    await db.refresh(run)
    await db.refresh(cancellation_message)

    task = RUNNING_QUERY_TASKS.get(str(run.id))
    if task and not task.done():
        task.cancel()

    return run, cancellation_message
