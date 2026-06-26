"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";

interface ContractUploaderProps {
  onUploadComplete?: (contract: any) => void;
}

const CONTRACT_TYPES = [
  { value: "nda", label: "NDA" },
  { value: "vendor_agreement", label: "Vendor Agreement" },
  { value: "employment", label: "Employment" },
  { value: "lease", label: "Lease" },
  { value: "sla", label: "SLA" },
  { value: "master_service_agreement", label: "MSA" },
  { value: "statement_of_work", label: "Statement of Work" },
  { value: "license", label: "License" },
  { value: "other", label: "Other" },
];

export function ContractUploader({ onUploadComplete }: ContractUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [contractType, setContractType] = useState("other");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const f = acceptedFiles[0];
      setFile(f);
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
      setError("");
    }
  }, [title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const handleUpload = async () => {
    if (!file || !title) return;
    setUploading(true);
    setError("");

    try {
      const contract = await api.uploadContract(file, title, contractType);
      onUploadComplete?.(contract);
      setFile(null);
      setTitle("");
      setContractType("other");
    } catch (err: any) {
      setError(err.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
          transition-all duration-300 group
          ${isDragActive
            ? "border-primary-500 bg-primary-50/50 dark:bg-primary-900/10"
            : "border-slate-300 dark:border-slate-700 hover:border-primary-400 hover:bg-slate-50/50 dark:hover:bg-surface-800/50"
          }
          ${file ? "border-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/10" : ""}`}
      >
        <input {...getInputProps()} />

        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="w-8 h-8 text-emerald-500" />
            <div className="text-left">
              <p className="font-medium text-slate-900 dark:text-white">{file.name}</p>
              <p className="text-sm text-slate-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); }}
              className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-100 to-accent-100 dark:from-primary-900/30 dark:to-accent-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Upload className="w-7 h-7 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="text-base font-medium text-slate-700 dark:text-slate-200">
                {isDragActive ? "Drop your contract here" : "Drag & drop your contract"}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                PDF, DOCX, or TXT — up to 50MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Metadata Form */}
      {file && (
        <div className="space-y-3 animate-[slide-up_0.3s_ease-out]">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Contract Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-800
                text-slate-900 dark:text-white px-4 py-2.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500
                transition-all duration-200"
              placeholder="Enter contract title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Contract Type
            </label>
            <select
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-800
                text-slate-900 dark:text-white px-4 py-2.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500
                transition-all duration-200"
            >
              {CONTRACT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <Button
            onClick={handleUpload}
            isLoading={uploading}
            className="w-full"
            size="lg"
          >
            <Upload className="w-4 h-4" />
            Upload & Analyze
          </Button>
        </div>
      )}
    </div>
  );
}
