import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, CircleAlert } from "lucide-react";
import { AdminHero } from "@/components/admin/AdminHero";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import { NovedadForm } from "@/app/admin/novedades/_form";

export const dynamic = "force-dynamic";

type NovedadRow = {
  id: string;
  titulo: string;
  slug: string | null;
  bajada: string | null;
  cuerpo: string | null;
  imagen_portada_url: string | null;
  link_externo: string | null;
  fecha_publicacion: string | null;
  publicado: boolean | null;
  en_carrusel: boolean | null;
  en_novedades: boolean | null;
  novedad_imagenes?: Array<{ id: string; url: string; path: string }>;
};

export default async function EditarNovedadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;

  const session = await getAdminSession();
  if (!session.allowed) {
    redirect(`/login?next=/admin/novedades/${id}/editar`);
  }

  const success = typeof query?.success === "string" ? query.success : "";
  const errorParam = typeof query?.error === "string" ? query.error : "";

  let novedad: NovedadRow | null = null;
  let fetchError = "";

  try {
    const { data, error } = await supabaseService
      .from("novedades")
      .select(
        "id,titulo,slug,bajada,cuerpo,imagen_portada_url,link_externo,fecha_publicacion,publicado,en_carrusel,en_novedades,novedad_imagenes(id,url,path)"
      )
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    novedad = (data as NovedadRow | null) ?? null;
  } catch (err: any) {
    fetchError = err?.message ? String(err.message) : "No se pudo cargar la novedad.";
  }

  if (!novedad) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Novedad no encontrada</h1>
          <Link href="/admin/novedades" className="text-sm text-blue-600 underline">
            Volver al listado
          </Link>
        </div>
        <p className="text-sm text-slate-600">
          {fetchError || "Revisa que el identificador sea correcto o que la novedad no haya sido eliminada."}
        </p>
      </div>
    );
  }

  const defaultsForForm = {
    ...novedad,
    imagenes: (novedad.novedad_imagenes ?? []).map((img) => ({
      id: img.id,
      url: img.url,
      path: img.path,
    })),
  };

  return (
    <div className="space-y-8">
      <AdminHero
        eyebrow="Novedades"
        title="Editar novedad"
        description="Ajusta el contenido, la galería y el estado de publicación."
        rightSlot={(
          <Link
            href="/admin/novedades"
            className="inline-flex items-center rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white"
          >
            Volver al listado
          </Link>
        )}
      />

      {success ? (
        <div className="flex items-start gap-2 rounded-[28px] border border-emerald-200/70 bg-emerald-50/80 px-5 py-4 text-sm font-medium text-emerald-900 shadow-sm">
          <BadgeCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{success}</span>
        </div>
      ) : null}

      {(errorParam || fetchError) ? (
        <div className="flex items-start gap-2 rounded-[28px] border border-rose-200/70 bg-rose-50/80 px-5 py-4 text-sm font-medium text-rose-900 shadow-sm">
          <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{errorParam || fetchError}</span>
        </div>
      ) : null}

      <NovedadForm
        action="/api/admin/novedades/update"
        submitLabel="Guardar cambios"
        defaults={defaultsForForm}
      >
        <input type="hidden" name="id" value={novedad.id} />
        <input
          type="hidden"
          name="redirectTo"
          value={`/admin/novedades/${novedad.id}/editar?success=Datos+actualizados`}
        />
      </NovedadForm>
    </div>
  );
}
