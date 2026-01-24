import Link from "next/link";

export type InventoryTabKey = "items" | "categorias" | "lanyard-types";

const tabs = [
  {
    key: "items" as const,
    label: "Inventario",
    description: "Listado general",
    href: "/admin/inventario",
  },
  {
    key: "categorias" as const,
    label: "Categorías",
    description: "Organiza tipos de ítems",
    href: "/admin/inventario/categorias",
  },
  {
    key: "lanyard-types" as const,
    label: "Tipos de Lanyard",
    description: "Colores por tema/cáncer",
    href: "/admin/inventario/lanyard-types",
  },
];

export function InventoryTabs({ active }: { active: InventoryTabKey }) {
  return (
    <div className="flex flex-wrap gap-3 rounded-[28px] border border-slate-200 bg-white/80 p-2 text-sm text-slate-600 shadow-sm">
      {tabs.map((tab) => {
        const selected = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            className={`flex flex-1 min-w-[160px] flex-col rounded-2xl border px-4 py-3 transition ${
              selected
                ? "border-blue-100 bg-blue-50/80 text-blue-900 shadow"
                : "border-transparent hover:border-slate-200 hover:bg-white"
            }`}
          >
            <span className="text-xs font-semibold uppercase tracking-[0.3em]">{tab.label}</span>
            <span className="text-base font-semibold text-slate-900">{tab.description}</span>
          </Link>
        );
      })}
    </div>
  );
}
