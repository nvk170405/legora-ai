"""
Legora AI — Audit Middleware.

Automatically logs all mutating API calls (POST, PUT, PATCH, DELETE).
"""

import logging
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger(__name__)


class AuditMiddleware(BaseHTTPMiddleware):
    """Middleware that auto-logs mutating API requests to the audit trail."""

    MUTATING_METHODS = {"POST", "PUT", "PATCH", "DELETE"}
    SKIP_PATHS = {"/auth/login", "/auth/register", "/docs", "/openapi.json", "/health"}

    async def dispatch(self, request: Request, call_next) -> Response:
        # Only audit mutating requests
        if request.method not in self.MUTATING_METHODS:
            return await call_next(request)

        # Skip non-business endpoints
        if any(request.url.path.startswith(p) for p in self.SKIP_PATHS):
            return await call_next(request)

        response = await call_next(request)

        # Log after successful responses
        if 200 <= response.status_code < 400:
            try:
                from src.database import async_session_factory
                from src.audit.service import log_action
                import uuid

                # Extract user info from request state (set by auth dependency)
                user_id = getattr(request.state, "user_id", None)
                user_email = getattr(request.state, "user_email", None)
                tenant_id = getattr(request.state, "tenant_id", None)

                if tenant_id:
                    async with async_session_factory() as db:
                        await log_action(
                            db=db,
                            tenant_id=uuid.UUID(tenant_id) if isinstance(tenant_id, str) else tenant_id,
                            user_id=user_id,
                            user_email=user_email,
                            action=f"{request.method} {request.url.path}",
                            resource_type=_extract_resource_type(request.url.path),
                            resource_id=_extract_resource_id(request.url.path),
                            ip_address=request.client.host if request.client else None,
                            user_agent=request.headers.get("user-agent", "")[:500],
                        )
                        await db.commit()
            except Exception as e:
                # Never let audit logging break the request
                logger.warning(f"Audit logging failed: {e}")

        return response


def _extract_resource_type(path: str) -> str:
    """Extract the resource type from the URL path."""
    parts = path.strip("/").split("/")
    return parts[0] if parts else "unknown"


def _extract_resource_id(path: str) -> str | None:
    """Extract a resource ID from the URL path if present."""
    parts = path.strip("/").split("/")
    for part in parts:
        try:
            # Check if it looks like a UUID
            if len(part) == 36 and part.count("-") == 4:
                return part
        except Exception:
            pass
    return None
