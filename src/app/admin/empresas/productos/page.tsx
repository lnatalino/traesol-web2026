import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminPageHeader, StatTile, StatTileGrid, AdminSectionCard } from "@/components/admin/ui";
import { getAdminSession } from "@/lib/adminSession";
import type { EmpresaProductoRow, EmpresaProductoRowBase } from "@/lib/empresas";
import { getEmpresaMetrics, mapEmpresaProductoRows } from "@/lib/empresas";
import { supabaseService } from "@/lib/supabaseService";
import { BarChart3, Package, PackageCheck, Eye } from "lucide-react";
import EmpresaProductosTable from "./EmpresaProductosTable";
import { EmpresaMetricsForm } from "../EmpresaMetricsForm";

export const dynamic = "force-dynamic";

export default async function AdminEmpresaProductosPage() {
  const session = await getAdminSession();
  if (!session.allowed) {
    redirect("/login?next=/admin/empresas/productos");
  }

  const metrics = await getEmpresaMetrics();

  const { data, error } = await supabaseService
    .from("empresa_productos")
    .select("*")
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });
  const productosBase = (data ?? []) as EmpresaProductoRowBase[];
  const productos = mapEmpresaProductoRows(productosBase);
  const errorMessage = error?.message ? String(error.message) : "";

  // Stats
  const totalProductos = productos.length;
  const productosActivos = productos.filter((p) => p.activo === true).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        backHref="/admin"
        eyebrow="Empresas"
        title="Alianzas con empresas"
        description="Catálogo de productos, packs y métricas para aliados corporativos."
        errorMessage={errorMessage}
        actions={
          <Link
            href="/admin/empresas/productos/nuevo"
            className="inline-flex items-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Nuevo producto
          </Link>
        }
      />

      {/* Stats */}
      <StatTileGrid>
        <StatTile 
          icon={<Package className="h-4 w-4" />}
          label="Total productos"
          value={totalProductos}
        />
        <StatTile 
          icon={<PackageCheck className="h-4 w-4" />}
          label="Productos activos"
          value={productosActivos}
          highlight
          highlightVariant="emerald"
        />
      </StatTileGrid>

      <AdminSectionCard 
        title="Métricas de impacto"
        hint="Edita los totales que aparecen en el hero de Empresas"
        icon={<BarChart3 className="h-5 w-5" />}
        actions={
          <Link
            href="/empresas"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition hover:text-blue-700"
          >
            <Eye className="h-4 w-4" />
            Ver página pública
          </Link>
        }
      >
        <EmpresaMetricsForm initialMetrics={metrics} />
      </AdminSectionCard>

      <EmpresaProductosTable initialProductos={productos} />
    </div>
  );
}
