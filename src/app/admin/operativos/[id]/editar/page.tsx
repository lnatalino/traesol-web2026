import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import { OperativoForm } from "@/app/admin/operativos/_form";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function EditarOperativoPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const session = await getAdminSession();
  const sp = await searchParams;
  const { id } = await params;

  if (!session.allowed) {
    redirect(`/login?next=/admin/operativos/${id}/editar`);
  }

  if (!id) {
    notFound();
  }

  const { data, error } = await supabaseService
    .from("operativos")
    .select(
      "id,titulo,slug,descripcion,fecha_inicio,fecha_fin,lugar,direccion,cupos_total,estado,imagen_cabecera_url,instagram_url,whatsapp_grupo_url,operativo_imagenes(id,url,path)"
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    const url = `/admin/operativos?error=${encodeURIComponent(String(error.message))}`;
    redirect(url);
  }

  if (!data) {
    notFound();
  }

  const { operativo_imagenes, ...rest } = (data as any) ?? {};

  const defaults = {
    ...rest,
    fecha_inicio: data?.fecha_inicio ? String(data.fecha_inicio).slice(0, 10) : null,
    fecha_fin: data?.fecha_fin ? String(data.fecha_fin).slice(0, 10) : null,
    imagenes: Array.isArray(operativo_imagenes)
      ? (operativo_imagenes as Array<{ id: string; url: string; path: string }>).map((img) => ({
          id: img.id,
          url: img.url,
          path: img.path,
        }))
      : [],
  };

  const errorMessage = typeof sp?.error === "string" ? sp.error : "";
  const successMessage = typeof sp?.success === "string" ? sp.success : "";

  return (
    <div className="space-y-8">
      <section className="rounded-[36px] border border-white/10 bg-gradient-to-br from-slate-900 to-blue-900 p-6 text-white shadow-2xl shadow-slate-900/30">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/70">Operativos</p>
            <h1 className="text-3xl font-semibold">Editar operativo</h1>
            <p className="text-sm text-white/70">Actualiza los datos, agrega material y publica cuando esté listo.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              href={`/admin/operativos/${id}`}
              className="inline-flex items-center rounded-full border border-white/30 px-4 py-2 font-semibold text-white transition hover:bg-white/10"
            >
              Ver detalle
            </Link>
            <Link
              href="/admin/operativos"
              className="inline-flex items-center rounded-full bg-white/90 px-4 py-2 font-semibold text-slate-900 transition hover:bg-white"
            >
              Volver al listado
            </Link>
          </div>
        </div>
      </section>

      {successMessage ? (
        <div className="rounded-[28px] border border-emerald-200/70 bg-emerald-50/80 px-5 py-4 text-sm font-medium text-emerald-900 shadow-sm">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-[28px] border border-rose-200/70 bg-rose-50/80 px-5 py-4 text-sm font-medium text-rose-900 shadow-sm">
          {errorMessage}
        </div>
      ) : null}

      <OperativoForm action="/api/admin/operativos/update" submitLabel="Guardar cambios" defaults={defaults}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="redirectTo" value={`/admin/operativos/${id}?success=Operativo+actualizado`} />
      </OperativoForm>
    </div>
  );
}
