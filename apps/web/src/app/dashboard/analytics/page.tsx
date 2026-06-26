"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  FileText,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { api, ContractStats } from "@/lib/api";

export default function AnalyticsPage() {
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getContractStats()
      .then(setStats)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Insights and metrics across your contract pipeline
        </p>
      </div>

      {/* Pipeline Overview */}
      <Card hover={false}>
        <CardHeader>
          <CardTitle>Pipeline Overview</CardTitle>
        </CardHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {[
            { label: "Total", value: stats?.total ?? 0, icon: FileText, color: "text-slate-600" },
            { label: "Uploaded", value: stats?.uploaded ?? 0, icon: Clock, color: "text-slate-500" },
            { label: "Processing", value: stats?.processing ?? 0, icon: Sparkles, color: "text-blue-500" },
            { label: "Analyzed", value: stats?.analyzed ?? 0, icon: BarChart3, color: "text-violet-500" },
            { label: "In Review", value: stats?.in_review ?? 0, icon: AlertTriangle, color: "text-amber-500" },
            { label: "Approved", value: stats?.approved ?? 0, icon: CheckCircle, color: "text-emerald-500" },
            { label: "High Risk", value: stats?.high_risk ?? 0, icon: Shield, color: "text-red-500" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="text-center p-4 rounded-xl bg-slate-50 dark:bg-surface-800">
                <Icon className={`w-5 h-5 mx-auto mb-2 ${item.color}`} />
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{item.value}</p>
                <p className="text-xs text-slate-500 mt-1">{item.label}</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Visualizations */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Risk Distribution */}
        <Card hover={false}>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
          </CardHeader>
          <div className="space-y-4">
            {[
              { label: "Low Risk", pct: 60, color: "bg-emerald-500" },
              { label: "Medium Risk", pct: 25, color: "bg-amber-500" },
              { label: "High Risk", pct: 12, color: "bg-red-500" },
              { label: "Critical", pct: 3, color: "bg-red-700" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                  <span className="font-medium text-slate-900 dark:text-white">{item.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-surface-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all duration-1000 ease-out`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Clause Types */}
        <Card hover={false}>
          <CardHeader>
            <CardTitle>Common Clause Types</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {[
              { type: "Confidentiality", count: 145 },
              { type: "Payment Terms", count: 132 },
              { type: "Termination", count: 128 },
              { type: "Indemnification", count: 98 },
              { type: "Liability", count: 87 },
              { type: "IP Rights", count: 76 },
              { type: "Governing Law", count: 72 },
              { type: "Data Protection", count: 65 },
            ].map((item, i) => (
              <div key={item.type} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-4">{i + 1}</span>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{item.type}</span>
                </div>
                <Badge variant="default" size="sm">{item.count}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Review Throughput */}
      <Card hover={false}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Review Efficiency</CardTitle>
            <div className="flex items-center gap-1.5 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">+18% this month</span>
            </div>
          </div>
        </CardHeader>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10">
            <p className="text-2xl font-bold text-emerald-600">4.2</p>
            <p className="text-xs text-emerald-600/70 mt-1">Avg. Review (min)</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10">
            <p className="text-2xl font-bold text-blue-600">92%</p>
            <p className="text-xs text-blue-600/70 mt-1">Acceptance Rate</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-violet-50 dark:bg-violet-900/10">
            <p className="text-2xl font-bold text-violet-600">156</p>
            <p className="text-xs text-violet-600/70 mt-1">Items Reviewed</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10">
            <p className="text-2xl font-bold text-amber-600">7</p>
            <p className="text-xs text-amber-600/70 mt-1">Escalated</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
