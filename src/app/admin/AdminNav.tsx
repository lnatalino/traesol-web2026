"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Tab = {
  label: string;
  href: string;
  isActive: (path: string) => boolean;
  superadminOnly?: boolean;
};

const tabs: Tab[] = [
  { label: "Panel", href: "/admin", isActive: (path: string) => path === "/admin" },
  {
    label: "Operativos",
    href: "/admin/operativos",
    isActive: (path: string) => path.startsWith("/admin/operativos"),
  },
  {
    label: "Voluntarios",
    href: "/admin/voluntarios",
    isActive: (path: string) => path.startsWith("/admin/voluntarios"),
  },
  {
    label: "Inscripciones",
    href: "/admin/inscripciones",
    isActive: (path: string) => path.startsWith("/admin/inscripciones"),
  },
  {
    label: "Invitaciones",
    href: "/admin/invitaciones",
    isActive: (path: string) => path.startsWith("/admin/invitaciones"),
  },
  {
    label: "Mensajería",
    href: "/admin/mensajeria",
    isActive: (path: string) => path.startsWith("/admin/mensajeria"),
  },
  {
    label: "Novedades",
    href: "/admin/novedades",
    isActive: (path: string) => path.startsWith("/admin/novedades"),
  },
  {
    label: "Empresas",
    href: "/admin/empresas/productos",
    isActive: (path: string) => path.startsWith("/admin/empresas"),
  },
  {
    label: "Inventario",
    href: "/admin/inventario",
    isActive: (path: string) => path.startsWith("/admin/inventario"),
  },
  {
    label: "Operativo quirúrgico",
    href: "/admin/quirurgico/operativos",
    isActive: (path: string) => path.startsWith("/admin/quirurgico"),
  },
  {
    label: "Usuarios",
    href: "/admin/usuarios",
    isActive: (path: string) => path.startsWith("/admin/usuarios"),
    superadminOnly: true,
  },
];

export function AdminNav() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // Leer rol desde cookie (traesol-role es httpOnly, necesitamos otra forma)
    // Usamos un endpoint simple para obtener el rol actual
    async function fetchRole() {
      try {
        const res = await fetch("/api/admin/session");
        if (res.ok) {
          const data = await res.json();
          setRole(data.role || null);
        }
      } catch {
        // Ignorar errores
      }
    }
    fetchRole();
  }, []);

  const visibleTabs = tabs.filter((tab) => {
    if (tab.superadminOnly) {
      return role === "superadmin";
    }
    return true;
  });

  return (
    <nav className="flex flex-wrap gap-2 text-sm font-medium text-slate-600">
      {visibleTabs.map((tab) => {
        const active = tab.isActive(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 ${
              active
                ? "bg-blue-600 text-white shadow"
                : "text-slate-600 hover:bg-white hover:text-slate-900"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
