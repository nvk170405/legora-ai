"""
Legora AI — Review Models.

SQLAlchemy models for the human-in-the-loop review workflow.
"""

import enum
import uuid

from sqlalchemy import Enum, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import BaseModel, TenantMixin


class ReviewStatus(str, enum.Enum):
    """Review decision status."""

    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EDITED = "edited"
    ESCALATED = "escalated"


class ReviewItem(BaseModel, TenantMixin):
    """A single reviewable item (clause or suggestion) within a contract review."""

    __tablename__ = "review_items"

    contract_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("contracts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # AI suggestion
    clause_type: Mapped[str] = mapped_column(String(100), nullable=False)
    clause_title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    ai_suggestion: Mapped[str] = mapped_column(Text, nullable=False)
    ai_risk_level: Mapped[str | None] = mapped_column(String(20), nullable=True)
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    page_number: Mapped[int | None] = mapped_column(nullable=True)

    # Human review
    status: Mapped[ReviewStatus] = mapped_column(
        Enum(ReviewStatus), default=ReviewStatus.PENDING, nullable=False
    )
    human_decision: Mapped[str | None] = mapped_column(String(20), nullable=True)
    human_edit: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewer_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    reviewer_comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    contract = relationship("Contract", back_populates="review_items")
