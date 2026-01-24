import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import type { InventarioCategoria } from "@/lib/inventario/types";
import { InventoryItemForm } from "../InventoryItemForm";

export default async function InventoryItemCreatePage() {
  const session = await getAdminSession();
  if (!session.allowed) {
    redirect("/login?next=/admin/inventario/items/nuevo");
  }

  const { data, error } = await supabaseService
    .from("inventario_categorias")
    .select("id,nombre")
    .order("nombre", { ascending: true });
  const categories: Array<Pick<InventarioCategoria, "id" | "nombre">> = data ?? [];
  const errorMessage = error?.message ? String(error.message) : "";

  return (
    <div className="space-y-6">
      <Link href="/admin/inventario" className="inline-flex items-center gap-2 text-sm text-blue-600 transition hover:text-blue-800">
        ← Volver al listado
      </Link>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Nuevo ítem de inventario</h1>
        <p className="text-sm text-slate-600">
          Registra uniformes, credenciales y materiales que se entregan en los operativos.
        </p>
      </div>
      {errorMessage ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{errorMessage}</div>
      ) : null}
      {categories.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/90 px-5 py-4 text-sm text-slate-600">
          Primero debes crear una categoría en <Link href="/admin/inventario/categorias" className="font-semibold text-blue-600">Inventario · Categorías</Link>.
        </div>
      ) : null}
      <InventoryItemForm mode="create" categories={categories} />
    </div>
  );
}
