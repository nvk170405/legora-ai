"use client";

import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
  padding?: "sm" | "md" | "lg";
}

export function Card({
  children,
  className = "",
  hover = true,
  glass = false,
  padding = "md",
}: CardProps) {
  const paddings = { sm: "p-4", md: "p-6", lg: "p-8" };

  const base = glass
    ? "glass-card"
    : "bg-white dark:bg-surface-800 border border-slate-200 dark:border-slate-700/50 rounded-xl shadow-sm";

  const hoverEffect = hover
    ? "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
    : "";

  return (
    <div className={`${base} ${paddings[padding]} ${hoverEffect} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={`text-lg font-semibold text-slate-900 dark:text-white ${className}`}>
      {children}
    </h3>
  );
}
