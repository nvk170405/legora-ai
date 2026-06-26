/**
 * Legora AI — API Client
 *
 * Typed fetch wrapper with JWT auth, error handling, and base URL config.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface ApiError {
  detail: string;
  status: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("legora_token");
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData (browser sets it with boundary)
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        detail: "An unexpected error occurred",
      }));
      throw {
        detail: error.detail || "Request failed",
        status: response.status,
      } as ApiError;
    }

    if (response.status === 204) return {} as T;
    return response.json();
  }

  // ── Auth ────────────────────────────────────────────────────
  async register(data: {
    email: string;
    password: string;
    full_name: string;
  }) {
    return this.request<{
      access_token: string;
      user: User;
    }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async login(data: { email: string; password: string }) {
    return this.request<{
      access_token: string;
      user: User;
    }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getMe() {
    return this.request<User>("/api/auth/me");
  }

  // ── Contracts ───────────────────────────────────────────────
  async uploadContract(file: File, title: string, contractType: string) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("contract_type", contractType);

    return this.request<Contract>("/api/contracts/upload", {
      method: "POST",
      body: formData,
    });
  }

  async listContracts(params?: {
    page?: number;
    page_size?: number;
    status?: string;
    type?: string;
    search?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.page_size)
      searchParams.set("page_size", String(params.page_size));
    if (params?.status) searchParams.set("status", params.status);
    if (params?.type) searchParams.set("type", params.type);
    if (params?.search) searchParams.set("search", params.search);

    const qs = searchParams.toString();
    return this.request<PaginatedResponse<ContractSummary>>(
      `/api/contracts/${qs ? `?${qs}` : ""}`
    );
  }

  async getContract(id: string) {
    return this.request<Contract>(`/api/contracts/${id}`);
  }

  async deleteContract(id: string) {
    return this.request<void>(`/api/contracts/${id}`, { method: "DELETE" });
  }

  async getContractStats() {
    return this.request<ContractStats>("/api/contracts/stats");
  }

  // ── Documents ───────────────────────────────────────────────
  async processDocument(contractId: string) {
    return this.request<ProcessingResult>(
      `/api/documents/${contractId}/process`,
      { method: "POST" }
    );
  }

  async getChunks(contractId: string, clauseType?: string) {
    const qs = clauseType ? `?clause_type=${clauseType}` : "";
    return this.request<ChunksResponse>(
      `/api/documents/${contractId}/chunks${qs}`
    );
  }

  async getProcessingStatus(contractId: string) {
    return this.request<ProcessingStatus>(
      `/api/documents/${contractId}/status`
    );
  }

  // ── Analysis ────────────────────────────────────────────────
  async summarize(contractId: string) {
    return this.request<SummaryResponse>(
      `/api/analysis/${contractId}/summarize`,
      { method: "POST" }
    );
  }

  async extractClauses(contractId: string) {
    return this.request<ClauseExtractionResponse>(
      `/api/analysis/${contractId}/extract-clauses`,
      { method: "POST" }
    );
  }

  async askQuestion(contractId: string, question: string) {
    return this.request<QAResponse>(`/api/analysis/${contractId}/ask`, {
      method: "POST",
      body: JSON.stringify({ question }),
    });
  }

  async assessRisk(contractId: string) {
    return this.request<RiskAssessmentResponse>(
      `/api/analysis/${contractId}/assess-risk`,
      { method: "POST" }
    );
  }

  // ── Review ──────────────────────────────────────────────────
  async getReviewItems(contractId: string, status?: string) {
    const qs = status ? `?status=${status}` : "";
    return this.request<ReviewItem[]>(
      `/api/review/${contractId}/items${qs}`
    );
  }

  async submitReviewDecision(
    itemId: string,
    decision: { status: string; human_edit?: string; comment?: string }
  ) {
    return this.request<ReviewItem>(`/api/review/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(decision),
    });
  }

  async finalizeReview(contractId: string) {
    return this.request<FinalizeResponse>(
      `/api/review/${contractId}/finalize`,
      { method: "POST" }
    );
  }

  // ── Audit ───────────────────────────────────────────────────
  async getAuditLogs(params?: {
    page?: number;
    resource_type?: string;
    resource_id?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.resource_type)
      searchParams.set("resource_type", params.resource_type);
    if (params?.resource_id)
      searchParams.set("resource_id", params.resource_id);
    const qs = searchParams.toString();
    return this.request<AuditLogsResponse>(
      `/api/audit/logs${qs ? `?${qs}` : ""}`
    );
  }
}

export const api = new ApiClient(API_BASE);

// ── Types ───────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  avatar_url?: string;
  tenant_id: string;
  created_at: string;
}

export interface Contract {
  id: string;
  title: string;
  contract_type: string;
  status: string;
  uploaded_by: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  page_count?: number;
  summary?: string;
  risk_score?: number;
  detected_language?: string;
  processing_error?: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface ContractSummary {
  id: string;
  title: string;
  contract_type: string;
  status: string;
  original_filename: string;
  risk_score?: number;
  page_count?: number;
  created_at: string;
}

export interface ContractStats {
  total: number;
  uploaded: number;
  processing: number;
  analyzed: number;
  in_review: number;
  approved: number;
  rejected: number;
  high_risk: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ProcessingResult {
  status: string;
  page_count: number;
  chunk_count: number;
  ocr_applied: boolean;
  quality_score: number;
}

export interface ProcessingStatus {
  contract_id: string;
  status: string;
  processing_error?: string;
  metadata?: {
    page_count?: number;
    total_chunks?: number;
    ocr_applied?: boolean;
    quality_score?: number;
  };
}

export interface ChunksResponse {
  contract_id: string;
  total_chunks: number;
  chunks: DocumentChunk[];
}

export interface DocumentChunk {
  id: string;
  chunk_index: number;
  content: string;
  page_number?: number;
  section_header?: string;
  clause_type: string;
  token_count?: number;
}

export interface Citation {
  chunk_id?: string;
  page_number?: number;
  section_header?: string;
  clause_type?: string;
  text_span?: string;
}

export interface SummaryResponse {
  contract_id: string;
  summary: string;
  citations: Citation[];
}

export interface ClauseItem {
  clause_type: string;
  title?: string;
  content: string;
  page_number?: number;
  risk_level: string;
  summary?: string;
  key_values?: Record<string, unknown>;
}

export interface ClauseExtractionResponse {
  contract_id: string;
  clauses: ClauseItem[];
  total_clauses: number;
}

export interface QAResponse {
  contract_id: string;
  question: string;
  answer: string;
  citations: Citation[];
  confidence?: number;
}

export interface RiskFactor {
  category: string;
  severity: string;
  description: string;
  clause_reference?: string;
  recommendation?: string;
}

export interface MissingClause {
  clause_type: string;
  importance: string;
  recommendation?: string;
}

export interface RiskAssessmentResponse {
  contract_id: string;
  overall_risk_score: number;
  risk_level: string;
  risk_summary: string;
  risk_factors: RiskFactor[];
  missing_clauses: MissingClause[];
}

export interface ReviewItem {
  id: string;
  contract_id: string;
  clause_type: string;
  clause_title?: string;
  ai_suggestion: string;
  ai_risk_level?: string;
  confidence_score?: number;
  page_number?: number;
  status: string;
  human_decision?: string;
  human_edit?: string;
  reviewer_id?: string;
  reviewer_comment?: string;
  created_at: string;
  updated_at: string;
}

export interface FinalizeResponse {
  finalized: boolean;
  message?: string;
  contract_status?: string;
  summary?: {
    total: number;
    accepted: number;
    edited: number;
    rejected: number;
    escalated: number;
  };
}

export interface AuditLogsResponse {
  total: number;
  page: number;
  page_size: number;
  logs: AuditLogEntry[];
}

export interface AuditLogEntry {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  timestamp: string;
}
