"use client";

import React from "react";
import { AlertTriangle, Shield, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge, RiskBadge } from "@/components/ui/Badge";
import { RiskAssessmentResponse } from "@/lib/api";

interface RiskDashboardProps {
  data: RiskAssessmentResponse;
}

export function RiskDashboard({ data }: RiskDashboardProps) {
  const scorePercent = Math.round(data.overall_risk_score * 100);
  const scoreColor =
    scorePercent > 70
      ? "text-red-500"
      : scorePercent > 40
      ? "text-amber-500"
      : "text-emerald-500";

  const ringColor =
    scorePercent > 70
      ? "stroke-red-500"
      : scorePercent > 40
      ? "stroke-amber-500"
      : "stroke-emerald-500";

  return (
    <div className="space-y-6">
      {/* Score + Summary */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Score Ring */}
        <Card hover={false} className="flex flex-col items-center justify-center py-8">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18" cy="18" r="15.5"
                fill="none"
                className="stroke-slate-200 dark:stroke-slate-700"
                strokeWidth="2.5"
              />
              <circle
                cx="18" cy="18" r="15.5"
                fill="none"
                className={`${ringColor} transition-all duration-1000 ease-out`}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={`${scorePercent} ${100 - scorePercent}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${scoreColor}`}>{scorePercent}</span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
          </div>
          <RiskBadge level={data.risk_level} />
          <p className="text-sm text-slate-500 mt-2 text-center">Overall Risk Score</p>
        </Card>

        {/* Summary */}
        <Card hover={false} className="md:col-span-2">
          <CardHeader>
            <CardTitle>Risk Summary</CardTitle>
          </CardHeader>
          <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
            {data.risk_summary}
          </p>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-xl bg-red-50 dark:bg-red-900/10">
              <p className="text-2xl font-bold text-red-600">
                {data.risk_factors.filter((f) => f.severity === "high" || f.severity === "critical").length}
              </p>
              <p className="text-xs text-red-600/70">High / Critical</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10">
              <p className="text-2xl font-bold text-amber-600">
                {data.risk_factors.filter((f) => f.severity === "medium").length}
              </p>
              <p className="text-xs text-amber-600/70">Medium</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10">
              <p className="text-2xl font-bold text-emerald-600">
                {data.risk_factors.filter((f) => f.severity === "low").length}
              </p>
              <p className="text-xs text-emerald-600/70">Low</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Risk Factors */}
      {data.risk_factors.length > 0 && (
        <Card hover={false}>
          <CardHeader>
            <CardTitle>Risk Factors</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {data.risk_factors.map((factor, i) => (
              <div
                key={i}
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800
                  hover:bg-slate-50 dark:hover:bg-surface-800/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                        ${factor.severity === "critical" || factor.severity === "high"
                          ? "bg-red-100 dark:bg-red-900/20"
                          : factor.severity === "medium"
                          ? "bg-amber-100 dark:bg-amber-900/20"
                          : "bg-emerald-100 dark:bg-emerald-900/20"
                        }`}
                    >
                      <AlertTriangle
                        className={`w-4 h-4
                          ${factor.severity === "critical" || factor.severity === "high"
                            ? "text-red-600"
                            : factor.severity === "medium"
                            ? "text-amber-600"
                            : "text-emerald-600"
                          }`}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {factor.category.replace(/_/g, " ")}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {factor.description}
                      </p>
                      {factor.clause_reference && (
                        <p className="text-xs text-slate-500 mt-1">
                          Ref: {factor.clause_reference}
                        </p>
                      )}
                      {factor.recommendation && (
                        <div className="mt-2 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800">
                          <p className="text-xs text-blue-700 dark:text-blue-400">
                            💡 {factor.recommendation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <RiskBadge level={factor.severity} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Missing Clauses */}
      {data.missing_clauses.length > 0 && (
        <Card hover={false}>
          <CardHeader>
            <CardTitle>Missing Clauses</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {data.missing_clauses.map((clause, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30
                  bg-amber-50/50 dark:bg-amber-900/5"
              >
                <Shield className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {clause.clause_type.replace(/_/g, " ")}
                  </p>
                  <Badge variant={clause.importance === "required" ? "danger" : "warning"} size="sm" className="mt-1">
                    {clause.importance}
                  </Badge>
                  {clause.recommendation && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                      {clause.recommendation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
