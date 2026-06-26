"""
Legora AI — Contract Service.

Business logic for contract CRUD and file management.
"""

import uuid
from io import BytesIO

from minio import Minio
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.common.exceptions import NotFoundError
from src.common.pagination import PaginatedResponse
from src.config import get_settings
from src.contracts.models import Contract, ContractStatus, ContractType
from src.contracts.schemas import ContractStats, ContractSummaryResponse

settings = get_settings()


def get_minio_client() -> Minio:
    """Create a MinIO client."""
    return Minio(
        endpoint=settings.minio_endpoint,
        access_key=settings.minio_access_key,
        secret_key=settings.minio_secret_key,
        secure=settings.minio_use_ssl,
    )


async def upload_contract(
    db: AsyncSession,
    user_id: uuid.UUID,
    tenant_id: uuid.UUID,
    title: str,
    contract_type: ContractType,
    file_content: bytes,
    filename: str,
    mime_type: str,
) -> Contract:
    """Upload a contract file to MinIO and create a database record."""
    # Generate storage path
    file_id = uuid.uuid4()
    file_ext = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
    storage_path = f"{tenant_id}/{file_id}.{file_ext}"

    # Upload to MinIO
    client = get_minio_client()
    if not client.bucket_exists(settings.minio_bucket):
        client.make_bucket(settings.minio_bucket)

    client.put_object(
        bucket_name=settings.minio_bucket,
        object_name=storage_path,
        data=BytesIO(file_content),
        length=len(file_content),
        content_type=mime_type,
    )

    # Create database record
    contract = Contract(
        title=title,
        contract_type=contract_type,
        status=ContractStatus.UPLOADED,
        uploaded_by=user_id,
        file_path=storage_path,
        original_filename=filename,
        file_size=len(file_content),
        mime_type=mime_type,
        tenant_id=tenant_id,
    )
    db.add(contract)
    await db.flush()
    await db.refresh(contract)
    return contract


async def get_contract(
    db: AsyncSession, contract_id: uuid.UUID, tenant_id: uuid.UUID
) -> Contract:
    """Fetch a single contract by ID within a tenant."""
    result = await db.execute(
        select(Contract).where(
            Contract.id == contract_id,
            Contract.tenant_id == tenant_id,
        )
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise NotFoundError(resource="Contract", resource_id=str(contract_id))
    return contract


async def list_contracts(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    page: int = 1,
    page_size: int = 20,
    status_filter: ContractStatus | None = None,
    type_filter: ContractType | None = None,
    search: str | None = None,
) -> PaginatedResponse[ContractSummaryResponse]:
    """List contracts with pagination, filtering, and search."""
    query = select(Contract).where(Contract.tenant_id == tenant_id)
    count_query = select(func.count(Contract.id)).where(Contract.tenant_id == tenant_id)

    if status_filter:
        query = query.where(Contract.status == status_filter)
        count_query = count_query.where(Contract.status == status_filter)
    if type_filter:
        query = query.where(Contract.contract_type == type_filter)
        count_query = count_query.where(Contract.contract_type == type_filter)
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            Contract.title.ilike(search_pattern)
            | Contract.original_filename.ilike(search_pattern)
        )
        count_query = count_query.where(
            Contract.title.ilike(search_pattern)
            | Contract.original_filename.ilike(search_pattern)
        )

    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Get page results
    offset = (page - 1) * page_size
    query = query.order_by(Contract.created_at.desc()).offset(offset).limit(page_size)
    result = await db.execute(query)
    contracts = result.scalars().all()

    items = [ContractSummaryResponse.model_validate(c) for c in contracts]
    return PaginatedResponse.create(items=items, total=total, page=page, page_size=page_size)


async def delete_contract(
    db: AsyncSession, contract_id: uuid.UUID, tenant_id: uuid.UUID
) -> None:
    """Delete a contract and its file from storage."""
    contract = await get_contract(db, contract_id, tenant_id)

    # Delete from MinIO
    try:
        client = get_minio_client()
        client.remove_object(settings.minio_bucket, contract.file_path)
    except Exception:
        pass  # File may already be gone

    await db.delete(contract)


async def update_contract_status(
    db: AsyncSession, contract_id: uuid.UUID, tenant_id: uuid.UUID, status: ContractStatus
) -> Contract:
    """Update the status of a contract."""
    contract = await get_contract(db, contract_id, tenant_id)
    contract.status = status
    await db.flush()
    await db.refresh(contract)
    return contract


async def get_contract_stats(db: AsyncSession, tenant_id: uuid.UUID) -> ContractStats:
    """Get aggregate statistics for the dashboard."""
    result = await db.execute(
        select(Contract.status, func.count(Contract.id))
        .where(Contract.tenant_id == tenant_id)
        .group_by(Contract.status)
    )
    status_counts = {row[0]: row[1] for row in result.all()}

    # Count high-risk contracts
    high_risk_result = await db.execute(
        select(func.count(Contract.id)).where(
            Contract.tenant_id == tenant_id,
            Contract.risk_score != None,  # noqa: E711
            Contract.risk_score >= 0.7,
        )
    )
    high_risk = high_risk_result.scalar() or 0

    total = sum(status_counts.values())
    return ContractStats(
        total=total,
        uploaded=status_counts.get(ContractStatus.UPLOADED, 0),
        processing=status_counts.get(ContractStatus.PROCESSING, 0),
        analyzed=status_counts.get(ContractStatus.ANALYZED, 0),
        in_review=status_counts.get(ContractStatus.IN_REVIEW, 0),
        approved=status_counts.get(ContractStatus.APPROVED, 0),
        rejected=status_counts.get(ContractStatus.REJECTED, 0),
        high_risk=high_risk,
    )


def get_contract_file(file_path: str) -> bytes:
    """Download contract file content from MinIO."""
    client = get_minio_client()
    response = client.get_object(settings.minio_bucket, file_path)
    try:
        return response.read()
    finally:
        response.close()
        response.release_conn()
