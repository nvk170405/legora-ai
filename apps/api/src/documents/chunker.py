"""
Legora AI — Clause-Aware Document Chunker.

Splits parsed documents into semantically meaningful chunks,
preserving section boundaries, page numbers, and source offsets.
"""

import re
from dataclasses import dataclass, field

from src.documents.models import ClauseType
from src.documents.parser import ParsedDocument


@dataclass
class Chunk:
    """A single chunk ready for embedding and storage."""

    content: str
    chunk_index: int
    page_number: int | None = None
    section_header: str | None = None
    clause_type: ClauseType = ClauseType.UNKNOWN
    source_offset_start: int = 0
    source_offset_end: int = 0
    token_count: int = 0


# ── Clause detection patterns ───────────────────────────────────────
CLAUSE_PATTERNS: dict[ClauseType, list[str]] = {
    ClauseType.DEFINITIONS: [r"definition", r"interpretation", r"meaning of terms"],
    ClauseType.SCOPE_OF_WORK: [r"scope of work", r"scope of services", r"deliverables", r"statement of work"],
    ClauseType.PAYMENT_TERMS: [r"payment", r"fees", r"compensation", r"invoic", r"billing"],
    ClauseType.TERMINATION: [r"terminat", r"cancellat", r"expir"],
    ClauseType.CONFIDENTIALITY: [r"confidential", r"non.?disclosure", r"proprietary information"],
    ClauseType.INDEMNIFICATION: [r"indemnif", r"hold harmless"],
    ClauseType.LIABILITY: [r"liabilit", r"limitation of liability", r"cap on liability", r"damages"],
    ClauseType.WARRANTY: [r"warrant", r"guarantee", r"representation"],
    ClauseType.INTELLECTUAL_PROPERTY: [r"intellectual property", r"patent", r"copyright", r"trademark", r"license grant"],
    ClauseType.GOVERNING_LAW: [r"governing law", r"jurisdiction", r"applicable law", r"venue"],
    ClauseType.DISPUTE_RESOLUTION: [r"dispute", r"arbitrat", r"mediat", r"litigation"],
    ClauseType.FORCE_MAJEURE: [r"force majeure", r"act of god", r"unforeseeable"],
    ClauseType.RENEWAL: [r"renewal", r"auto.?renew", r"extension", r"term of agreement"],
    ClauseType.ASSIGNMENT: [r"assignment", r"transfer of rights", r"delegation"],
    ClauseType.INSURANCE: [r"insurance", r"coverage", r"policy"],
    ClauseType.DATA_PROTECTION: [r"data protect", r"privacy", r"gdpr", r"personal data", r"data processing"],
    ClauseType.NON_COMPETE: [r"non.?compete", r"non.?competition", r"restrictive covenant"],
    ClauseType.NON_SOLICITATION: [r"non.?solicitation", r"no.?solicit"],
    ClauseType.REPRESENTATIONS: [r"represent", r"covenant"],
}

# Section header pattern (e.g., "1. DEFINITIONS", "Article II", "Section 3.1")
SECTION_HEADER_RE = re.compile(
    r"^(?:"
    r"(?:section|article|clause|part|schedule|exhibit|appendix|annex)\s+[\divxlcm]+\.?|"
    r"\d+(?:\.\d+)*\.?\s+[A-Z]|"
    r"[IVXLCDM]+\.\s+[A-Z]"
    r")",
    re.IGNORECASE | re.MULTILINE,
)

DEFAULT_CHUNK_SIZE = 512  # tokens (approximated as ~4 chars per token)
DEFAULT_OVERLAP = 128
CHARS_PER_TOKEN = 4  # rough estimate


def detect_clause_type(text: str) -> ClauseType:
    """Detect the clause type of a text block based on keyword patterns."""
    text_lower = text.lower()
    best_match = ClauseType.UNKNOWN
    best_score = 0

    for clause_type, patterns in CLAUSE_PATTERNS.items():
        score = sum(1 for p in patterns if re.search(p, text_lower))
        if score > best_score:
            best_score = score
            best_match = clause_type

    return best_match


def extract_section_header(text: str) -> str | None:
    """Extract the section header from a text block, if present."""
    lines = text.strip().split("\n")
    if not lines:
        return None

    first_line = lines[0].strip()
    if SECTION_HEADER_RE.match(first_line) and len(first_line) < 200:
        return first_line

    # Check for ALL-CAPS header
    if first_line.isupper() and len(first_line) < 100:
        return first_line

    return None


def split_into_sections(text: str) -> list[tuple[str | None, str, int]]:
    """
    Split document text into sections based on headers.
    Returns list of (header, content, start_offset) tuples.
    """
    sections: list[tuple[str | None, str, int]] = []

    # Find all section headers
    header_positions = []
    for match in SECTION_HEADER_RE.finditer(text):
        header_positions.append(match.start())

    # Also detect ALL-CAPS lines as potential headers
    for match in re.finditer(r"^[A-Z][A-Z\s]{5,80}$", text, re.MULTILINE):
        header_positions.append(match.start())

    header_positions = sorted(set(header_positions))

    if not header_positions:
        # No sections detected — return whole text
        return [(None, text, 0)]

    # Add text before first header
    if header_positions[0] > 0:
        preamble = text[: header_positions[0]].strip()
        if preamble:
            sections.append((None, preamble, 0))

    # Split by header positions
    for i, pos in enumerate(header_positions):
        end_pos = header_positions[i + 1] if i + 1 < len(header_positions) else len(text)
        section_text = text[pos:end_pos].strip()
        header = extract_section_header(section_text)
        sections.append((header, section_text, pos))

    return sections


def chunk_text(
    text: str,
    max_chunk_size: int = DEFAULT_CHUNK_SIZE,
    overlap: int = DEFAULT_OVERLAP,
) -> list[tuple[str, int, int]]:
    """
    Split a text block into overlapping chunks by character count.
    Returns list of (chunk_text, start_offset, end_offset).
    """
    max_chars = max_chunk_size * CHARS_PER_TOKEN
    overlap_chars = overlap * CHARS_PER_TOKEN

    if len(text) <= max_chars:
        return [(text, 0, len(text))]

    chunks = []
    start = 0

    while start < len(text):
        end = start + max_chars

        # Try to break at a paragraph or sentence boundary
        if end < len(text):
            # Look for paragraph break
            newline_pos = text.rfind("\n\n", start + max_chars // 2, end)
            if newline_pos > start:
                end = newline_pos
            else:
                # Look for sentence break
                sentence_end = text.rfind(". ", start + max_chars // 2, end)
                if sentence_end > start:
                    end = sentence_end + 1

        chunk_text_content = text[start:end].strip()
        if chunk_text_content:
            chunks.append((chunk_text_content, start, end))

        start = end - overlap_chars
        if start >= len(text):
            break

    return chunks


def chunk_document(
    parsed_doc: ParsedDocument,
    max_chunk_size: int = DEFAULT_CHUNK_SIZE,
    overlap: int = DEFAULT_OVERLAP,
) -> list[Chunk]:
    """
    Process a parsed document into clause-aware chunks.

    Strategy:
    1. Split document into sections by headers
    2. Within each section, split into overlapping chunks
    3. Detect clause type for each chunk
    4. Map chunks to page numbers
    """
    all_chunks: list[Chunk] = []
    chunk_index = 0

    # Build a page offset map for page number assignment
    page_offsets: list[tuple[int, int, int]] = []  # (start, end, page_num)
    offset = 0
    for page in parsed_doc.pages:
        page_len = len(page.text)
        page_offsets.append((offset, offset + page_len, page.page_number))
        offset += page_len + 2  # +2 for the \n\n join

    # Split into sections
    sections = split_into_sections(parsed_doc.full_text)

    for header, section_text, section_offset in sections:
        # Split section into chunks
        text_chunks = chunk_text(section_text, max_chunk_size, overlap)

        for chunk_text_content, rel_start, rel_end in text_chunks:
            abs_start = section_offset + rel_start
            abs_end = section_offset + rel_end

            # Determine page number
            page_num = _offset_to_page(abs_start, page_offsets)

            # Detect clause type
            clause_type = detect_clause_type(chunk_text_content)

            # Estimate token count
            token_count = len(chunk_text_content) // CHARS_PER_TOKEN

            all_chunks.append(Chunk(
                content=chunk_text_content,
                chunk_index=chunk_index,
                page_number=page_num,
                section_header=header,
                clause_type=clause_type,
                source_offset_start=abs_start,
                source_offset_end=abs_end,
                token_count=token_count,
            ))
            chunk_index += 1

    return all_chunks


def _offset_to_page(offset: int, page_offsets: list[tuple[int, int, int]]) -> int | None:
    """Map a character offset to a page number."""
    for start, end, page_num in page_offsets:
        if start <= offset < end:
            return page_num
    return page_offsets[-1][2] if page_offsets else None
