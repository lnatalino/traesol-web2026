import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import { OperativoForm } from "@/app/admin/operativos/_form";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type OperativoImageRow = {
  id: string;
  url: string | null;
  path: string | null;
};

type OperativoEditRow = {
  id: string;
  titulo: string | null;
  slug: string | null;
  descripcion: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  lugar: string | null;
  direccion: string | null;
  cupos_total: number | null;
  estado: string | null;
  imagen_cabecera_url: string | null;
  instagram_url: string | null;
  whatsapp_grupo_url: string | null;
  lanyard_type_id: string | null;
  operativo_imagenes: OperativoImageRow[] | null;
};

type LanyardTypeRow = {
  id: string;
  name: string;
  ribbon_color_name: string;
  ribbon_hex: string | null;
  is_active: boolean;
};

function toInputDate(value: string | null): string | null {
  if (!value) return null;
  return value.slice(0, 10);
}

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

  // Cargar lanyard types disponibles
  const { data: lanyardTypes } = await supabaseService
    .from("lanyard_types")
    .select("id, name, ribbon_color_name, ribbon_hex")
    .eq("is_active", true)
    .order("display_order");

  const { data, error } = await supabaseService
    .from("operativos")
    .select(
      "id,titulo,slug,descripcion,fecha_inicio,fecha_fin,lugar,direccion,cupos_total,estado,imagen_cabecera_url,instagram_url,whatsapp_grupo_url,lanyard_type_id,operativo_imagenes(id,url,path)"
    )
    .eq("id", id)
    .maybeSingle<OperativoEditRow>();

  if (error) {
    const url = `/admin/operativos?error=${encodeURIComponent(String(error.message))}`;
    redirect(url);
  }

  if (!data) {
    notFound();
  }

  const { operativo_imagenes: rawImages, ...rest } = data;
  const gallery = Array.isArray(rawImages)
    ? rawImages
        .filter((img): img is OperativoImageRow & { url: string; path: string } => Boolean(img?.url && img?.path))
        .map((img) => ({ id: img.id, url: img.url!, path: img.path! }))
    : [];

  const defaults = {
    ...rest,
    fecha_inicio: toInputDate(rest.fecha_inicio),
    fecha_fin: toInputDate(rest.fecha_fin),
    imagenes: gallery,
  };

  const errorMessage = typeof sp?.error === "string" ? sp.error : "";
  const successMessage = typeof sp?.success === "string" ? sp.success : "";

  return (
    <div className="space-y-8">
      <AdminHeader
        eyebrow="Operativos"
        title="Editar operativo"
        description="Actualiza los datos, suma material gráfico y publica cuando el operativo esté listo para difusión."
        action={(
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              href={`/admin/operativos/${id}`}
              className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Ver detalle
            </Link>
            <Link
              href="/admin/operativos"
              className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2 font-semibold text-blue-700 transition hover:bg-blue-100"
            >
              Volver al listado
            </Link>
          </div>
        )}
      />

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

      <OperativoForm 
        action="/api/admin/operativos/update" 
        submitLabel="Guardar cambios" 
        defaults={defaults}
        lanyardTypes={lanyardTypes ?? []}
      >
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="redirectTo" value={`/admin/operativos/${id}?success=Operativo+actualizado`} />
      </OperativoForm>
    </div>
  );
}
