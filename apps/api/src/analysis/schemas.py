"""
Legora AI — Analysis Schemas.

Pydantic models for AI analysis request/response validation.
"""

import uuid
from typing import Any

from pydantic import BaseModel, Field


class Citation(BaseModel):
    """Source citation linking an answer back to the document."""

    chunk_id: str | None = None
    page_number: int | None = None
    section_header: str | None = None
    clause_type: str | None = None
    text_span: str | None = None


class SummaryResponse(BaseModel):
    """Response from contract summarization."""

    contract_id: uuid.UUID
    summary: str
    citations: list[Citation] = []


class ClauseItem(BaseModel):
    """A single extracted clause."""

    clause_type: str
    title: str | None = None
    content: str
    page_number: int | None = None
    risk_level: str = "low"
    summary: str | None = None
    key_values: dict[str, Any] = {}


class ClauseExtractionResponse(BaseModel):
    """Response from clause extraction."""

    contract_id: uuid.UUID
    clauses: list[ClauseItem] = []
    total_clauses: int = 0


class QARequest(BaseModel):
    """Request for contract Q&A."""

    question: str = Field(min_length=3, max_length=1000)


class QAResponse(BaseModel):
    """Response from contract Q&A."""

    contract_id: uuid.UUID
    question: str
    answer: str
    citations: list[Citation] = []
    confidence: float | None = None


class RiskFactor(BaseModel):
    """A single identified risk factor."""

    category: str
    severity: str
    description: str
    clause_reference: str | None = None
    recommendation: str | None = None


class MissingClause(BaseModel):
    """A clause that should be present but is missing."""

    clause_type: str
    importance: str = "recommended"
    recommendation: str | None = None


class RiskAssessmentResponse(BaseModel):
    """Response from risk assessment."""

    contract_id: uuid.UUID
    overall_risk_score: float
    risk_level: str
    risk_summary: str
    risk_factors: list[RiskFactor] = []
    missing_clauses: list[MissingClause] = []
