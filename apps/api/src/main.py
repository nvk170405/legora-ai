"""
Legora AI — FastAPI Application Entry Point.

Initializes the application with middleware, routers, and lifecycle events.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.audit.middleware import AuditMiddleware
from src.config import get_settings

settings = get_settings()
logger = logging.getLogger("legora")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle — runs on startup and shutdown."""
    # ── Startup ──────────────────────────────────────────────
    logging.basicConfig(
        level=logging.DEBUG if settings.app_debug else logging.INFO,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    )
    logger.info("🚀 Starting Legora AI API...")
    logger.info(f"   Environment: {settings.app_env}")
    logger.info(f"   LLM Provider: {settings.llm_provider}")

    # Initialize database tables (dev only — use Alembic in production)
    if settings.is_development:
        from src.database import init_db
        await init_db()
        logger.info("   Database initialized (dev mode)")

    logger.info("✅ Legora AI API ready")

    yield

    # ── Shutdown ─────────────────────────────────────────────
    logger.info("🛑 Shutting down Legora AI API...")


# ── App Instance ─────────────────────────────────────────────────
app = FastAPI(
    title="Legora AI",
    description="AI-powered contract analysis platform — summarize, extract, question, and assess risk.",
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── Middleware ────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(AuditMiddleware)

# ── Routers ──────────────────────────────────────────────────────
from src.auth.router import router as auth_router
from src.contracts.router import router as contracts_router
from src.documents.router import router as documents_router
from src.analysis.router import router as analysis_router
from src.review.router import router as review_router
from src.audit.router import router as audit_router

app.include_router(auth_router, prefix="/api")
app.include_router(contracts_router, prefix="/api")
app.include_router(documents_router, prefix="/api")
app.include_router(analysis_router, prefix="/api")
app.include_router(review_router, prefix="/api")
app.include_router(audit_router, prefix="/api")


# ── Health Check ─────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "service": "legora-api",
        "version": "0.1.0",
    }


@app.get("/", tags=["System"])
async def root():
    """API root — basic information."""
    return {
        "name": "Legora AI API",
        "version": "0.1.0",
        "docs": "/docs",
    }
