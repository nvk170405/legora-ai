"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { useAuthStore } from "@/stores/authStore";
import { Search, Bell, Moon, Sun } from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [darkMode, setDarkMode] = React.useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <Sidebar />

      {/* Main Content */}
      <div className="ml-64 min-h-screen transition-all duration-300">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 glass border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between px-6">
          {/* Search */}
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search contracts, clauses, documents..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl
                bg-slate-100/80 dark:bg-surface-800/80
                border border-transparent
                focus:border-primary-300 dark:focus:border-primary-600
                focus:bg-white dark:focus:bg-surface-800
                focus:outline-none focus:ring-2 focus:ring-primary-500/20
                text-slate-700 dark:text-slate-200
                placeholder:text-slate-400
                transition-all duration-200"
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-surface-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              className="relative p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-surface-800 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
