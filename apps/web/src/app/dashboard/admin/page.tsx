"use client";

import React, { useEffect, useState } from "react";
import {
  Settings,
  Shield,
  Users,
  Clock,
  FileText,
  ChevronRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { api, AuditLogEntry } from "@/lib/api";

export default function AdminPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAuditLogs({ page: 1 })
      .then((res) => setLogs(res.logs))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          System settings and audit trail
        </p>
      </div>

      {/* Quick Settings */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          {
            icon: Users,
            title: "Team Management",
            desc: "Invite members and manage roles",
            gradient: "from-blue-500 to-cyan-500",
          },
          {
            icon: Shield,
            title: "Security",
            desc: "API keys, SSO, and permissions",
            gradient: "from-emerald-500 to-green-500",
          },
          {
            icon: Settings,
            title: "AI Configuration",
            desc: "LLM provider, model, and parameters",
            gradient: "from-violet-500 to-purple-500",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="cursor-pointer group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient}
                      flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary-500 transition-colors" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Audit Trail */}
      <Card hover={false}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Audit Trail</CardTitle>
            <Badge variant="default">{logs.length} entries</Badge>
          </div>
        </CardHeader>

        {loading ? (
          <p className="text-sm text-slate-500 py-8 text-center">Loading audit logs...</p>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400">No audit logs yet</p>
            <p className="text-sm text-slate-500 mt-1">
              Actions will appear here once users interact with the system
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center gap-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-surface-800 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900 dark:text-white truncate">
                    {log.action}
                  </p>
                  <p className="text-xs text-slate-500">
                    {log.user_email || "System"} • {log.resource_type}
                    {log.resource_id ? ` • ${log.resource_id.slice(0, 8)}...` : ""}
                  </p>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">
                  {new Date(log.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
