"""
Legora AI — Document Models.

SQLAlchemy models for document chunks and metadata.
"""

import enum
import uuid

from pgvector.sqlalchemy import Vector
from sqlalchemy import Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.config import get_settings
from src.database import BaseModel, TenantMixin

settings = get_settings()


class ClauseType(str, enum.Enum):
    """Standard contract clause categories."""

    DEFINITIONS = "definitions"
    SCOPE_OF_WORK = "scope_of_work"
    PAYMENT_TERMS = "payment_terms"
    TERMINATION = "termination"
    CONFIDENTIALITY = "confidentiality"
    INDEMNIFICATION = "indemnification"
    LIABILITY = "liability"
    WARRANTY = "warranty"
    INTELLECTUAL_PROPERTY = "intellectual_property"
    GOVERNING_LAW = "governing_law"
    DISPUTE_RESOLUTION = "dispute_resolution"
    FORCE_MAJEURE = "force_majeure"
    RENEWAL = "renewal"
    ASSIGNMENT = "assignment"
    INSURANCE = "insurance"
    DATA_PROTECTION = "data_protection"
    NON_COMPETE = "non_compete"
    NON_SOLICITATION = "non_solicitation"
    REPRESENTATIONS = "representations"
    MISCELLANEOUS = "miscellaneous"
    UNKNOWN = "unknown"


class DocumentChunk(BaseModel, TenantMixin):
    """A chunk of text extracted from a contract document, with its embedding."""

    __tablename__ = "document_chunks"

    contract_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("contracts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    section_header: Mapped[str | None] = mapped_column(String(500), nullable=True)
    clause_type: Mapped[ClauseType] = mapped_column(
        Enum(ClauseType), default=ClauseType.UNKNOWN, nullable=False
    )
    embedding: Mapped[list | None] = mapped_column(
        Vector(settings.embedding_dimension), nullable=True
    )
    source_offset_start: Mapped[int | None] = mapped_column(Integer, nullable=True)
    source_offset_end: Mapped[int | None] = mapped_column(Integer, nullable=True)
    token_count: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Relationships
    contract = relationship("Contract", back_populates="chunks")


class DocumentMetadata(BaseModel, TenantMixin):
    """Metadata about a processed document."""

    __tablename__ = "document_metadata"

    contract_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("contracts.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    detected_language: Mapped[str | None] = mapped_column(String(10), nullable=True)
    document_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    ocr_applied: Mapped[bool] = mapped_column(default=False, nullable=False)
    page_count: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_chunks: Mapped[int | None] = mapped_column(Integer, nullable=True)
    extraction_quality_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    total_tokens: Mapped[int | None] = mapped_column(Integer, nullable=True)
