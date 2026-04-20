import secrets
import uuid
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

settings = get_settings()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {"sub": subject, "exp": expire, "type": "access"}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "access":
            return None
        return payload
    except JWTError:
        return None


def generate_refresh_token_secret() -> str:
    return secrets.token_urlsafe(64)


def build_refresh_token(token_id: uuid.UUID, secret: str) -> str:
    return f"{token_id}.{secret}"


def parse_refresh_token(raw_token: str) -> tuple[uuid.UUID, str] | None:
    token_id, separator, secret = raw_token.partition(".")
    if not separator or not secret:
        return None

    try:
        return uuid.UUID(token_id), secret
    except ValueError:
        return None


def hash_refresh_token(token: str) -> str:
    return pwd_context.hash(token)


def verify_refresh_token(token: str, hashed: str) -> bool:
    return pwd_context.verify(token, hashed)


def refresh_token_expires_at() -> datetime:
    return datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
