"use client";

import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export function Input({
  label,
  error,
  helperText,
  icon,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full rounded-xl border bg-white dark:bg-surface-800 text-slate-900 dark:text-white placeholder:text-slate-400
            ${icon ? "pl-10" : "pl-4"} pr-4 py-2.5 text-sm
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500
            ${error
              ? "border-red-300 dark:border-red-500"
              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
            }
            ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({
  label,
  error,
  className = "",
  id,
  ...props
}: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-800
          text-slate-900 dark:text-white placeholder:text-slate-400
          px-4 py-2.5 text-sm transition-all duration-200 resize-none
          focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500
          hover:border-slate-300 dark:hover:border-slate-600
          ${error ? "border-red-300 dark:border-red-500" : ""}
          ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
