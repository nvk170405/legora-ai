"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Sparkles,
  AlertTriangle,
  MessageSquare,
  ListChecks,
  Loader2,
  Play,
  Download,
  Trash2,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge, RiskBadge, Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { QAChat } from "@/components/contract/QAChat";
import { ClauseCard } from "@/components/contract/ClauseCard";
import { RiskDashboard } from "@/components/contract/RiskDashboard";
import {
  api,
  Contract,
  SummaryResponse,
  ClauseExtractionResponse,
  RiskAssessmentResponse,
} from "@/lib/api";
import toast from "react-hot-toast";

type TabId = "summary" | "clauses" | "qa" | "risk";

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "summary", label: "Summary", icon: FileText },
  { id: "clauses", label: "Clauses", icon: ListChecks },
  { id: "qa", label: "Q&A", icon: MessageSquare },
  { id: "risk", label: "Risk", icon: AlertTriangle },
];

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = params.id as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("summary");
  const [loading, setLoading] = useState(true);

  // Analysis data
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [clauses, setClauses] = useState<ClauseExtractionResponse | null>(null);
  const [risk, setRisk] = useState<RiskAssessmentResponse | null>(null);

  // Loading states
  const [processingDoc, setProcessingDoc] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingClauses, setLoadingClauses] = useState(false);
  const [loadingRisk, setLoadingRisk] = useState(false);

  useEffect(() => {
    fetchContract();
  }, [contractId]);

  const fetchContract = async () => {
    setLoading(true);
    try {
      const res = await api.getContract(contractId);
      setContract(res);
    } catch {
      toast.error("Failed to load contract");
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async () => {
    setProcessingDoc(true);
    try {
      await api.processDocument(contractId);
      toast.success("Document processed successfully");
      await fetchContract();
    } catch (err: any) {
      toast.error(err.detail || "Processing failed");
    } finally {
      setProcessingDoc(false);
    }
  };

  const handleSummarize = async () => {
    setLoadingSummary(true);
    try {
      const res = await api.summarize(contractId);
      setSummary(res);
      toast.success("Summary generated");
    } catch (err: any) {
      toast.error(err.detail || "Summarization failed");
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleExtractClauses = async () => {
    setLoadingClauses(true);
    try {
      const res = await api.extractClauses(contractId);
      setClauses(res);
      toast.success(`Extracted ${res.total_clauses} clauses`);
    } catch (err: any) {
      toast.error(err.detail || "Clause extraction failed");
    } finally {
      setLoadingClauses(false);
    }
  };

  const handleAssessRisk = async () => {
    setLoadingRisk(true);
    try {
      const res = await api.assessRisk(contractId);
      setRisk(res);
      toast.success("Risk assessment complete");
    } catch (err: any) {
      toast.error(err.detail || "Risk assessment failed");
    } finally {
      setLoadingRisk(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this contract?")) return;
    try {
      await api.deleteContract(contractId);
      toast.success("Contract deleted");
      router.push("/dashboard/contracts");
    } catch (err: any) {
      toast.error(err.detail || "Delete failed");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-600 dark:text-slate-400">Contract not found</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push("/dashboard/contracts")}>
          <ArrowLeft className="w-4 h-4" /> Back to Contracts
        </Button>
      </div>
    );
  }

  const isProcessed = ["analyzed", "in_review", "approved"].includes(contract.status);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <button
            onClick={() => router.push("/dashboard/contracts")}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Contracts
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {contract.title}
            </h1>
            <StatusBadge status={contract.status} />
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
            <span>{contract.contract_type.replace(/_/g, " ")}</span>
            <span>•</span>
            <span>{contract.original_filename}</span>
            <span>•</span>
            <span>{(contract.file_size / 1024).toFixed(0)} KB</span>
            {contract.page_count && (
              <>
                <span>•</span>
                <span>{contract.page_count} pages</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isProcessed && (
            <Button onClick={handleProcess} isLoading={processingDoc}>
              <Play className="w-4 h-4" />
              Process Document
            </Button>
          )}
          <Button variant="danger" size="sm" onClick={handleDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Contract Summary Card */}
      {contract.summary && (
        <Card hover={false} className="border-l-4 border-l-primary-500">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {contract.summary}
          </p>
        </Card>
      )}

      {/* Tabs */}
      {isProcessed && (
        <>
          <div className="flex border-b border-slate-200 dark:border-slate-700 gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all
                    ${isActive
                      ? "border-primary-500 text-primary-600 dark:text-primary-400"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="animate-fade-in">
            {activeTab === "summary" && (
              <div className="space-y-4">
                {summary ? (
                  <Card hover={false}>
                    <CardHeader>
                      <CardTitle>AI-Generated Summary</CardTitle>
                    </CardHeader>
                    <div className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
                      {summary.summary.split("\n").map((line, i) => (
                        <p key={i} className="text-slate-700 dark:text-slate-300">
                          {line}
                        </p>
                      ))}
                    </div>
                    {summary.citations.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-slate-500 mb-2">Sources</p>
                        <div className="flex flex-wrap gap-2">
                          {summary.citations.map((c, i) => (
                            <Badge key={i} variant="default" size="sm">
                              {c.page_number ? `Page ${c.page_number}` : c.section_header || `Chunk ${i + 1}`}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ) : (
                  <Card hover={false} className="text-center py-12">
                    <Sparkles className="w-10 h-10 text-primary-400 mx-auto mb-3" />
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      Generate an AI summary
                    </p>
                    <p className="text-sm text-slate-500 mt-1 mb-4">
                      Get a structured overview of this contract
                    </p>
                    <Button onClick={handleSummarize} isLoading={loadingSummary}>
                      <Sparkles className="w-4 h-4" />
                      Generate Summary
                    </Button>
                  </Card>
                )}
              </div>
            )}

            {activeTab === "clauses" && (
              <div className="space-y-4">
                {clauses ? (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-500">
                        {clauses.total_clauses} clauses extracted
                      </p>
                      <Button variant="secondary" size="sm" onClick={handleExtractClauses} isLoading={loadingClauses}>
                        Re-extract
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {clauses.clauses.map((clause, i) => (
                        <ClauseCard key={i} clause={clause} />
                      ))}
                    </div>
                  </>
                ) : (
                  <Card hover={false} className="text-center py-12">
                    <ListChecks className="w-10 h-10 text-primary-400 mx-auto mb-3" />
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      Extract clauses from this contract
                    </p>
                    <p className="text-sm text-slate-500 mt-1 mb-4">
                      AI identifies and categorizes 40+ clause types
                    </p>
                    <Button onClick={handleExtractClauses} isLoading={loadingClauses}>
                      <ListChecks className="w-4 h-4" />
                      Extract Clauses
                    </Button>
                  </Card>
                )}
              </div>
            )}

            {activeTab === "qa" && (
              <Card hover={false} padding="sm">
                <QAChat contractId={contractId} />
              </Card>
            )}

            {activeTab === "risk" && (
              <div className="space-y-4">
                {risk ? (
                  <RiskDashboard data={risk} />
                ) : (
                  <Card hover={false} className="text-center py-12">
                    <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                    <p className="font-medium text-slate-700 dark:text-slate-300">
                      Run a risk assessment
                    </p>
                    <p className="text-sm text-slate-500 mt-1 mb-4">
                      AI scores risk and identifies problematic clauses
                    </p>
                    <Button onClick={handleAssessRisk} isLoading={loadingRisk}>
                      <AlertTriangle className="w-4 h-4" />
                      Assess Risk
                    </Button>
                  </Card>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Not Processed State */}
      {!isProcessed && contract.status !== "processing" && (
        <Card hover={false} className="text-center py-16">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mb-4">
            <Play className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <p className="font-medium text-slate-700 dark:text-slate-300 text-lg">
            Process this document to unlock AI analysis
          </p>
          <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
            Document processing extracts text, splits it into sections, generates embeddings, and prepares it for AI analysis.
          </p>
          <Button onClick={handleProcess} isLoading={processingDoc} className="mt-6" size="lg">
            <Play className="w-4 h-4" />
            Process Document
          </Button>
        </Card>
      )}

      {contract.status === "processing" && (
        <Card hover={false} className="text-center py-16">
          <Loader2 className="w-10 h-10 text-primary-500 mx-auto mb-4 animate-spin" />
          <p className="font-medium text-slate-700 dark:text-slate-300">
            Processing document...
          </p>
          <p className="text-sm text-slate-500 mt-1">
            This may take a moment for large documents
          </p>
        </Card>
      )}
    </div>
  );
}
