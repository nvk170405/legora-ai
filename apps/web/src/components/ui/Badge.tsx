"use client";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "purple";
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

const variantStyles = {
  default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  danger: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  info: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  purple: "bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const dotColors = {
  default: "bg-slate-400",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
  purple: "bg-purple-500",
};

export function Badge({
  children,
  variant = "default",
  size = "sm",
  dot = false,
  className = "",
}: BadgeProps) {
  const sizeStyles = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full ${variantStyles[variant]} ${sizeStyles} ${className}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
}

/** Map contract status to badge variant */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: BadgeProps["variant"]; label: string }> = {
    uploaded: { variant: "default", label: "Uploaded" },
    processing: { variant: "info", label: "Processing" },
    analyzed: { variant: "purple", label: "Analyzed" },
    in_review: { variant: "warning", label: "In Review" },
    approved: { variant: "success", label: "Approved" },
    rejected: { variant: "danger", label: "Rejected" },
  };
  const { variant, label } = map[status] || { variant: "default" as const, label: status };
  return <Badge variant={variant} dot>{label}</Badge>;
}

/** Map risk level to badge */
export function RiskBadge({ level }: { level: string }) {
  const map: Record<string, { variant: BadgeProps["variant"]; label: string }> = {
    low: { variant: "success", label: "Low Risk" },
    medium: { variant: "warning", label: "Medium Risk" },
    high: { variant: "danger", label: "High Risk" },
    critical: { variant: "danger", label: "Critical" },
  };
  const { variant, label } = map[level] || { variant: "default" as const, label: level };
  return <Badge variant={variant}>{label}</Badge>;
}
