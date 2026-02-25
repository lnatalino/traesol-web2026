// src/components/admin/AdminSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import {
  LayoutDashboard,
  Stethoscope,
  Users,
  ClipboardList,
  Send,
  Mail,
  Megaphone,
  ClipboardCheck,
  BriefcaseBusiness,
  Boxes,
  HeartPulse,
  UserCog,
  ChevronLeft,
  ChevronRight,
  X,
  Heart,
  type LucideIcon,
} from "lucide-react";

/* ===== Types ===== */
type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  isActive: (path: string) => boolean;
  superadminOnly?: boolean;
};

type SidebarSection = {
  title: string;
  items: SidebarItem[];
};

/* ===== Navigation Definition ===== */
const SECTIONS: SidebarSection[] = [
  {
    title: "General",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
        isActive: (p) => p === "/admin",
      },
    ],
  },
  {
    title: "Operativos",
    items: [
      {
        label: "Operativos",
        href: "/admin/operativos",
        icon: Stethoscope,
        isActive: (p) => p.startsWith("/admin/operativos"),
      },
      {
        label: "Voluntarios",
        href: "/admin/voluntarios",
        icon: Users,
        isActive: (p) => p.startsWith("/admin/voluntarios"),
      },
      {
        label: "Inscripciones",
        href: "/admin/inscripciones",
        icon: ClipboardList,
        isActive: (p) => p.startsWith("/admin/inscripciones"),
      },
      {
        label: "Invitaciones",
        href: "/admin/invitaciones",
        icon: Send,
        isActive: (p) => p.startsWith("/admin/invitaciones"),
      },
    ],
  },
  {
    title: "Comunicación",
    items: [
      {
        label: "Mensajería",
        href: "/admin/mensajeria",
        icon: Mail,
        isActive: (p) => p.startsWith("/admin/mensajeria"),
      },
      {
        label: "Novedades",
        href: "/admin/novedades",
        icon: Megaphone,
        isActive: (p) => p.startsWith("/admin/novedades"),
      },
      {
        label: "Encuestas",
        href: "/admin/encuestas",
        icon: ClipboardCheck,
        isActive: (p) => p.startsWith("/admin/encuestas"),
      },
    ],
  },
  {
    title: "Recursos",
    items: [
      {
        label: "Empresas",
        href: "/admin/empresas/productos",
        icon: BriefcaseBusiness,
        isActive: (p) => p.startsWith("/admin/empresas"),
      },
      {
        label: "Inventario",
        href: "/admin/inventario",
        icon: Boxes,
        isActive: (p) => p.startsWith("/admin/inventario"),
      },
    ],
  },
  {
    title: "Quirúrgico",
    items: [
      {
        label: "Operativo quirúrgico",
        href: "/admin/quirurgico/operativos",
        icon: HeartPulse,
        isActive: (p) => p.startsWith("/admin/quirurgico"),
      },
    ],
  },
  {
    title: "Administración",
    items: [
      {
        label: "Usuarios",
        href: "/admin/usuarios",
        icon: UserCog,
        isActive: (p) => p.startsWith("/admin/usuarios"),
        superadminOnly: true,
      },
    ],
  },
];

/* ===== Component ===== */
export function AdminSidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    async function fetchRole() {
      try {
        const res = await fetch("/api/admin/session");
        if (res.ok) {
          const data = await res.json();
          setRole(data.role || null);
          setUserEmail(data.email || "");
        }
      } catch {
        // silent
      }
    }
    fetchRole();
  }, []);

  // Close mobile drawer on navigation
  useEffect(() => {
    onMobileClose();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredSections = useMemo(() => {
    return SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.superadminOnly || role === "superadmin"
      ),
    })).filter((section) => section.items.length > 0);
  }, [role]);

  const roleBadge = role === "superadmin" ? "Superadmin" : "Admin";
  const roleBadgeColor =
    role === "superadmin"
      ? "bg-purple-50 text-purple-700 border-purple-200"
      : "bg-blue-50 text-blue-700 border-blue-200";

  const sidebarContent = (
    <>
      {/* Header */}
      <div className={`p-4 border-b border-slate-100 ${collapsed ? "px-3" : ""}`}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
            <Heart className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 truncate">Panel Admin</p>
              <p className="text-xs text-slate-500 truncate">{userEmail || "Cargando..."}</p>
            </div>
          )}
        </div>
        {!collapsed && role && (
          <div className="mt-3">
            <span
              className={`inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${roleBadgeColor}`}
            >
              {roleBadge}
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {filteredSections.map((section) => (
          <div key={section.title} className="mb-4">
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = item.isActive(pathname);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                        active
                          ? "bg-blue-50 text-blue-700 shadow-sm"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      } ${collapsed ? "justify-center px-2" : ""}`}
                    >
                      <Icon
                        className={`h-[18px] w-[18px] shrink-0 ${
                          active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                        }`}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Collapse toggle (desktop only) */}
      <div className="hidden lg:block border-t border-slate-100 p-3">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Colapsar</span>
            </>
          )}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 h-screen bg-white border-r border-slate-200/80 z-30 transition-[width] duration-200 ease-in-out ${
          collapsed ? "w-[68px]" : "w-[260px]"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed left-0 top-0 h-screen w-[280px] bg-white border-r border-slate-200/80 z-50 flex flex-col transition-transform duration-300 ease-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile close button */}
        <div className="absolute top-3 right-3 z-10">
          <button
            onClick={onMobileClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {sidebarContent}
      </aside>
    </>
  );
}
