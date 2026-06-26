"""
Legora AI — Review Schemas.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from src.review.models import ReviewStatus


class ReviewItemResponse(BaseModel):
    """Schema for a review item in API responses."""

    id: uuid.UUID
    contract_id: uuid.UUID
    clause_type: str
    clause_title: str | None = None
    ai_suggestion: str
    ai_risk_level: str | None = None
    confidence_score: float | None = None
    page_number: int | None = None
    status: ReviewStatus
    human_decision: str | None = None
    human_edit: str | None = None
    reviewer_id: uuid.UUID | None = None
    reviewer_comment: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ReviewDecision(BaseModel):
    """Schema for submitting a review decision."""

    status: ReviewStatus
    human_edit: str | None = None
    comment: str | None = Field(default=None, max_length=2000)
