import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminSession";
import EmpresaProductoForm from "../EmpresaProductoForm";

export default async function EmpresaProductoNuevoPage() {
  const session = await getAdminSession();
  if (!session.allowed) {
    redirect("/login?next=/admin/empresas/productos/nuevo");
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
        <h1 className="text-3xl font-semibold text-slate-900">Nuevo producto para empresas</h1>
        <p className="text-sm text-slate-600">
          Configura un servicio que podrán seleccionar las empresas al hacer una solicitud.
        </p>
      </div>
      <EmpresaProductoForm mode="create" />
    </div>
  );
}
