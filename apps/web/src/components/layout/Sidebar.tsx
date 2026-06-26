"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  LayoutDashboard,
  CheckSquare,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Contracts",
    href: "/dashboard/contracts",
    icon: FileText,
  },
  {
    label: "Review",
    href: "/dashboard/review",
    icon: CheckSquare,
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    label: "Admin",
    href: "/dashboard/admin",
    icon: Settings,
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen flex flex-col
        bg-white dark:bg-surface-900 border-r border-slate-200 dark:border-slate-800
        transition-all duration-300 ease-in-out
        ${collapsed ? "w-[72px]" : "w-64"}`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-100 dark:border-slate-800">
        <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center flex-shrink-0">
          <Shield className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold gradient-text whitespace-nowrap">
            Legora AI
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname?.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-200 group
                ${
                  isActive
                    ? "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-surface-800 hover:text-slate-900 dark:hover:text-white"
                }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 transition-colors
                  ${isActive ? "text-primary-600 dark:text-primary-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"}`}
              />
              {!collapsed && <span>{item.label}</span>}
              {isActive && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User & Collapse */}
      <div className="border-t border-slate-100 dark:border-slate-800 p-3 space-y-2">
        {/* User */}
        {user && (
          <div
            className={`flex items-center gap-3 px-3 py-2 rounded-xl ${collapsed ? "justify-center" : ""}`}
          >
            <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {user.full_name?.charAt(0).toUpperCase() || "U"}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {user.full_name}
                </p>
                <p className="text-xs text-slate-500 truncate">{user.role}</p>
              </div>
            )}
          </div>
        )}

        {/* Logout */}
        <button
          onClick={logout}
          className={`flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm
            text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20
            transition-all duration-200
            ${collapsed ? "justify-center" : ""}`}
          title="Logout"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full p-2 rounded-xl
            text-slate-400 hover:text-slate-600 dark:hover:text-white
            hover:bg-slate-50 dark:hover:bg-surface-800
            transition-all duration-200"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
