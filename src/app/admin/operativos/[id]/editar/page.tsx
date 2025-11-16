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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Editar operativo</h1>
          <p className="text-sm text-slate-500">Actualiza los datos y guarda los cambios.</p>
        </div>
        <div className="flex gap-3 text-sm">
          <Link href={`/admin/operativos/${id}`} className="text-blue-600 underline">
            Ver detalle
          </Link>
          <Link href="/admin/operativos" className="text-blue-600 underline">
            Volver al listado
          </Link>
        </div>
      </div>

      {successMessage && (
        <div className="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <OperativoForm action="/api/admin/operativos/update" submitLabel="Guardar cambios" defaults={defaults}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="redirectTo" value={`/admin/operativos/${id}?success=Operativo+actualizado`} />
      </OperativoForm>
    </div>
  );
}
