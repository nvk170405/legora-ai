"""
Legora AI — Document Processing Service.

Orchestrates the full ingestion pipeline: parse → chunk → embed → store.
"""

import logging
import uuid

from sentence_transformers import SentenceTransformer
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import get_settings
from src.contracts.models import Contract, ContractStatus
from src.contracts.service import get_contract_file
from src.documents.chunker import chunk_document
from src.documents.models import ClauseType, DocumentChunk, DocumentMetadata
from src.documents.parser import parse_document

logger = logging.getLogger(__name__)
settings = get_settings()

# Lazy-loaded embedding model
_embedding_model: SentenceTransformer | None = None


def get_embedding_model() -> SentenceTransformer:
    """Get or initialize the embedding model (singleton)."""
    global _embedding_model
    if _embedding_model is None:
        logger.info(f"Loading embedding model: {settings.embedding_model}")
        _embedding_model = SentenceTransformer(settings.embedding_model)
    return _embedding_model


async def process_contract(db: AsyncSession, contract_id: uuid.UUID, tenant_id: uuid.UUID) -> dict:
    """
    Full document processing pipeline for a contract.

    1. Download file from storage
    2. Parse document (PDF/DOCX/TXT + OCR fallback)
    3. Chunk into clause-aware segments
    4. Generate embeddings
    5. Store chunks and metadata
    6. Update contract status
    """
    # Fetch contract
    result = await db.execute(
        select(Contract).where(Contract.id == contract_id, Contract.tenant_id == tenant_id)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise ValueError(f"Contract {contract_id} not found")

    # Update status to processing
    contract.status = ContractStatus.PROCESSING
    await db.flush()

    try:
        # Step 1: Download file
        logger.info(f"Downloading contract file: {contract.file_path}")
        file_content = get_contract_file(contract.file_path)

        # Step 2: Parse document
        logger.info(f"Parsing document: {contract.original_filename} ({contract.mime_type})")
        parsed_doc = parse_document(file_content, contract.mime_type)

        # Step 3: Chunk document
        logger.info(f"Chunking document: {parsed_doc.page_count} pages")
        chunks = chunk_document(parsed_doc)
        logger.info(f"Created {len(chunks)} chunks")

        # Step 4: Generate embeddings
        logger.info("Generating embeddings...")
        model = get_embedding_model()
        texts = [c.content for c in chunks]
        embeddings = model.encode(texts, show_progress_bar=False, batch_size=32)

        # Step 5: Clear existing chunks and store new ones
        await db.execute(
            delete(DocumentChunk).where(DocumentChunk.contract_id == contract_id)
        )
        await db.execute(
            delete(DocumentMetadata).where(DocumentMetadata.contract_id == contract_id)
        )

        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            db_chunk = DocumentChunk(
                contract_id=contract_id,
                tenant_id=tenant_id,
                content=chunk.content,
                chunk_index=chunk.chunk_index,
                page_number=chunk.page_number,
                section_header=chunk.section_header,
                clause_type=chunk.clause_type,
                embedding=embedding.tolist(),
                source_offset_start=chunk.source_offset_start,
                source_offset_end=chunk.source_offset_end,
                token_count=chunk.token_count,
            )
            db.add(db_chunk)

        # Store metadata
        metadata = DocumentMetadata(
            contract_id=contract_id,
            tenant_id=tenant_id,
            detected_language=parsed_doc.detected_language,
            document_type=contract.mime_type,
            ocr_applied=parsed_doc.ocr_applied,
            page_count=parsed_doc.page_count,
            total_chunks=len(chunks),
            extraction_quality_score=parsed_doc.extraction_quality,
            total_tokens=sum(c.token_count for c in chunks),
        )
        db.add(metadata)

        # Step 6: Update contract
        contract.status = ContractStatus.ANALYZED
        contract.page_count = parsed_doc.page_count
        contract.detected_language = parsed_doc.detected_language
        contract.processing_error = None
        await db.flush()

        return {
            "status": "success",
            "page_count": parsed_doc.page_count,
            "chunk_count": len(chunks),
            "ocr_applied": parsed_doc.ocr_applied,
            "quality_score": parsed_doc.extraction_quality,
        }

    except Exception as e:
        logger.error(f"Document processing failed for {contract_id}: {e}")
        contract.status = ContractStatus.UPLOADED
        contract.processing_error = str(e)
        await db.flush()
        raise


async def get_chunks(
    db: AsyncSession,
    contract_id: uuid.UUID,
    tenant_id: uuid.UUID,
    clause_type: ClauseType | None = None,
) -> list[DocumentChunk]:
    """Retrieve chunks for a contract, optionally filtered by clause type."""
    query = select(DocumentChunk).where(
        DocumentChunk.contract_id == contract_id,
        DocumentChunk.tenant_id == tenant_id,
    )
    if clause_type:
        query = query.where(DocumentChunk.clause_type == clause_type)

    query = query.order_by(DocumentChunk.chunk_index)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_processing_status(
    db: AsyncSession,
    contract_id: uuid.UUID,
    tenant_id: uuid.UUID,
) -> dict:
    """Get the processing status and metadata for a contract."""
    result = await db.execute(
        select(Contract).where(Contract.id == contract_id, Contract.tenant_id == tenant_id)
    )
    contract = result.scalar_one_or_none()
    if not contract:
        raise ValueError(f"Contract {contract_id} not found")

    meta_result = await db.execute(
        select(DocumentMetadata).where(DocumentMetadata.contract_id == contract_id)
    )
    metadata = meta_result.scalar_one_or_none()

    return {
        "contract_id": str(contract_id),
        "status": contract.status.value,
        "processing_error": contract.processing_error,
        "metadata": {
            "page_count": metadata.page_count if metadata else None,
            "total_chunks": metadata.total_chunks if metadata else None,
            "ocr_applied": metadata.ocr_applied if metadata else None,
            "quality_score": metadata.extraction_quality_score if metadata else None,
        } if metadata else None,
    }
