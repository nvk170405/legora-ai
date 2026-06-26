"""
Legora AI — Document Processing Router.

API endpoints for triggering document processing and retrieving results.
"""

import uuid
from typing import Annotated

from fastapi import APIRouter, BackgroundTasks, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.dependencies import CurrentUser
from src.database import get_db
from src.documents.models import ClauseType
from src.documents.service import get_chunks, get_processing_status, process_contract

router = APIRouter(prefix="/documents", tags=["Document Processing"])


@router.post("/{contract_id}/process")
async def trigger_processing(
    contract_id: str,
    background_tasks: BackgroundTasks,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """
    Trigger document processing for a contract.
    Processing runs synchronously for now; will be moved to background tasks.
    """
    result = await process_contract(
        db=db,
        contract_id=uuid.UUID(contract_id),
        tenant_id=current_user.tenant_id,
    )
    return {"message": "Document processed successfully", **result}


@router.get("/{contract_id}/chunks")
async def list_chunks(
    contract_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    clause_type: ClauseType | None = Query(default=None),
):
    """Retrieve document chunks for a contract."""
    chunks = await get_chunks(
        db=db,
        contract_id=uuid.UUID(contract_id),
        tenant_id=current_user.tenant_id,
        clause_type=clause_type,
    )
    return {
        "contract_id": contract_id,
        "total_chunks": len(chunks),
        "chunks": [
            {
                "id": str(c.id),
                "chunk_index": c.chunk_index,
                "content": c.content,
                "page_number": c.page_number,
                "section_header": c.section_header,
                "clause_type": c.clause_type.value,
                "token_count": c.token_count,
            }
            for c in chunks
        ],
    }


@router.get("/{contract_id}/status")
async def processing_status(
    contract_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get the processing status for a contract."""
    return await get_processing_status(
        db=db,
        contract_id=uuid.UUID(contract_id),
        tenant_id=current_user.tenant_id,
    )
