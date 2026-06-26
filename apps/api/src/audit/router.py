"""
Legora AI — Audit Router.

API endpoint for querying audit logs.
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.dependencies import CurrentUser
from src.audit.service import get_audit_logs
from src.database import get_db

router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get("/logs")
async def list_logs(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    user_id: str | None = Query(default=None),
    action: str | None = Query(default=None),
    resource_type: str | None = Query(default=None),
    resource_id: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
):
    """Query audit logs with optional filters."""
    return await get_audit_logs(
        db=db,
        tenant_id=current_user.tenant_id,
        user_id=uuid.UUID(user_id) if user_id else None,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        page=page,
        page_size=page_size,
    )
