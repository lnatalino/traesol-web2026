"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Operativos", href: "/admin/quirurgico/operativos" },
  { label: "Pacientes (legacy)", href: "/admin/quirurgico/pacientes" },
];

export function QuirurgicoTabs() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap gap-2 text-sm font-medium text-slate-600">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
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
    </div>
  );
}
