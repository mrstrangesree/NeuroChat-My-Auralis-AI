from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from loguru import logger
import sys
import os

from app.config import settings
from app.database import init_db
from app.routers import chat, conversations, ollama_models, documents

# ── Logging ──────────────────────────────────────────────────────────────────
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level}</level> | {message}",
    level="INFO" if not settings.DEBUG else "DEBUG",
    colorize=True,
)
logger.add("logs/neurochat.log", rotation="10 MB", retention="7 days", level="DEBUG")
os.makedirs("logs", exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    await init_db()

    # Check Ollama connectivity
    from app.services.ollama_service import ollama_service
    is_ok = await ollama_service.health_check()
    if is_ok:
        logger.info("✅ Ollama connected successfully")
    else:
        logger.warning("⚠️  Ollama not reachable — please start Ollama!")

    yield
    logger.info("🛑 Shutting down...")


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="A full-featured local AI assistant powered by Ollama",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(chat.router)
app.include_router(conversations.router)
app.include_router(ollama_models.router)
app.include_router(documents.router)


# ── Health Check ──────────────────────────────────────────────────────────────
@app.get("/api/health")
async def health():
    from app.services.ollama_service import ollama_service
    ollama_ok = await ollama_service.health_check()
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "ollama": "connected" if ollama_ok else "disconnected",
    }


@app.get("/api/info")
async def info():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "default_model": settings.DEFAULT_MODEL,
        "features": {
            "rag": True,
            "web_search": True,
            "streaming": True,
            "document_upload": True,
        },
    }
