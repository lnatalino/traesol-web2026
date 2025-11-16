import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminSession";
import type { EmpresaProductoRow } from "@/lib/empresas";
import { supabaseService } from "@/lib/supabaseService";
import EmpresaProductosTable from "./EmpresaProductosTable";

export const dynamic = "force-dynamic";

export default async function AdminEmpresaProductosPage() {
  const session = await getAdminSession();
  if (!session.allowed) {
    redirect("/login?next=/admin/empresas/productos");
  }

  const { data, error } = await supabaseService
    .from("empresa_productos")
    .select("*")
    .order("orden", { ascending: true })
    .order("nombre", { ascending: true });
  const productos = (data ?? []) as EmpresaProductoRow[];
  const errorMessage = error?.message ? String(error.message) : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Empresas</p>
          <h1 className="text-3xl font-semibold text-slate-900">Productos para empresas</h1>
          <p className="text-sm text-slate-500">
            Catálogo de servicios que se mostrarán en la sección Empresas del sitio público.
          </p>
        </div>
        <Link
          href="/admin/empresas/productos/nuevo"
          className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          Nuevo producto
        </Link>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <EmpresaProductosTable initialProductos={productos} />
    </div>
  );
}
