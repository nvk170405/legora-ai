"""
Legora AI — Analysis Service.

Core AI analysis operations: summarization, clause extraction, Q&A, risk assessment.
"""

import json
import logging
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from src.analysis.llm import get_llm
from src.analysis.prompts import (
    SYSTEM_EXTRACT_CLAUSES,
    SYSTEM_QA,
    SYSTEM_RISK,
    SYSTEM_SUMMARIZE,
    USER_EXTRACT_CLAUSES,
    USER_QA,
    USER_RISK,
    USER_SUMMARIZE,
)
from src.analysis.rag import build_context, build_full_context, retrieve_relevant_chunks
from src.analysis.schemas import (
    Citation,
    ClauseExtractionResponse,
    ClauseItem,
    MissingClause,
    QAResponse,
    RiskAssessmentResponse,
    RiskFactor,
    SummaryResponse,
)
from src.contracts.models import Contract, ContractStatus
from src.documents.service import get_chunks

logger = logging.getLogger(__name__)


async def summarize_contract(
    db: AsyncSession,
    contract_id: uuid.UUID,
    tenant_id: uuid.UUID,
) -> SummaryResponse:
    """Generate a comprehensive summary of a contract."""
    chunks = await get_chunks(db, contract_id, tenant_id)
    if not chunks:
        raise ValueError("No document chunks found. Process the document first.")

    # Build full contract text from chunks
    contract_text = build_full_context(chunks)

    # Truncate if too long (keep first ~6000 tokens worth)
    max_chars = 24000
    if len(contract_text) > max_chars:
        contract_text = contract_text[:max_chars] + "\n\n[... document truncated for summarization ...]"

    # Generate summary
    llm = get_llm()
    summary = await llm.generate(
        system_prompt=SYSTEM_SUMMARIZE,
        user_prompt=USER_SUMMARIZE.format(contract_text=contract_text),
        temperature=0.1,
        max_tokens=1500,
    )

    # Update contract with summary
    from sqlalchemy import select
    result = await db.execute(
        select(Contract).where(Contract.id == contract_id, Contract.tenant_id == tenant_id)
    )
    contract = result.scalar_one_or_none()
    if contract:
        contract.summary = summary

    # Build citations from chunks used
    citations = [
        Citation(
            chunk_id=str(c.id),
            page_number=c.page_number,
            section_header=c.section_header,
            clause_type=c.clause_type.value,
        )
        for c in chunks[:10]
    ]

    return SummaryResponse(
        contract_id=contract_id,
        summary=summary,
        citations=citations,
    )


async def extract_clauses(
    db: AsyncSession,
    contract_id: uuid.UUID,
    tenant_id: uuid.UUID,
) -> ClauseExtractionResponse:
    """Extract and categorize all key clauses from a contract."""
    chunks = await get_chunks(db, contract_id, tenant_id)
    if not chunks:
        raise ValueError("No document chunks found. Process the document first.")

    contract_text = build_full_context(chunks)

    max_chars = 24000
    if len(contract_text) > max_chars:
        contract_text = contract_text[:max_chars] + "\n\n[... document truncated ...]"

    llm = get_llm()
    response_text = await llm.generate_structured(
        system_prompt=SYSTEM_EXTRACT_CLAUSES,
        user_prompt=USER_EXTRACT_CLAUSES.format(contract_text=contract_text),
        temperature=0.0,
        max_tokens=4000,
    )

    # Parse JSON response
    try:
        parsed = json.loads(response_text)
        clauses = [ClauseItem(**c) for c in parsed.get("clauses", [])]
    except (json.JSONDecodeError, Exception) as e:
        logger.error(f"Failed to parse clause extraction response: {e}")
        clauses = []

    return ClauseExtractionResponse(
        contract_id=contract_id,
        clauses=clauses,
        total_clauses=len(clauses),
    )


async def answer_question(
    db: AsyncSession,
    contract_id: uuid.UUID,
    tenant_id: uuid.UUID,
    question: str,
) -> QAResponse:
    """Answer a question about a contract using RAG."""
    # Retrieve relevant chunks
    relevant_chunks = await retrieve_relevant_chunks(
        db=db,
        contract_id=contract_id,
        tenant_id=tenant_id,
        query=question,
        top_k=5,
    )

    if not relevant_chunks:
        return QAResponse(
            contract_id=contract_id,
            question=question,
            answer="No relevant information found in the document. Please ensure the document has been processed.",
            citations=[],
        )

    # Build context from retrieved chunks
    context = build_context(relevant_chunks)

    # Generate answer
    llm = get_llm()
    answer = await llm.generate(
        system_prompt=SYSTEM_QA,
        user_prompt=USER_QA.format(context=context, question=question),
        temperature=0.1,
        max_tokens=1500,
    )

    # Build citations
    citations = [
        Citation(
            chunk_id=str(c.id),
            page_number=c.page_number,
            section_header=c.section_header,
            clause_type=c.clause_type.value,
            text_span=c.content[:200],
        )
        for c in relevant_chunks
    ]

    return QAResponse(
        contract_id=contract_id,
        question=question,
        answer=answer,
        citations=citations,
    )


async def assess_risk(
    db: AsyncSession,
    contract_id: uuid.UUID,
    tenant_id: uuid.UUID,
) -> RiskAssessmentResponse:
    """Perform a risk assessment on a contract."""
    chunks = await get_chunks(db, contract_id, tenant_id)
    if not chunks:
        raise ValueError("No document chunks found. Process the document first.")

    contract_text = build_full_context(chunks)

    max_chars = 24000
    if len(contract_text) > max_chars:
        contract_text = contract_text[:max_chars] + "\n\n[... document truncated ...]"

    llm = get_llm()
    response_text = await llm.generate_structured(
        system_prompt=SYSTEM_RISK,
        user_prompt=USER_RISK.format(contract_text=contract_text),
        temperature=0.0,
        max_tokens=4000,
    )

    # Parse JSON response
    try:
        parsed = json.loads(response_text)
        risk_factors = [RiskFactor(**rf) for rf in parsed.get("risk_factors", [])]
        missing_clauses = [MissingClause(**mc) for mc in parsed.get("missing_clauses", [])]
        overall_score = float(parsed.get("overall_risk_score", 0.5))
        risk_level = parsed.get("risk_level", "medium")
        risk_summary = parsed.get("risk_summary", "")
    except (json.JSONDecodeError, Exception) as e:
        logger.error(f"Failed to parse risk assessment response: {e}")
        overall_score = 0.5
        risk_level = "medium"
        risk_summary = "Unable to complete risk assessment."
        risk_factors = []
        missing_clauses = []

    # Update contract risk score
    from sqlalchemy import select
    result = await db.execute(
        select(Contract).where(Contract.id == contract_id, Contract.tenant_id == tenant_id)
    )
    contract = result.scalar_one_or_none()
    if contract:
        contract.risk_score = overall_score

    return RiskAssessmentResponse(
        contract_id=contract_id,
        overall_risk_score=overall_score,
        risk_level=risk_level,
        risk_summary=risk_summary,
        risk_factors=risk_factors,
        missing_clauses=missing_clauses,
    )
