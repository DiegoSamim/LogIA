from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import get_settings
import app.models  # noqa: F401 — registers all mappers before routers load
from app.routers import auth, catalog, chat, projects, tasks, users

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    upload_path = Path(settings.UPLOAD_DIR)
    upload_path.mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title="LogIA API",
    version="0.1.0",
    lifespan=lifespan,
)

origins = [settings.FRONTEND_URL] + [o.strip() for o in settings.EXTRA_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["projects"])
app.include_router(tasks.router, prefix="/api/v1", tags=["tasks"])
app.include_router(chat.router, prefix="/api/v1", tags=["chat"])
app.include_router(catalog.router, prefix="/api/v1", tags=["catalog"])


upload_path = Path(settings.UPLOAD_DIR)
upload_path.mkdir(parents=True, exist_ok=True)
app.mount("/files", StaticFiles(directory=str(upload_path)), name="files")


@app.get("/health")
async def health():
    return {"status": "ok"}
