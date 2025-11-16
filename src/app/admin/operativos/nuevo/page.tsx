import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminSession";
import { OperativoForm } from "@/app/admin/operativos/_form";

export const dynamic = "force-dynamic";

export default async function NuevoOperativoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const session = await getAdminSession();
  if (!session.allowed) {
    redirect("/login?next=/admin/operativos/nuevo");
  }

  const error = typeof params?.error === "string" ? params.error : "";
  const success = typeof params?.success === "string" ? params.success : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Nuevo operativo</h1>
          <p className="text-sm text-slate-500">Crea un operativo y publícalo cuando esté listo.</p>
        </div>
        <Link href="/admin/operativos" className="text-sm text-blue-600 underline">
          Volver al listado
        </Link>
      </div>

      {success && (
        <div className="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <OperativoForm action="/api/admin/operativos/create" submitLabel="Crear operativo">
        <input type="hidden" name="redirectTo" value="/admin/operativos" />
      </OperativoForm>
    </div>
  );
}
