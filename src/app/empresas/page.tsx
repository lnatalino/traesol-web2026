import { EmpresasClient } from "./EmpresasClient";
import { EmpresasHeroMetrics } from "./EmpresasHeroMetrics";
import { PublicHero } from "@/components/public";
import type {
  EmpresaPackItemView,
  EmpresaProductoCategoria,
  EmpresaProductoRowBase,
  EmpresaProductoWithPackItems,
} from "@/lib/empresas";
import { getEmpresaMetrics, mapEmpresaProductoRow, mapEmpresaProductoRows } from "@/lib/empresas";
import { createSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function EmpresasPage() {
  const supabase = createSupabaseServer();
  const productosQuery = supabase
    .from("empresa_productos")
    .select("*")
    .eq("activo", true)
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });

  const [empresaMetrics, productosResponse] = await Promise.all([getEmpresaMetrics(), productosQuery]);
  const { data, error } = productosResponse;

  const productosBase = (data ?? []) as EmpresaProductoRowBase[];
  const mappedProductos = mapEmpresaProductoRows(productosBase);

  const packProductIds = mappedProductos.filter((producto) => producto.categoria === "pack").map((producto) => producto.id);
  let productos: EmpresaProductoWithPackItems[] = mappedProductos;

  if (packProductIds.length) {
    type PackItemQueryRow = {
      id: string;
      pack_id: string;
      producto_id: string;
      cantidad: number | null;
      producto: EmpresaProductoRowBase | null;
    };

    const { data: packItemsData, error: packItemsError } = await supabase
      .from("empresa_pack_items")
      .select("id,pack_id,producto_id,cantidad,producto:empresa_productos!empresa_pack_items_producto_id_fkey(*)")
      .in("pack_id", packProductIds);

    if (packItemsError) {
      console.error("EmpresasPage pack items", packItemsError);
    } else if (packItemsData?.length) {
      const packItemsByPackId = new Map<string, EmpresaPackItemView[]>();
      const packItemRows = packItemsData as unknown as PackItemQueryRow[];
      packItemRows.forEach((item) => {
        const productoDetalle = item.producto ? mapEmpresaProductoRow(item.producto) : null;
        const resumen =
          productoDetalle?.resumen_corto ||
          productoDetalle?.descripcion_corta ||
          productoDetalle?.descripcion_larga ||
          null;
        const view: EmpresaPackItemView = {
          id: item.id,
          productoBaseId: productoDetalle?.id ?? item.producto_id,
          nombre: productoDetalle?.nombre ?? "Servicio",
          resumen,
          categoria: (productoDetalle?.categoria as EmpresaProductoCategoria | undefined) ?? null,
          cantidad: item.cantidad ?? 1,
          productoDetalle,
        };
        const current = packItemsByPackId.get(item.pack_id) ?? [];
        current.push(view);
        packItemsByPackId.set(item.pack_id, current);
      });

      productos = mappedProductos.map((producto) => {
        const packItems = packItemsByPackId.get(producto.id);
        if (!packItems?.length) return producto;
        return { ...producto, packItems } satisfies EmpresaProductoWithPackItems;
      });
    }
  }
  const errorMessage = error?.message ? `No pudimos cargar el catálogo: ${error.message}` : null;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <PublicHero
        eyebrow="Programas para empresas"
        title="Conecta a tu equipo con el impacto social"
        subtitle="Diseñamos operativos de salud, voluntariado corporativo y experiencias formativas que transforman a las comunidades y fortalecen la cultura interna de tu empresa."
      >
        <EmpresasHeroMetrics metrics={empresaMetrics} />
      </PublicHero>

      {/* Contenido */}
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-12">
        {errorMessage ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
        ) : null}
        <EmpresasClient productos={productos} />
      </div>
    </main>
  );
}
