"use client";

import React, { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  Edit3,
  ArrowUpCircle,
  AlertTriangle,
  FileText,
  Filter,
  Check,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, RiskBadge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { api, ReviewItem, ContractSummary } from "@/lib/api";
import toast from "react-hot-toast";

export default function ReviewPage() {
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    fetchContracts();
  }, []);

  useEffect(() => {
    if (selectedContract) {
      fetchReviewItems(selectedContract);
    }
  }, [selectedContract, statusFilter]);

  const fetchContracts = async () => {
    try {
      const res = await api.listContracts({ status: "analyzed", page_size: 50 });
      setContracts(res.items);
      if (res.items.length > 0) {
        setSelectedContract(res.items[0].id);
      }
    } catch {
      // empty
    } finally {
      setLoading(false);
    }
  };

  const fetchReviewItems = async (contractId: string) => {
    setLoading(true);
    try {
      const res = await api.getReviewItems(contractId, statusFilter || undefined);
      setItems(res);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (
    itemId: string,
    status: string,
    humanEdit?: string,
    comment?: string
  ) => {
    try {
      await api.submitReviewDecision(itemId, { status, human_edit: humanEdit, comment });
      toast.success(`Item ${status}`);
      if (selectedContract) {
        fetchReviewItems(selectedContract);
      }
    } catch (err: any) {
      toast.error(err.detail || "Failed to submit decision");
    }
  };

  const handleFinalize = async () => {
    if (!selectedContract) return;
    try {
      const res = await api.finalizeReview(selectedContract);
      if (res.finalized) {
        toast.success("Review finalized!");
      } else {
        toast.error(res.message || "Cannot finalize yet");
      }
    } catch (err: any) {
      toast.error(err.detail || "Finalization failed");
    }
  };

  const pendingCount = items.filter((i) => i.status === "pending").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Review Queue
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Review AI-generated suggestions and approve, edit, or reject
          </p>
        </div>
        {selectedContract && pendingCount === 0 && items.length > 0 && (
          <Button onClick={handleFinalize}>
            <Check className="w-4 h-4" />
            Finalize Review
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Contract Selector */}
        <div className="lg:col-span-1 space-y-3">
          <Card hover={false} padding="sm">
            <CardHeader>
              <CardTitle>Contracts</CardTitle>
            </CardHeader>
            <div className="space-y-1">
              {contracts.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">
                  No contracts ready for review
                </p>
              ) : (
                contracts.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedContract(c.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all
                      ${selectedContract === c.id
                        ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-surface-800"
                      }`}
                  >
                    <FileText className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm truncate">{c.title}</span>
                  </button>
                ))
              )}
            </div>
          </Card>

          {/* Filter */}
          <Card hover={false} padding="sm">
            <CardHeader>
              <CardTitle>Filter</CardTitle>
            </CardHeader>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700
                bg-slate-50 dark:bg-surface-850 text-slate-700 dark:text-slate-200
                focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-all"
            >
              <option value="">All Items</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="edited">Edited</option>
              <option value="escalated">Escalated</option>
            </select>
          </Card>

          {/* Summary */}
          {items.length > 0 && (
            <Card hover={false} padding="sm">
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total</span>
                  <span className="font-medium text-slate-900 dark:text-white">{items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-600">Pending</span>
                  <span className="font-medium">{pendingCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-600">Accepted</span>
                  <span className="font-medium">
                    {items.filter((i) => i.status === "accepted").length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600">Rejected</span>
                  <span className="font-medium">
                    {items.filter((i) => i.status === "rejected").length}
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Review Items */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <Card hover={false} className="text-center py-16">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="font-medium text-slate-700 dark:text-slate-300">
                {selectedContract ? "No review items" : "Select a contract"}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {selectedContract
                  ? "Extract clauses from the contract detail page to create review items"
                  : "Choose a contract from the sidebar to begin reviewing"
                }
              </p>
            </Card>
          ) : (
            items.map((item) => (
              <ReviewItemCard
                key={item.id}
                item={item}
                onDecision={handleDecision}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewItemCard({
  item,
  onDecision,
}: {
  item: ReviewItem;
  onDecision: (id: string, status: string, edit?: string, comment?: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(item.ai_suggestion);
  const [comment, setComment] = useState("");

  const isPending = item.status === "pending";

  const statusColors: Record<string, string> = {
    pending: "border-l-amber-400",
    accepted: "border-l-emerald-400",
    rejected: "border-l-red-400",
    edited: "border-l-blue-400",
    escalated: "border-l-purple-400",
  };

  return (
    <Card
      hover={false}
      padding="md"
      className={`border-l-4 ${statusColors[item.status] || "border-l-slate-300"}`}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-slate-900 dark:text-white">
                {item.clause_title || item.clause_type.replace(/_/g, " ")}
              </p>
              {item.ai_risk_level && <RiskBadge level={item.ai_risk_level} />}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant="default" size="sm">
                {item.clause_type.replace(/_/g, " ")}
              </Badge>
              {item.page_number && (
                <span className="text-xs text-slate-500">Page {item.page_number}</span>
              )}
              {item.confidence_score != null && (
                <span className="text-xs text-slate-500">
                  {Math.round(item.confidence_score * 100)}% confidence
                </span>
              )}
            </div>
          </div>
          <Badge
            variant={
              item.status === "accepted" ? "success"
              : item.status === "rejected" ? "danger"
              : item.status === "edited" ? "info"
              : item.status === "escalated" ? "purple"
              : "warning"
            }
          >
            {item.status}
          </Badge>
        </div>

        {/* Content */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-surface-850 border border-slate-100 dark:border-slate-800">
          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
            {item.ai_suggestion}
          </p>
        </div>

        {/* Edit Form */}
        {editing && (
          <div className="space-y-3 animate-[slide-up_0.2s_ease-out]">
            <Textarea
              label="Edit suggestion"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={4}
            />
            <Textarea
              label="Comment (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="Add a note about your changes..."
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  onDecision(item.id, "edited", editText, comment);
                  setEditing(false);
                }}
              >
                Save Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Human feedback */}
        {item.human_edit && item.status === "edited" && (
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800">
            <p className="text-xs text-blue-600 font-medium mb-1">Edited version:</p>
            <p className="text-sm text-blue-800 dark:text-blue-300 whitespace-pre-wrap">
              {item.human_edit}
            </p>
          </div>
        )}

        {item.reviewer_comment && (
          <p className="text-xs text-slate-500 italic">
            Review note: {item.reviewer_comment}
          </p>
        )}

        {/* Actions */}
        {isPending && !editing && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onDecision(item.id, "accepted")}
              className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Accept
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditing(true)}
              className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onDecision(item.id, "rejected")}
              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <XCircle className="w-3.5 h-3.5" />
              Reject
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onDecision(item.id, "escalated")}
              className="text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
            >
              <ArrowUpCircle className="w-3.5 h-3.5" />
              Escalate
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
