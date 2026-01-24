import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader, StatTile, StatTileGrid, AdminSectionCard } from "@/components/admin/ui";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import type { InventarioCategoria, InventarioItem } from "@/lib/inventario/types";
import { Boxes, CheckCircle, FolderOpen, XCircle, Download } from "lucide-react";
import { InventoryTabs } from "./components/InventoryTabs";
import { InventoryItemsTable } from "./components/InventoryItemsTable";

export const dynamic = "force-dynamic";

const ITEM_COLUMNS = [
  "id",
  "nombre",
  "slug",
  "categoria_id",
  "cantidad_actual",
  "tipo_regla",
  "uso",
  "descripcion",
  "unidad",
  "valor_unitario",
  "foto_url",
  "activo",
  "created_at",
].join(",");

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type InventoryFilters = {
  search: string;
  categoriaId: string;
  onlyActive: boolean;
};

const DEFAULT_FILTERS: InventoryFilters = {
  search: "",
  categoriaId: "",
  onlyActive: true,
};

function parseFilters(params: Record<string, string | string[] | undefined>): InventoryFilters {
  const rawSearch = params.search;
  const search = typeof rawSearch === "string" ? rawSearch.trim() : "";
  const rawCategoria = params.categoria;
  const categoriaId = typeof rawCategoria === "string" ? rawCategoria : "";
  const rawSolo = params.soloActivos;
  let onlyActive = true;
  if (typeof rawSolo === "string") {
    onlyActive = rawSolo === "1" || rawSolo === "true";
  } else if (Array.isArray(rawSolo)) {
    const last = rawSolo[rawSolo.length - 1];
    onlyActive = last === "1" || last === "true";
  } else if (typeof rawSolo === "undefined") {
    onlyActive = DEFAULT_FILTERS.onlyActive;
  }
  return { search, categoriaId, onlyActive };
}

function escapeSearchTerm(value: string): string {
  return value.replace(/,/g, "\\,");
}

export default async function AdminInventarioPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await getAdminSession();
  if (!session.allowed) {
    redirect("/login?next=/admin/inventario");
  }

  const params = await searchParams;
  const filters = parseFilters(params);

  const [categoriasRes, itemsRes] = await Promise.all([
    supabaseService.from("inventario_categorias").select("id,nombre,slug,descripcion,created_at").order("nombre"),
    (async () => {
      let query = supabaseService
        .from("inventario_items")
        .select(ITEM_COLUMNS, { count: "exact" })
        .order("nombre", { ascending: true });

      if (filters.categoriaId) {
        query = query.eq("categoria_id", filters.categoriaId);
      }
      if (filters.onlyActive) {
        query = query.eq("activo", true);
      }
      if (filters.search) {
        const escaped = escapeSearchTerm(filters.search);
        query = query.or(`nombre.ilike.%${escaped}%,slug.ilike.%${escaped}%`);
      }
      return query;
    })(),
  ]);

  const categorias: InventarioCategoria[] = categoriasRes.data ?? [];
  const categoriasMap = new Map(categorias.map((categoria) => [categoria.id, categoria.nombre]));
  const categoriaError = categoriasRes.error?.message ? String(categoriasRes.error.message) : "";

  const itemsData: InventarioItem[] = itemsRes.data ?? [];
  const totalItems = typeof itemsRes.count === "number" ? itemsRes.count : itemsData.length;
  const itemsError = itemsRes.error?.message ? String(itemsRes.error.message) : "";
  const errorMessage = itemsError || categoriaError;

  const tableItems = itemsData.map((item) => ({
    ...item,
    categoriaLabel: item.categoria_id ? categoriasMap.get(item.categoria_id) ?? "Sin categoría" : "Sin categoría",
  }));

  const activeCount = itemsData.filter((item) => item.activo).length;
  const inactiveCount = totalItems - activeCount;

  const successMessage = typeof params.success === "string" ? params.success : "";

  return (
    <div className="space-y-6">
      <AdminPageHeader
        backHref="/admin"
        eyebrow="Inventario"
        title="Gestión de inventario"
        description="Uniformes, credenciales, lanyards y materiales de operativos."
        successMessage={successMessage}
        errorMessage={errorMessage}
      />

      {/* Stats */}
      <StatTileGrid>
        <StatTile 
          icon={<Boxes className="h-4 w-4" />}
          label="Ítems totales"
          value={totalItems}
        />
        <StatTile 
          icon={<CheckCircle className="h-4 w-4" />}
          label="Ítems activos"
          value={activeCount}
          highlight
          highlightVariant="emerald"
        />
        <StatTile 
          icon={<XCircle className="h-4 w-4" />}
          label="Ítems inactivos"
          value={inactiveCount}
          highlight={inactiveCount > 0}
          highlightVariant="amber"
        />
        <StatTile 
          icon={<FolderOpen className="h-4 w-4" />}
          label="Categorías"
          value={categorias.length}
          highlight
          highlightVariant="blue"
        />
      </StatTileGrid>

      <InventoryTabs active="items" />

      <AdminSectionCard title="Filtros" hint="Busca por nombre o slug, filtra por categoría o estado.">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex flex-wrap gap-2">
            <a
              href="/api/admin/inventario/export?type=stock"
              className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              <Download className="h-3 w-3" />
              Exportar stock
            </a>
            <a
              href="/api/admin/inventario/export?type=deliveries"
              className="inline-flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700 transition hover:bg-purple-100"
            >
              <Download className="h-3 w-3" />
              Exportar entregas
            </a>
          </div>
          <Link
            href="/admin/inventario/items/nuevo"
            className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Nuevo ítem
          </Link>
        </div>
        <form className="grid gap-4 md:grid-cols-[2fr,2fr,1fr]">
          <label className="space-y-1 text-sm">
            <span className="font-semibold text-slate-700">Buscar</span>
            <input
              type="text"
              name="search"
              defaultValue={filters.search}
              placeholder="Nombre o slug"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-semibold text-slate-700">Categoría</span>
            <select
              name="categoria"
              defaultValue={filters.categoriaId}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
            >
              <option value="">Todas</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-2 text-sm font-medium text-slate-700">
            <input
              type="hidden"
              name="soloActivos"
              value="0"
            />
            <input
              type="checkbox"
              name="soloActivos"
              value="1"
              defaultChecked={filters.onlyActive}
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            Solo activos
          </label>
          <div className="md:col-span-3 flex items-center gap-3 text-sm text-slate-500">
            <button
              type="submit"
              className="inline-flex items-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Aplicar filtros
            </button>
            <Link href="/admin/inventario" className="text-sm font-semibold text-slate-600 transition hover:text-slate-900">
              Limpiar
            </Link>
          </div>
        </form>
      </AdminSectionCard>

      <InventoryItemsTable items={tableItems} errorMessage={errorMessage} />
    </div>
  );
}
