import secrets
import uuid
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import HTTPException, status
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.user import OAuthAccount, User

_settings = get_settings


def _now() -> datetime:
    return datetime.now(timezone.utc)


# ── State JWT ─────────────────────────────────────────────────────────────────

def generate_oauth_state() -> str:
    settings = _settings()
    payload = {
        "nonce": secrets.token_hex(16),
        "exp": _now() + timedelta(minutes=10),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def verify_oauth_state(state: str) -> bool:
    settings = _settings()
    try:
        jwt.decode(state, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return True
    except JWTError:
        return False


# ── Authorization URLs ────────────────────────────────────────────────────────

def get_google_authorize_url(state: str) -> str:
    settings = _settings()
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Google OAuth não configurado.")
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": _google_redirect_uri(),
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "select_account",
    }
    return "https://accounts.google.com/o/oauth2/v2/auth?" + _encode_params(params)


def get_github_authorize_url(state: str) -> str:
    settings = _settings()
    if not settings.GITHUB_CLIENT_ID:
        raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="GitHub OAuth não configurado.")
    params = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "redirect_uri": _github_redirect_uri(),
        "scope": "read:user user:email",
        "state": state,
    }
    return "https://github.com/login/oauth/authorize?" + _encode_params(params)


# ── Code Exchange ─────────────────────────────────────────────────────────────

async def exchange_google_code(code: str) -> dict:
    settings = _settings()
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": _google_redirect_uri(),
                "grant_type": "authorization_code",
            },
            timeout=15.0,
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Falha ao trocar código Google.")

    token_data = resp.json()
    id_token = token_data.get("id_token")
    if not id_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="id_token ausente na resposta do Google.")

    # Extract claims without verifying signature — token came directly from Google over HTTPS
    claims = jwt.get_unverified_claims(id_token)
    return {
        "provider_user_id": claims["sub"],
        "email": claims.get("email", ""),
        "name": claims.get("name", ""),
        "avatar_url": claims.get("picture"),
    }


async def exchange_github_code(code: str) -> dict:
    settings = _settings()
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "code": code,
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "redirect_uri": _github_redirect_uri(),
            },
            headers={"Accept": "application/json"},
            timeout=15.0,
        )

    if token_resp.status_code != 200:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Falha ao trocar código GitHub.")

    access_token = token_resp.json().get("access_token")
    if not access_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="access_token ausente na resposta do GitHub.")

    headers = {"Authorization": f"Bearer {access_token}", "Accept": "application/json"}
    async with httpx.AsyncClient() as client:
        user_resp, emails_resp = await _fetch_github_user_and_emails(client, headers)

    user_data = user_resp.json()
    primary_email = _extract_github_primary_email(emails_resp.json(), user_data)

    return {
        "provider_user_id": str(user_data["id"]),
        "email": primary_email,
        "name": user_data.get("name") or user_data.get("login", ""),
        "avatar_url": user_data.get("avatar_url"),
    }


async def _fetch_github_user_and_emails(
    client: httpx.AsyncClient, headers: dict
) -> tuple[httpx.Response, httpx.Response]:
    import asyncio
    user_task = client.get("https://api.github.com/user", headers=headers, timeout=15.0)
    emails_task = client.get("https://api.github.com/user/emails", headers=headers, timeout=15.0)
    return await asyncio.gather(user_task, emails_task)


def _extract_github_primary_email(emails: list, user_data: dict) -> str:
    for entry in emails:
        if entry.get("primary") and entry.get("verified"):
            return entry["email"]
    for entry in emails:
        if entry.get("verified"):
            return entry["email"]
    return user_data.get("email") or ""


# ── Find or Create User ───────────────────────────────────────────────────────

async def find_or_create_user(
    db: AsyncSession,
    provider: str,
    provider_user_id: str,
    email: str,
    name: str,
    avatar_url: str | None,
) -> User:
    # 1. Known OAuth account → return linked user
    result = await db.execute(
        select(OAuthAccount).where(
            OAuthAccount.provider == provider,
            OAuthAccount.provider_user_id == provider_user_id,
        )
    )
    oauth = result.scalar_one_or_none()
    if oauth:
        user = await db.get(User, oauth.user_id)
        if user and not user.is_active:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Conta desativada.")
        return user  # type: ignore[return-value]

    # 2. Existing user by email → link OAuth account to it
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        # 3. New user — create User + OAuthAccount
        user = User(
            id=uuid.uuid4(),
            name=name,
            email=email,
            password_hash=None,
            avatar_url=avatar_url,
        )
        db.add(user)
        await db.flush()

    oauth = OAuthAccount(
        id=uuid.uuid4(),
        user_id=user.id,
        provider=provider,
        provider_user_id=provider_user_id,
        created_at=_now(),
    )
    db.add(oauth)
    await db.flush()
    return user


# ── Helpers ───────────────────────────────────────────────────────────────────

def _encode_params(params: dict) -> str:
    from urllib.parse import urlencode
    return urlencode(params)


def _google_redirect_uri() -> str:
    return "http://localhost:8000/api/v1/auth/google/callback"


def _github_redirect_uri() -> str:
    return "http://localhost:8000/api/v1/auth/github/callback"
