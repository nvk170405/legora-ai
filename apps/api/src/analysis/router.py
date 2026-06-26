"""
Legora AI — Analysis Router.

API endpoints for AI-powered contract analysis.
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.analysis.schemas import (
    ClauseExtractionResponse,
    QARequest,
    QAResponse,
    RiskAssessmentResponse,
    SummaryResponse,
)
from src.analysis.service import (
    answer_question,
    assess_risk,
    extract_clauses,
    summarize_contract,
)
from src.auth.dependencies import CurrentUser
from src.database import get_db

router = APIRouter(prefix="/analysis", tags=["AI Analysis"])


@router.post("/{contract_id}/summarize", response_model=SummaryResponse)
async def summarize(
    contract_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Generate a comprehensive summary of a contract."""
    return await summarize_contract(
        db=db,
        contract_id=uuid.UUID(contract_id),
        tenant_id=current_user.tenant_id,
    )


@router.post("/{contract_id}/extract-clauses", response_model=ClauseExtractionResponse)
async def extract(
    contract_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Extract and categorize all key clauses from a contract."""
    return await extract_clauses(
        db=db,
        contract_id=uuid.UUID(contract_id),
        tenant_id=current_user.tenant_id,
    )


@router.post("/{contract_id}/ask", response_model=QAResponse)
async def ask_question(
    contract_id: str,
    request: QARequest,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Ask a question about a contract (RAG-powered Q&A)."""
    return await answer_question(
        db=db,
        contract_id=uuid.UUID(contract_id),
        tenant_id=current_user.tenant_id,
        question=request.question,
    )


@router.post("/{contract_id}/assess-risk", response_model=RiskAssessmentResponse)
async def risk_assessment(
    contract_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Perform a risk assessment on a contract."""
    return await assess_risk(
        db=db,
        contract_id=uuid.UUID(contract_id),
        tenant_id=current_user.tenant_id,
    )
