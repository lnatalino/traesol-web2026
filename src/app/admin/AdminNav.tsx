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
    <nav className="flex flex-wrap gap-2 text-sm font-medium text-slate-600">
      {tabs.map((tab) => {
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
