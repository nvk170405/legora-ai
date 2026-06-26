"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Upload,
  Search,
  Filter,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge, RiskBadge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { ContractUploader } from "@/components/contract/ContractUploader";
import { api, ContractSummary, PaginatedResponse } from "@/lib/api";

const STATUSES = [
  { value: "", label: "All Status" },
  { value: "uploaded", label: "Uploaded" },
  { value: "processing", label: "Processing" },
  { value: "analyzed", label: "Analyzed" },
  { value: "in_review", label: "In Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const TYPES = [
  { value: "", label: "All Types" },
  { value: "nda", label: "NDA" },
  { value: "vendor_agreement", label: "Vendor Agreement" },
  { value: "employment", label: "Employment" },
  { value: "lease", label: "Lease" },
  { value: "sla", label: "SLA" },
  { value: "master_service_agreement", label: "MSA" },
  { value: "other", label: "Other" },
];

export default function ContractsListPage() {
  const [data, setData] = useState<PaginatedResponse<ContractSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [uploadOpen, setUploadOpen] = useState(false);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await api.listContracts({
        page,
        page_size: 12,
        status: statusFilter || undefined,
        type: typeFilter || undefined,
        search: search || undefined,
      });
      setData(res);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [page, statusFilter, typeFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      fetchContracts();
    }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Contracts</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {data ? `${data.total} contracts` : "Loading..."}
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)}>
          <Upload className="w-4 h-4" />
          Upload Contract
        </Button>
      </div>

      {/* Filters */}
      <Card hover={false} padding="sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search contracts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl
                bg-slate-50 dark:bg-surface-850 border border-slate-200 dark:border-slate-700
                focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500
                text-slate-700 dark:text-slate-200 placeholder:text-slate-400 transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700
              bg-slate-50 dark:bg-surface-850 text-slate-700 dark:text-slate-200
              focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700
              bg-slate-50 dark:bg-surface-850 text-slate-700 dark:text-slate-200
              focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <div className="flex border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 ${viewMode === "grid" ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600" : "text-slate-400 hover:bg-slate-50 dark:hover:bg-surface-800"} transition-colors`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 ${viewMode === "list" ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600" : "text-slate-400 hover:bg-slate-50 dark:hover:bg-surface-800"} transition-colors`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Contract Grid/List */}
      {loading ? (
        <div className={viewMode === "grid" ? "grid md:grid-cols-2 xl:grid-cols-3 gap-4" : "space-y-3"}>
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <Card hover={false} className="text-center py-16">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-surface-800 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <p className="font-medium text-slate-700 dark:text-slate-300">No contracts found</p>
          <p className="text-sm text-slate-500 mt-1">Try adjusting your filters or upload a new contract</p>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.items.map((contract) => (
            <Link key={contract.id} href={`/dashboard/contracts/${contract.id}`}>
              <Card className="h-full">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white truncate">
                          {contract.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {contract.contract_type.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={contract.status} />
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{new Date(contract.created_at).toLocaleDateString()}</span>
                    <div className="flex items-center gap-2">
                      {contract.page_count && (
                        <span>{contract.page_count} pages</span>
                      )}
                      {contract.risk_score != null && (
                        <RiskBadge
                          level={
                            contract.risk_score > 0.7
                              ? "high"
                              : contract.risk_score > 0.4
                              ? "medium"
                              : "low"
                          }
                        />
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card hover={false} padding="sm">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.items.map((contract) => (
              <Link
                key={contract.id}
                href={`/dashboard/contracts/${contract.id}`}
                className="flex items-center justify-between py-3 px-3 -mx-1 rounded-xl
                  hover:bg-slate-50 dark:hover:bg-surface-800/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{contract.title}</p>
                    <p className="text-xs text-slate-500">
                      {contract.contract_type.replace(/_/g, " ")} • {new Date(contract.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {contract.risk_score != null && (
                    <RiskBadge
                      level={contract.risk_score > 0.7 ? "high" : contract.risk_score > 0.4 ? "medium" : "low"}
                    />
                  )}
                  <StatusBadge status={contract.status} />
                  <ArrowUpRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Pagination */}
      {data && data.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-slate-600 dark:text-slate-400 px-3">
            Page {page} of {data.total_pages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= data.total_pages}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Upload Modal */}
      <Modal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Contract" size="lg">
        <ContractUploader
          onUploadComplete={() => {
            setUploadOpen(false);
            fetchContracts();
          }}
        />
      </Modal>
    </div>
  );
}
