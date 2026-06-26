"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { RiskBadge } from "@/components/ui/Badge";
import { ClauseItem } from "@/lib/api";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";

interface ClauseCardProps {
  clause: ClauseItem;
}

export function ClauseCard({ clause }: ClauseCardProps) {
  const [expanded, setExpanded] = React.useState(false);

  const typeColor: Record<string, string> = {
    payment_terms: "from-emerald-500 to-green-500",
    termination: "from-red-500 to-rose-500",
    confidentiality: "from-blue-500 to-cyan-500",
    indemnification: "from-amber-500 to-orange-500",
    liability: "from-red-500 to-pink-500",
    intellectual_property: "from-violet-500 to-purple-500",
    governing_law: "from-slate-500 to-gray-500",
    warranty: "from-cyan-500 to-teal-500",
    force_majeure: "from-orange-500 to-amber-500",
    data_protection: "from-indigo-500 to-blue-500",
  };

  const gradient = typeColor[clause.clause_type] || "from-primary-500 to-primary-600";

  return (
    <Card
      padding="sm"
      className="cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3 p-2">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}
        >
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                {clause.title || clause.clause_type.replace(/_/g, " ")}
              </p>
              {clause.summary && (
                <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">
                  {clause.summary}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <RiskBadge level={clause.risk_level} />
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </div>

          {clause.page_number && (
            <p className="text-xs text-slate-400 mt-1">Page {clause.page_number}</p>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 mx-2 border-t border-slate-100 dark:border-slate-800 animate-[slide-up_0.2s_ease-out]">
          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
            {clause.content}
          </p>
          {clause.key_values && Object.keys(clause.key_values).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(clause.key_values).map(([key, val]) => (
                <span
                  key={key}
                  className="text-xs px-2 py-1 rounded-lg bg-primary-50 dark:bg-primary-900/20
                    text-primary-700 dark:text-primary-400"
                >
                  {key}: {String(val)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
