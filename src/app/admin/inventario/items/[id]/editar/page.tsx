import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import type { InventarioItem } from "@/lib/inventario/types";
import { InventoryItemForm } from "../../InventoryItemForm";

export const dynamic = "force-dynamic";

const CATEGORY_COLUMNS = "id,nombre";
const ITEM_COLUMNS = [
  "id",
  "nombre",
  "slug",
  "categoria_id",
  "descripcion",
  "uso",
  "unidad",
  "cantidad_actual",
  "valor_unitario",
  "tipo_regla",
  "foto_url",
  "activo",
  "created_at",
].join(",");

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function InventoryItemEditPage({ params }: PageProps) {
  const resolvedParams = await params;
  const itemId = resolvedParams?.id?.trim();
  const session = await getAdminSession();

  if (!session.allowed) {
    redirect(`/login?next=/admin/inventario/items/${itemId || ""}/editar`);
  }

  if (!itemId) {
    redirect("/admin/inventario?error=%C3%8Dtem+inv%C3%A1lido");
  }

  const [{ data: categoriesData, error: categoriesError }, { data: itemData, error: itemError }] = await Promise.all([
    supabaseService.from("inventario_categorias").select(CATEGORY_COLUMNS).order("nombre", { ascending: true }),
    supabaseService.from("inventario_items").select(ITEM_COLUMNS).eq("id", itemId).maybeSingle<InventarioItem>(),
  ]);

  const categories = (categoriesData ?? []) as Array<{ id: string; nombre: string }>;
  const item = itemData ?? null;
  const errorMessage = itemError?.message || categoriesError?.message || (item ? "" : "No encontramos este ítem.");

  return (
    <div className="space-y-6">
      <Link
        href="/admin/inventario"
        className="inline-flex items-center gap-2 text-sm text-blue-600 transition hover:text-blue-800"
      >
        ← Volver al listado
      </Link>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Editar ítem de inventario</h1>
        <p className="text-sm text-slate-600">Actualiza datos, stock y reglas de asignación para este elemento.</p>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{errorMessage}</div>
      ) : null}

      {!item ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/90 px-5 py-6 text-sm text-slate-600">
          No pudimos cargar este ítem. Vuelve al listado de inventario y selecciona otro registro.
        </div>
      ) : (
        <InventoryItemForm mode="edit" categories={categories} initialData={item} />
      )}
    </div>
  );
}
