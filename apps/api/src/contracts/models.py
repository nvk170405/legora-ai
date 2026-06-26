"""
Legora AI — Contract Models.

SQLAlchemy models for contract management.
"""

import enum
import uuid

from sqlalchemy import Enum, Float, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import BaseModel, TenantMixin


class ContractStatus(str, enum.Enum):
    """Contract lifecycle status."""

    UPLOADED = "uploaded"
    PROCESSING = "processing"
    ANALYZED = "analyzed"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    REJECTED = "rejected"


class ContractType(str, enum.Enum):
    """Supported contract types."""

    NDA = "nda"
    VENDOR_AGREEMENT = "vendor_agreement"
    EMPLOYMENT = "employment"
    LEASE = "lease"
    SLA = "sla"
    MSA = "master_service_agreement"
    SOW = "statement_of_work"
    LICENSE = "license"
    OTHER = "other"


class Contract(BaseModel, TenantMixin):
    """A contract document uploaded for analysis."""

    __tablename__ = "contracts"

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    contract_type: Mapped[ContractType] = mapped_column(
        Enum(ContractType), default=ContractType.OTHER, nullable=False
    )
    status: Mapped[ContractStatus] = mapped_column(
        Enum(ContractStatus), default=ContractStatus.UPLOADED, nullable=False
    )
    uploaded_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False, index=True)

    # File metadata
    file_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    page_count: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Analysis results (populated after processing)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    risk_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    detected_language: Mapped[str | None] = mapped_column(String(10), nullable=True)
    processing_error: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    chunks = relationship("DocumentChunk", back_populates="contract", cascade="all, delete-orphan")
    review_items = relationship("ReviewItem", back_populates="contract", cascade="all, delete-orphan")
