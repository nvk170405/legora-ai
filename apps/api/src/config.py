"""
Legora AI — Application Configuration.

Loads settings from environment variables with Pydantic Settings.
"""

from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Application ──────────────────────────────────────────────
    app_env: Literal["development", "staging", "production"] = "development"
    app_debug: bool = True
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    frontend_url: str = "http://localhost:3000"
    backend_url: str = "http://localhost:8000"

    # ── Database ─────────────────────────────────────────────────
    database_url: str = "postgresql+asyncpg://legora:legora_dev_password@db:5432/legora_db"
    db_pool_size: int = 20
    db_max_overflow: int = 10

    # ── Redis ────────────────────────────────────────────────────
    redis_url: str = "redis://redis:6379/0"

    # ── MinIO ────────────────────────────────────────────────────
    minio_endpoint: str = "minio:9000"
    minio_access_key: str = "legora_minio"
    minio_secret_key: str = "legora_minio_password"
    minio_bucket: str = "legora-documents"
    minio_use_ssl: bool = False

    # ── Auth ─────────────────────────────────────────────────────
    jwt_secret_key: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60

    # ── LLM ──────────────────────────────────────────────────────
    llm_provider: Literal["openai", "groq", "local"] = "openai"
    openai_api_key: str = ""
    groq_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    groq_model: str = "llama-3.3-70b-versatile"

    # ── Embeddings ───────────────────────────────────────────────
    embedding_model: str = "all-MiniLM-L6-v2"
    embedding_dimension: int = 384

    # ── MLflow ───────────────────────────────────────────────────
    mlflow_tracking_uri: str = "http://mlflow:5000"

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"


@lru_cache
def get_settings() -> Settings:
    """Get cached application settings singleton."""
    return Settings()
