import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
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

  // Cargar lanyard types disponibles
  const { data: lanyardTypes } = await supabaseService
    .from("lanyard_types")
    .select("id, name, ribbon_color_name, ribbon_hex")
    .eq("is_active", true)
    .order("display_order");

  const errorMessage = typeof params?.error === "string" ? params.error : "";
  const successMessage = typeof params?.success === "string" ? params.success : "";

  return (
    <div className="space-y-6">
      <AdminHeader
        eyebrow="Operativos"
        title="Nuevo operativo"
        description="Crea un operativo multiespecialidad, carga sus fechas y deja todo listo para publicar cuando estés preparado."
        action={(
          <Link
            href="/admin/operativos"
            className="inline-flex items-center rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Volver al listado
          </Link>
        )}
      />

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-5 py-4 text-sm font-medium text-emerald-700 shadow">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 shadow">
          {errorMessage}
        </div>
      ) : null}

      <OperativoForm 
        action="/api/admin/operativos/create" 
        submitLabel="Crear operativo"
        lanyardTypes={lanyardTypes ?? []}
      >
        <input type="hidden" name="redirectTo" value="/admin/operativos" />
      </OperativoForm>
    </div>
  );
}
