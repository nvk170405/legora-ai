"""
Legora AI — RAG (Retrieval-Augmented Generation) Pipeline.

Handles vector similarity search against pgvector for context retrieval.
"""

import logging
import uuid

from sentence_transformers import SentenceTransformer
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import get_settings
from src.documents.models import DocumentChunk

logger = logging.getLogger(__name__)
settings = get_settings()

_embedding_model: SentenceTransformer | None = None


def get_embedding_model() -> SentenceTransformer:
    """Get or initialize the embedding model."""
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = SentenceTransformer(settings.embedding_model)
    return _embedding_model


async def retrieve_relevant_chunks(
    db: AsyncSession,
    contract_id: uuid.UUID,
    tenant_id: uuid.UUID,
    query: str,
    top_k: int = 5,
) -> list[DocumentChunk]:
    """
    Retrieve the most relevant document chunks for a given query.

    Uses pgvector cosine similarity search.
    """
    # Generate query embedding
    model = get_embedding_model()
    query_embedding = model.encode(query).tolist()

    # pgvector cosine distance search
    # <=> is cosine distance operator in pgvector
    result = await db.execute(
        select(DocumentChunk)
        .where(
            DocumentChunk.contract_id == contract_id,
            DocumentChunk.tenant_id == tenant_id,
            DocumentChunk.embedding.isnot(None),
        )
        .order_by(DocumentChunk.embedding.cosine_distance(query_embedding))
        .limit(top_k)
    )

    chunks = list(result.scalars().all())
    logger.info(f"Retrieved {len(chunks)} chunks for query: {query[:80]}...")
    return chunks


def build_context(chunks: list[DocumentChunk], max_tokens: int = 3000) -> str:
    """
    Build a context string from retrieved chunks.
    Respects token budget and includes source metadata.
    """
    context_parts = []
    total_tokens = 0
    chars_per_token = 4

    for chunk in chunks:
        chunk_tokens = chunk.token_count or (len(chunk.content) // chars_per_token)
        if total_tokens + chunk_tokens > max_tokens:
            break

        source_info = []
        if chunk.page_number:
            source_info.append(f"Page {chunk.page_number}")
        if chunk.section_header:
            source_info.append(f"Section: {chunk.section_header}")
        if chunk.clause_type.value != "unknown":
            source_info.append(f"Type: {chunk.clause_type.value}")

        header = f"[Source: {', '.join(source_info)}]" if source_info else ""
        context_parts.append(f"{header}\n{chunk.content}")
        total_tokens += chunk_tokens

    return "\n\n---\n\n".join(context_parts)


def build_full_context(chunks: list[DocumentChunk]) -> str:
    """
    Build the full contract text from all chunks (ordered by index).
    Used for summarization and full-document analysis.
    """
    sorted_chunks = sorted(chunks, key=lambda c: c.chunk_index)
    return "\n\n".join(c.content for c in sorted_chunks)
