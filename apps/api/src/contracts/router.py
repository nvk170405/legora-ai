"""
Legora AI — Contract Router.

API endpoints for contract upload, listing, and management.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.dependencies import CurrentUser
from src.common.pagination import PaginatedResponse
from src.contracts.models import ContractStatus, ContractType
from src.contracts.schemas import ContractResponse, ContractStats, ContractSummaryResponse
from src.contracts.service import (
    delete_contract,
    get_contract,
    get_contract_stats,
    list_contracts,
    upload_contract,
)
from src.database import get_db

router = APIRouter(prefix="/contracts", tags=["Contracts"])


@router.post("/upload", response_model=ContractResponse, status_code=201)
async def upload(
    file: UploadFile = File(...),
    title: str = Form(...),
    contract_type: ContractType = Form(default=ContractType.OTHER),
    current_user: CurrentUser = None,
    db: AsyncSession = Depends(get_db),
):
    """Upload a contract document for analysis."""
    content = await file.read()
    contract = await upload_contract(
        db=db,
        user_id=current_user.id,
        tenant_id=current_user.tenant_id,
        title=title,
        contract_type=contract_type,
        file_content=content,
        filename=file.filename or "untitled",
        mime_type=file.content_type or "application/octet-stream",
    )
    return ContractResponse.model_validate(contract)


@router.get("/", response_model=PaginatedResponse[ContractSummaryResponse])
async def list_all(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status: ContractStatus | None = Query(default=None),
    contract_type: ContractType | None = Query(default=None, alias="type"),
    search: str | None = Query(default=None),
):
    """List contracts with pagination and optional filters."""
    return await list_contracts(
        db=db,
        tenant_id=current_user.tenant_id,
        page=page,
        page_size=page_size,
        status_filter=status,
        type_filter=contract_type,
        search=search,
    )


@router.get("/stats", response_model=ContractStats)
async def stats(
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get contract dashboard statistics."""
    return await get_contract_stats(db, current_user.tenant_id)


@router.get("/{contract_id}", response_model=ContractResponse)
async def get_one(
    contract_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Get a single contract by ID."""
    import uuid
    contract = await get_contract(db, uuid.UUID(contract_id), current_user.tenant_id)
    return ContractResponse.model_validate(contract)


@router.delete("/{contract_id}", status_code=204)
async def delete_one(
    contract_id: str,
    current_user: CurrentUser,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    """Delete a contract and its associated data."""
    import uuid
    await delete_contract(db, uuid.UUID(contract_id), current_user.tenant_id)
