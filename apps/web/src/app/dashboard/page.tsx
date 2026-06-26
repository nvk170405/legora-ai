"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Upload,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  ArrowUpRight,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge, RiskBadge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { ContractUploader } from "@/components/contract/ContractUploader";
import { api, ContractStats, ContractSummary } from "@/lib/api";

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  gradient: string;
  trend?: string;
}

function StatCard({ icon: Icon, label, value, gradient, trend }: StatCardProps) {
  return (
    <Card className="relative overflow-hidden group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
            {value}
          </p>
          {trend && (
            <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 mt-2">
              <TrendingUp className="w-3 h-3" />
              {trend}
            </p>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {/* Decorative glow */}
      <div
        className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full bg-gradient-to-br ${gradient} opacity-5 group-hover:opacity-10 transition-opacity`}
      />
    </Card>
  );
}

export default function DashboardHomePage() {
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [recent, setRecent] = useState<ContractSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, contractsRes] = await Promise.all([
        api.getContractStats().catch(() => null),
        api.listContracts({ page: 1, page_size: 5 }).catch(() => null),
      ]);
      if (statsRes) setStats(statsRes);
      if (contractsRes) setRecent(contractsRes.items);
    } catch {
      // Fallback to empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Overview of your contract analysis pipeline
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)} size="md">
          <Upload className="w-4 h-4" />
          Upload Contract
        </Button>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            icon={FileText}
            label="Total Contracts"
            value={stats?.total ?? 0}
            gradient="from-primary-500 to-primary-600"
            trend="+12% this month"
          />
          <StatCard
            icon={Clock}
            label="In Processing"
            value={stats?.processing ?? 0}
            gradient="from-blue-500 to-cyan-500"
          />
          <StatCard
            icon={AlertTriangle}
            label="High Risk"
            value={stats?.high_risk ?? 0}
            gradient="from-amber-500 to-orange-500"
          />
          <StatCard
            icon={CheckCircle}
            label="Approved"
            value={stats?.approved ?? 0}
            gradient="from-emerald-500 to-green-500"
            trend="98% acceptance rate"
          />
        </div>
      )}

      {/* Recent Contracts */}
      <Card hover={false}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Contracts</CardTitle>
            <Link href="/dashboard/contracts">
              <Button variant="ghost" size="sm">
                View All
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </CardHeader>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-surface-800 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-400" />
            </div>
            <p className="font-medium text-slate-700 dark:text-slate-300">
              No contracts yet
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Upload your first contract to get started
            </p>
            <Button onClick={() => setUploadOpen(true)} className="mt-4" size="sm">
              <Upload className="w-4 h-4" />
              Upload
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recent.map((contract) => (
              <Link
                key={contract.id}
                href={`/dashboard/contracts/${contract.id}`}
                className="flex items-center justify-between py-4 px-2 -mx-2 rounded-xl
                  hover:bg-slate-50 dark:hover:bg-surface-800/50 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {contract.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {contract.contract_type.replace(/_/g, " ")} •{" "}
                      {new Date(contract.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {contract.risk_score != null && contract.risk_score > 0.7 && (
                    <RiskBadge level="high" />
                  )}
                  <StatusBadge status={contract.status} />
                  <ArrowUpRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="cursor-pointer" onClick={() => setUploadOpen(true)}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">Upload Contract</p>
              <p className="text-xs text-slate-500 mt-0.5">PDF, DOCX, or TXT</p>
            </div>
          </div>
        </Card>
        <Link href="/dashboard/review">
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Review Queue</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {stats?.in_review ?? 0} items pending
                </p>
              </div>
            </div>
          </Card>
        </Link>
        <Link href="/dashboard/analytics">
          <Card>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-medium text-slate-900 dark:text-white">Analytics</p>
                <p className="text-xs text-slate-500 mt-0.5">View insights & trends</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload Contract"
        size="lg"
      >
        <ContractUploader
          onUploadComplete={(contract) => {
            setUploadOpen(false);
            fetchData();
          }}
        />
      </Modal>
    </div>
  );
}
