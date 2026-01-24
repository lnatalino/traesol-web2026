import { redirect } from "next/navigation";
import { AdminHero } from "@/components/admin/AdminHero";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import type { InventarioCategoria } from "@/lib/inventario/types";
import { InventoryTabs } from "../components/InventoryTabs";
import { CategoryManager } from "./CategoryManager";

export const dynamic = "force-dynamic";

export default async function AdminInventarioCategoriasPage() {
  const session = await getAdminSession();
  if (!session.allowed) {
    redirect("/login?next=/admin/inventario/categorias");
  }

  const [categoriasRes, itemsRes] = await Promise.all([
    supabaseService.from("inventario_categorias").select("id,nombre,slug,descripcion,created_at").order("nombre"),
    supabaseService.from("inventario_items").select("id,categoria_id"),
  ]);

  const categorias: InventarioCategoria[] = categoriasRes.data ?? [];
  const categoriaError = categoriasRes.error?.message ? String(categoriasRes.error.message) : "";
  const items: Array<{ id: string; categoria_id: string | null }> = itemsRes.data ?? [];
  const itemsError = itemsRes.error?.message ? String(itemsRes.error.message) : "";

  const categoryCounts = items.reduce<Record<string, number>>((acc, item) => {
    if (item.categoria_id) {
      acc[item.categoria_id] = (acc[item.categoria_id] ?? 0) + 1;
    }
    return acc;
  }, {});

  const totalItems = items.length;
  const latestCreatedAt = categorias.reduce<string | null>((latest, categoria) => {
    if (!categoria.created_at) return latest;
    if (!latest) return categoria.created_at;
    return new Date(categoria.created_at) > new Date(latest) ? categoria.created_at : latest;
  }, null);
  const errorMessage = categoriaError || itemsError;

  return (
    <div className="space-y-6">
      <AdminHero
        eyebrow="Admin · Inventario"
        title="Categorías de inventario"
        description="Crea y organiza los grupos que usarás al cargar ítems."
        footer={(
          <dl className="grid gap-4 text-sm text-white sm:grid-cols-3">
            <div className="rounded-2xl border border-white/30 bg-white/10 p-4">
              <dt className="text-xs uppercase tracking-[0.3em] text-white/70">Categorías registradas</dt>
              <dd className="mt-1 text-2xl font-semibold">{categorias.length}</dd>
            </div>
            <div className="rounded-2xl border border-white/30 bg-white/10 p-4">
              <dt className="text-xs uppercase tracking-[0.3em] text-white/70">Ítems asociados</dt>
              <dd className="mt-1 text-2xl font-semibold">{totalItems}</dd>
            </div>
            <div className="rounded-2xl border border-white/30 bg-white/10 p-4">
              <dt className="text-xs uppercase tracking-[0.3em] text-white/70">Última actualización</dt>
              <dd className="mt-1 text-2xl font-semibold">
                {latestCreatedAt ? new Date(latestCreatedAt).toLocaleDateString("es-CL") : "—"}
              </dd>
            </div>
          </dl>
        )}
      />

      <InventoryTabs active="categorias" />

      {errorMessage ? (
        <div className="rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          {errorMessage}
        </div>
      ) : null}

      <CategoryManager initialCategories={categorias} categoryCounts={categoryCounts} />
    </div>
  );
}
