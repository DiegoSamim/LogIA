import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    build_refresh_token,
    create_access_token,
    generate_refresh_token_secret,
    hash_password,
    hash_refresh_token,
    parse_refresh_token,
    refresh_token_expires_at,
    verify_password,
    verify_refresh_token,
)
from app.models.user import RefreshToken, User
from app.schemas.auth import LoginRequest, RegisterRequest


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def _cleanup_refresh_tokens(db: AsyncSession, user_id: uuid.UUID) -> None:
    await db.execute(
        delete(RefreshToken).where(
            RefreshToken.user_id == user_id,
            (RefreshToken.revoked_at.is_not(None)) | (RefreshToken.expires_at <= _now()),
        )
    )


async def _find_refresh_token(
    db: AsyncSession, raw_token: str
) -> RefreshToken | None:
    parsed = parse_refresh_token(raw_token)
    if parsed:
        token_id, secret = parsed
        token = await db.get(RefreshToken, token_id)
        if not token or token.revoked_at is not None or token.expires_at <= _now():
            return None
        if not verify_refresh_token(secret, token.token_hash):
            return None
        return token

    # Legacy fallback for older cookies issued before token-id lookup.
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.revoked_at.is_(None),
            RefreshToken.expires_at > _now(),
        )
    )
    for token in result.scalars().all():
        if verify_refresh_token(raw_token, token.token_hash):
            return token
    return None


async def register(db: AsyncSession, data: RegisterRequest) -> tuple[User, str, str]:
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email já cadastrado.",
        )

    user = User(
        id=uuid.uuid4(),
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    await db.flush()

    access_token, raw_refresh = await _issue_tokens(db, user)
    await db.commit()
    await db.refresh(user)
    return user, access_token, raw_refresh


async def login(
    db: AsyncSession, data: LoginRequest, user_agent: str | None, ip: str | None
) -> tuple[User, str, str]:
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta desativada.",
        )

    access_token, raw_refresh = await _issue_tokens(db, user, user_agent=user_agent, ip=ip)
    await db.commit()
    return user, access_token, raw_refresh


async def refresh(db: AsyncSession, raw_token: str) -> tuple[User, str, str]:
    matched = await _find_refresh_token(db, raw_token)
    if not matched:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido ou expirado.",
        )

    user = await db.get(User, matched.user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado ou inativo.",
        )

    await db.delete(matched)
    await _cleanup_refresh_tokens(db, user.id)
    access_token, raw_refresh = await _issue_tokens(db, user)
    await db.commit()
    return user, access_token, raw_refresh


async def logout(db: AsyncSession, raw_token: str | None) -> None:
    if not raw_token:
        return

    matched = await _find_refresh_token(db, raw_token)
    if not matched:
        return

    user_id = matched.user_id
    await db.delete(matched)
    await _cleanup_refresh_tokens(db, user_id)
    await db.commit()


async def _issue_tokens(
    db: AsyncSession,
    user: User,
    user_agent: str | None = None,
    ip: str | None = None,
) -> tuple[str, str]:
    token_id = uuid.uuid4()
    refresh_secret = generate_refresh_token_secret()
    rt = RefreshToken(
        id=token_id,
        user_id=user.id,
        token_hash=hash_refresh_token(refresh_secret),
        expires_at=refresh_token_expires_at(),
        created_at=_now(),
        user_agent=user_agent,
        ip_address=ip,
    )
    db.add(rt)
    await _cleanup_refresh_tokens(db, user.id)
    access_token = create_access_token(str(user.id))
    raw_refresh = build_refresh_token(token_id, refresh_secret)
    return access_token, raw_refresh
