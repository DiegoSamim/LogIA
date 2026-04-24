from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

APP_TIMEZONE = ZoneInfo("America/Sao_Paulo")

STATUS_LABELS: dict[str, str] = {
    "todo": "A fazer",
    "in_progress": "Em andamento",
    "done": "Concluída",
    "blocked": "Bloqueada",
    "cancelled": "Cancelada",
}


def status_label(value: str | None) -> str:
    return STATUS_LABELS.get(value or "", "Status não informado")


def truncate(value: str | None, limit: int = 220) -> str:
    if not value:
        return ""
    normalized = " ".join(value.split())
    if len(normalized) <= limit:
        return normalized
    return f"{normalized[: limit - 1].rstrip()}…"


def today_bounds_utc() -> tuple[datetime, datetime]:
    today = datetime.now(APP_TIMEZONE).date()
    start_local = datetime.combine(today, datetime.min.time(), tzinfo=APP_TIMEZONE)
    end_local = start_local + timedelta(days=1)
    return start_local.astimezone(timezone.utc), end_local.astimezone(timezone.utc)
