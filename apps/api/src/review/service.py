"""
Legora AI — Review Service.

Business logic for the human-in-the-loop review workflow.
"""

import uuid

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.common.exceptions import NotFoundError
from src.contracts.models import Contract, ContractStatus
from src.review.models import ReviewItem, ReviewStatus
from src.review.schemas import ReviewDecision


async def create_review_items_from_clauses(
    db: AsyncSession,
    contract_id: uuid.UUID,
    tenant_id: uuid.UUID,
    clauses: list[dict],
) -> list[ReviewItem]:
    """Create review items from extracted clause data."""
    items = []
    for clause in clauses:
        item = ReviewItem(
            contract_id=contract_id,
            tenant_id=tenant_id,
            clause_type=clause.get("clause_type", "unknown"),
            clause_title=clause.get("title"),
            ai_suggestion=clause.get("content", ""),
            ai_risk_level=clause.get("risk_level", "low"),
            confidence_score=clause.get("confidence", None),
            page_number=clause.get("page_number"),
            status=ReviewStatus.PENDING,
        )
        db.add(item)
        items.append(item)

    await db.flush()
    return items


async def get_review_items(
    db: AsyncSession,
    contract_id: uuid.UUID,
    tenant_id: uuid.UUID,
    status_filter: ReviewStatus | None = None,
) -> list[ReviewItem]:
    """Get all review items for a contract."""
    query = select(ReviewItem).where(
        ReviewItem.contract_id == contract_id,
        ReviewItem.tenant_id == tenant_id,
    )
    if status_filter:
        query = query.where(ReviewItem.status == status_filter)

    query = query.order_by(ReviewItem.created_at)
    result = await db.execute(query)
    return list(result.scalars().all())


async def submit_review_decision(
    db: AsyncSession,
    item_id: uuid.UUID,
    tenant_id: uuid.UUID,
    reviewer_id: uuid.UUID,
    decision: ReviewDecision,
) -> ReviewItem:
    """Submit a human review decision for a review item."""
    result = await db.execute(
        select(ReviewItem).where(
            ReviewItem.id == item_id,
            ReviewItem.tenant_id == tenant_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise NotFoundError(resource="ReviewItem", resource_id=str(item_id))

    item.status = decision.status
    item.human_decision = decision.status.value
    item.human_edit = decision.human_edit
    item.reviewer_id = reviewer_id
    item.reviewer_comment = decision.comment
    await db.flush()
    await db.refresh(item)
    return item


async def finalize_review(
    db: AsyncSession,
    contract_id: uuid.UUID,
    tenant_id: uuid.UUID,
) -> dict:
    """
    Finalize the review for a contract.
    Checks that all items have been reviewed.
    """
    items = await get_review_items(db, contract_id, tenant_id)

    pending = [i for i in items if i.status == ReviewStatus.PENDING]
    if pending:
        return {
            "finalized": False,
            "message": f"{len(pending)} items still pending review",
            "pending_count": len(pending),
        }

    # Update contract status
    result = await db.execute(
        select(Contract).where(
            Contract.id == contract_id,
            Contract.tenant_id == tenant_id,
        )
    )
    contract = result.scalar_one_or_none()
    if contract:
        # If any items were rejected or escalated, mark as in_review
        rejected = any(i.status in (ReviewStatus.REJECTED, ReviewStatus.ESCALATED) for i in items)
        contract.status = ContractStatus.IN_REVIEW if rejected else ContractStatus.APPROVED

    accepted = sum(1 for i in items if i.status == ReviewStatus.ACCEPTED)
    edited = sum(1 for i in items if i.status == ReviewStatus.EDITED)
    rejected = sum(1 for i in items if i.status == ReviewStatus.REJECTED)
    escalated = sum(1 for i in items if i.status == ReviewStatus.ESCALATED)

    return {
        "finalized": True,
        "contract_status": contract.status.value if contract else None,
        "summary": {
            "total": len(items),
            "accepted": accepted,
            "edited": edited,
            "rejected": rejected,
            "escalated": escalated,
        },
    }
