from pydantic_settings import BaseSettings
from pydantic import field_validator
from typing import List
from functools import lru_cache
import json
import os


class Settings(BaseSettings):
    APP_NAME: str = "NeuroChat AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Ollama
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    DEFAULT_MODEL: str = "llama3.2"
    DEFAULT_EMBEDDING_MODEL: str = "nomic-embed-text"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./neurochat.db"

    # File uploads
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 50 * 1024 * 1024  # 50 MB
    ALLOWED_EXTENSIONS: List[str] = [".pdf", ".txt", ".md", ".docx", ".csv"]

    # ChromaDB
    CHROMA_PERSIST_DIR: str = "./chroma_db"

    # CORS — accepts JSON array string or comma-separated string from env vars
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:80",
    ]

    # Rate limiting
    RATE_LIMIT: str = "60/minute"

    @field_validator("CORS_ORIGINS", "ALLOWED_EXTENSIONS", mode="before")
    @classmethod
    def parse_list(cls, v):
        if isinstance(v, str):
            v = v.strip()
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except json.JSONDecodeError:
                pass
            # Fallback: comma-separated
            return [item.strip() for item in v.split(",") if item.strip()]
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)
