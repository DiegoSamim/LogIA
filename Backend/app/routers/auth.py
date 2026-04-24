from typing import Literal

from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.db.engine import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserResponse
from app.services import auth_service, oauth_service

router = APIRouter()
settings = get_settings()

REFRESH_COOKIE = "refresh_token"
COOKIE_MAX_AGE = 60 * 60 * 24 * settings.REFRESH_TOKEN_EXPIRE_DAYS


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE,
        value=token,
        httponly=True,
        samesite="lax",
        secure=settings.APP_ENV == "production",
        max_age=COOKIE_MAX_AGE,
        path="/api/v1/auth",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=REFRESH_COOKIE,
        path="/api/v1/auth",
    )


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(
    data: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    user, access_token, raw_refresh = await auth_service.register(db, data)
    _set_refresh_cookie(response, raw_refresh)
    return TokenResponse(access_token=access_token)


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    user_agent = request.headers.get("user-agent")
    ip = request.client.host if request.client else None
    user, access_token, raw_refresh = await auth_service.login(db, data, user_agent, ip)
    _set_refresh_cookie(response, raw_refresh)
    return TokenResponse(access_token=access_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    response: Response,
    db: AsyncSession = Depends(get_db),
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE),
):
    if not refresh_token:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token ausente.",
        )
    user, access_token, raw_refresh = await auth_service.refresh(db, refresh_token)
    _set_refresh_cookie(response, raw_refresh)
    return TokenResponse(access_token=access_token)


@router.post("/logout", status_code=204)
async def logout(
    response: Response,
    db: AsyncSession = Depends(get_db),
    refresh_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE),
):
    await auth_service.logout(db, refresh_token)
    _clear_refresh_cookie(response)
    return Response(status_code=204)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    return UserResponse.from_orm(current_user)


# ── OAuth Social Login ────────────────────────────────────────────────────────

@router.get("/{provider}/authorize")
async def oauth_authorize(provider: Literal["google", "github"]):
    state = oauth_service.generate_oauth_state()
    if provider == "google":
        url = oauth_service.get_google_authorize_url(state)
    else:
        url = oauth_service.get_github_authorize_url(state)
    return {"url": url}


@router.get("/{provider}/callback")
async def oauth_callback(
    provider: Literal["google", "github"],
    code: str,
    state: str,
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    if not oauth_service.verify_oauth_state(state):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="State OAuth inválido ou expirado.")

    if provider == "google":
        user_info = await oauth_service.exchange_google_code(code)
    else:
        user_info = await oauth_service.exchange_github_code(code)

    user = await oauth_service.find_or_create_user(
        db,
        provider=provider,
        provider_user_id=user_info["provider_user_id"],
        email=user_info["email"],
        name=user_info["name"],
        avatar_url=user_info.get("avatar_url"),
    )

    user_agent = request.headers.get("user-agent")
    ip = request.client.host if request.client else None
    access_token, raw_refresh = await auth_service._issue_tokens(db, user, user_agent=user_agent, ip=ip)
    await db.commit()

    redirect = RedirectResponse(
        url=f"{settings.FRONTEND_URL}/auth/callback?token={access_token}",
        status_code=302,
    )
    redirect.set_cookie(
        key=REFRESH_COOKIE,
        value=raw_refresh,
        httponly=True,
        samesite="lax",
        secure=settings.APP_ENV == "production",
        max_age=COOKIE_MAX_AGE,
        path="/api/v1/auth",
    )
    return redirect
