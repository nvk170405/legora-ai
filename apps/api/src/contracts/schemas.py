"""
Legora AI — Contract Schemas.

Pydantic models for contract API request/response validation.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from src.contracts.models import ContractStatus, ContractType


class ContractCreate(BaseModel):
    """Schema for creating a contract (metadata sent alongside file upload)."""

    title: str = Field(min_length=1, max_length=500)
    contract_type: ContractType = ContractType.OTHER


class ContractResponse(BaseModel):
    """Schema for a contract in API responses."""

    id: uuid.UUID
    title: str
    contract_type: ContractType
    status: ContractStatus
    uploaded_by: uuid.UUID
    original_filename: str
    file_size: int
    mime_type: str
    page_count: int | None = None
    summary: str | None = None
    risk_score: float | None = None
    detected_language: str | None = None
    processing_error: str | None = None
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ContractSummaryResponse(BaseModel):
    """Lightweight contract response for list views."""

    id: uuid.UUID
    title: str
    contract_type: ContractType
    status: ContractStatus
    original_filename: str
    risk_score: float | None = None
    page_count: int | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ContractStats(BaseModel):
    """Dashboard statistics for contracts."""

    total: int = 0
    uploaded: int = 0
    processing: int = 0
    analyzed: int = 0
    in_review: int = 0
    approved: int = 0
    rejected: int = 0
    high_risk: int = 0
