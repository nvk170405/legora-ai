"use client";

import React from "react";
import Link from "next/link";
import {
  Shield,
  FileSearch,
  AlertTriangle,
  MessageSquare,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Zap,
  Lock,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const features = [
  {
    icon: FileSearch,
    title: "Contract Summarization",
    description:
      "Get comprehensive, structured summaries of any contract in seconds. Identify key parties, obligations, dates, and notable provisions instantly.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: AlertTriangle,
    title: "Risk Assessment",
    description:
      "AI-powered risk scoring flags uncapped liabilities, one-sided indemnities, weak termination clauses, and missing standard protections.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: MessageSquare,
    title: "Contract Q&A",
    description:
      "Ask natural language questions about any contract. Get precise, cited answers grounded in the document — never hallucinated.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: CheckCircle,
    title: "Human-in-the-Loop Review",
    description:
      "Every AI suggestion flows through a structured review workflow. Accept, reject, edit, or escalate — with full audit trail.",
    gradient: "from-emerald-500 to-green-500",
  },
];

const stats = [
  { value: "85%", label: "Faster Review" },
  { value: "40+", label: "Clause Types" },
  { value: "99.2%", label: "Accuracy" },
  { value: "SOC 2", label: "Compliant" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 overflow-hidden">
      {/* ── Navigation ─────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Legora AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#security" className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
              Security
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link href="/login?tab=register">
              <Button size="sm">
                Get Started
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Mesh gradient background */}
        <div className="absolute inset-0 gradient-mesh" />
        <div className="absolute top-20 right-1/4 w-72 h-72 bg-primary-400/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 left-1/4 w-96 h-96 bg-accent-400/8 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 mb-8 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
            <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
              Powered by Fine-Tuned LLaMA + RAG
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white leading-[1.1] tracking-tight text-balance animate-slide-up">
            AI Contract Analysis
            <br />
            <span className="gradient-text">You Can Trust</span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-balance animate-slide-up stagger-1">
            Summarize contracts, extract clauses, assess risk, and ask questions — all with 
            full audit trail and human review workflows. Built for legal and procurement teams.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up stagger-2">
            <Link href="/login?tab=register">
              <Button size="lg">
                Start Analyzing Contracts
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="secondary" size="lg">
                See How It Works
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto animate-slide-up stagger-3">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold gradient-text">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 bg-white dark:bg-surface-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
              Everything You Need for
              <span className="gradient-text"> Contract Intelligence</span>
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              From upload to approval — a complete AI-assisted workflow for contract review.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group relative glass-card p-8 hover:shadow-lg transition-all duration-300"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
              Three Steps to
              <span className="gradient-text"> Smarter Contracts</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: Zap,
                title: "Upload",
                description:
                  "Drag & drop PDF, DOCX, or TXT. Our parser handles OCR for scanned documents automatically.",
              },
              {
                step: "02",
                icon: Sparkles,
                title: "Analyze",
                description:
                  "AI summarizes, extracts 40+ clause types, scores risk, and answers your questions — all grounded in the document.",
              },
              {
                step: "03",
                icon: CheckCircle,
                title: "Review & Approve",
                description:
                  "Review AI suggestions, accept or edit, finalize with full audit trail. Every decision is logged and traceable.",
              },
            ].map((step, i) => (
              <div key={step.step} className="text-center group">
                <div className="relative inline-block mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <step.icon className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full gradient-bg text-white text-xs font-bold flex items-center justify-center">
                    {step.step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security ───────────────────────────────────────── */}
      <section id="security" className="py-24 px-6 bg-white dark:bg-surface-900">
        <div className="max-w-5xl mx-auto">
          <div className="glass-card p-10 md:p-16 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mb-6">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              Enterprise-Grade Security
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
              Multi-tenant data isolation, immutable audit logs, role-based access control,
              and SOC 2 compliant infrastructure. Your contracts never leave your environment.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                "Multi-Tenant Isolation",
                "RBAC",
                "Audit Trail",
                "Data Encryption",
                "Self-Hosted Option",
              ].map((item) => (
                <span
                  key={item}
                  className="px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium border border-emerald-200 dark:border-emerald-800"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Ready to Transform Your Contract Review?
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
            Join legal and procurement teams saving 85% of review time.
          </p>
          <Link href="/login?tab=register">
            <Button size="lg">
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-700 dark:text-slate-300">Legora AI</span>
          </div>
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Legora AI. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Privacy</a>
            <a href="#" className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Terms</a>
            <a href="#" className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
