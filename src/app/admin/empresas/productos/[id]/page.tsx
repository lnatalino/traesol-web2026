import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import type { EmpresaProductoRow } from "@/lib/empresas";
import EmpresaProductoForm from "../EmpresaProductoForm";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function EmpresaProductoEditPage({ params }: PageProps) {
  const resolvedParams = params instanceof Promise ? await params : params;
  const session = await getAdminSession();
  if (!session.allowed) {
    redirect("/login?next=/admin/empresas/productos");
  }

  const { data: producto, error } = await supabaseService
    .from("empresa_productos")
    .select("*")
    .eq("id", resolvedParams.id)
    .maybeSingle<EmpresaProductoRow>();

  if (error || !producto) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/empresas/productos"
          className="inline-flex items-center gap-2 text-sm text-blue-600 transition hover:text-blue-800"
        >
          ← Volver al listado
        </Link>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Producto no encontrado</h1>
          <p className="text-sm text-slate-500">
            No pudimos encontrar un producto con el identificador solicitado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/empresas/productos"
        className="inline-flex items-center gap-2 text-sm text-blue-600 transition hover:text-blue-800"
      >
        ← Volver al listado
      </Link>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-slate-900">Editar producto para empresas</h1>
        <p className="text-sm text-slate-600">{producto.nombre}</p>
      </div>
      <EmpresaProductoForm mode="edit" initialData={producto} />
    </div>
  );
}
