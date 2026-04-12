import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    refresh_token_expires_at,
    verify_password,
    verify_refresh_token,
)
from app.models.user import RefreshToken, User
from app.schemas.auth import LoginRequest, RegisterRequest


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
    # Find all non-revoked, non-expired tokens and check hash
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.revoked_at.is_(None),
            RefreshToken.expires_at > datetime.now(timezone.utc),
        )
    )
    tokens = result.scalars().all()

    matched: RefreshToken | None = None
    for rt in tokens:
        if verify_refresh_token(raw_token, rt.token_hash):
            matched = rt
            break

    if not matched:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido ou expirado.",
        )

    # Revoke old token
    matched.revoked_at = datetime.now(timezone.utc)
    db.add(matched)

    user = await db.get(User, matched.user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado ou inativo.",
        )

    access_token, raw_refresh = await _issue_tokens(db, user)
    await db.commit()
    return user, access_token, raw_refresh


async def logout(db: AsyncSession, raw_token: str | None) -> None:
    if not raw_token:
        return

    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.revoked_at.is_(None),
            RefreshToken.expires_at > datetime.now(timezone.utc),
        )
    )
    tokens = result.scalars().all()

    for rt in tokens:
        if verify_refresh_token(raw_token, rt.token_hash):
            rt.revoked_at = datetime.now(timezone.utc)
            db.add(rt)
            await db.commit()
            return


async def _issue_tokens(
    db: AsyncSession,
    user: User,
    user_agent: str | None = None,
    ip: str | None = None,
) -> tuple[str, str]:
    raw_refresh = generate_refresh_token()
    rt = RefreshToken(
        id=uuid.uuid4(),
        user_id=user.id,
        token_hash=hash_refresh_token(raw_refresh),
        expires_at=refresh_token_expires_at(),
        created_at=datetime.now(timezone.utc),
        user_agent=user_agent,
        ip_address=ip,
    )
    db.add(rt)
    access_token = create_access_token(str(user.id))
    return access_token, raw_refresh
