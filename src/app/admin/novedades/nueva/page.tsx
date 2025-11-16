import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, CircleAlert } from "lucide-react";
import { getAdminSession } from "@/lib/adminSession";
import { NovedadForm } from "@/app/admin/novedades/_form";

export const dynamic = "force-dynamic";

export default async function NuevaNovedadPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const session = await getAdminSession();
  if (!session.allowed) {
    redirect("/login?next=/admin/novedades/nueva");
  }

  const error = typeof params?.error === "string" ? params.error : "";
  const success = typeof params?.success === "string" ? params.success : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Nueva novedad</h1>
          <p className="text-sm text-slate-500">Crea una novedad y publícala cuando esté lista.</p>
        </div>
        <Link href="/admin/novedades" className="text-sm text-blue-600 underline">
          Volver al listado
        </Link>
      </div>

      {success ? (
        <div className="flex items-start gap-2 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
          <BadgeCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{success}</span>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      <NovedadForm action="/api/admin/novedades/create" submitLabel="Crear novedad">
        <input type="hidden" name="redirectTo" value="/admin/novedades?success=Novedad+creada" />
      </NovedadForm>
    </div>
  );
}
