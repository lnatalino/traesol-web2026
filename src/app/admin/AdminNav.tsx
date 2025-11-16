"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Admin", href: "/admin", isActive: (path: string) => path === "/admin" },
  {
    label: "Operativos",
    href: "/admin/operativos",
    isActive: (path: string) => path.startsWith("/admin/operativos"),
  },
  {
    label: "Novedades",
    href: "/admin/novedades",
    isActive: (path: string) => path.startsWith("/admin/novedades"),
  },
  {
    label: "Voluntarios",
    href: "/admin/voluntarios",
    isActive: (path: string) => path.startsWith("/admin/voluntarios"),
  },
  {
    label: "Invitaciones",
    href: "/admin/invitaciones",
    isActive: (path: string) => path.startsWith("/admin/invitaciones"),
  },
  {
    label: "Inscripciones",
    href: "/admin/inscripciones",
    isActive: (path: string) => path.startsWith("/admin/inscripciones"),
  },
  {
    label: "Empresas",
    href: "/admin/empresas/productos",
    isActive: (path: string) => path.startsWith("/admin/empresas"),
  },
  {
    label: "Mensajería",
    href: "/admin/mensajeria",
    isActive: (path: string) => path.startsWith("/admin/mensajeria"),
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-6 text-sm">
      {tabs.map((tab) => {
        const active = tab.isActive(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={active ? "font-semibold text-slate-900" : "text-slate-600 hover:text-slate-900"}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
