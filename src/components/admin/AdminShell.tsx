// src/components/admin/AdminShell.tsx
"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-white">
      <AdminSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-20 flex items-center gap-3 border-b border-slate-200/80 bg-white/90 backdrop-blur px-4 py-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-bold text-slate-800">Panel Admin</span>
      </header>

      {/* Main content area */}
      <main
        className={`transition-[margin] duration-200 ease-in-out ${
          collapsed ? "lg:ml-[68px]" : "lg:ml-[260px]"
        }`}
      >
        <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
