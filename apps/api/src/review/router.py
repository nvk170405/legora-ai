"""
Legora AI — Review Router.

API endpoints for the human-in-the-loop review workflow.
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.dependencies import CurrentUser
from src.database import get_db
from src.review.models import ReviewStatus
from src.review.schemas import ReviewDecision, ReviewItemResponse
from src.review.service import (
    finalize_review,
    get_review_items,
    submit_review_decision,
)

router = APIRouter(prefix="/review", tags=["Review Workflow"])


@router.get("/{contract_id}/items", response_model=list[ReviewItemResponse])
async def list_review_items(
    contract_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    status: ReviewStatus | None = Query(default=None),
):
    """Get all review items for a contract."""
    items = await get_review_items(
        db=db,
        contract_id=uuid.UUID(contract_id),
        tenant_id=current_user.tenant_id,
        status_filter=status,
    )
    return [ReviewItemResponse.model_validate(item) for item in items]


@router.patch("/items/{item_id}", response_model=ReviewItemResponse)
async def review_item(
    item_id: str,
    decision: ReviewDecision,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Submit a review decision for a single item."""
    item = await submit_review_decision(
        db=db,
        item_id=uuid.UUID(item_id),
        tenant_id=current_user.tenant_id,
        reviewer_id=current_user.id,
        decision=decision,
    )
    return ReviewItemResponse.model_validate(item)


@router.post("/{contract_id}/finalize")
async def finalize(
    contract_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Finalize the review for a contract."""
    return await finalize_review(
        db=db,
        contract_id=uuid.UUID(contract_id),
        tenant_id=current_user.tenant_id,
    )
