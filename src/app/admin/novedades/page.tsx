type NovedadRow = {
  id: string;
  titulo: string;
  slug: string | null;
  bajada: string | null;
  imagen_portada_url: string | null;
  link_externo: string | null;
  fecha_publicacion: string | null;
  publicado: boolean | null;
  en_carrusel: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, CircleAlert } from "lucide-react";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import NovedadesTable from "./NovedadesTable";

export default async function AdminNovedadesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const session = await getAdminSession();
  if (!session.allowed) {
    redirect("/login?next=/admin/novedades");
  }

  const success = typeof params?.success === "string" ? params.success : "";
  const errorParam = typeof params?.error === "string" ? params.error : "";

  let novedades: NovedadRow[] = [];
  let fetchError = "";

  try {
    const { data, error } = await supabaseService
      .from("novedades")
      .select(
        "id,titulo,slug,bajada,imagen_portada_url,link_externo,fecha_publicacion,publicado,en_carrusel,created_at,updated_at"
      )
      .order("fecha_publicacion", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    novedades = (data ?? []) as NovedadRow[];
  } catch (err: any) {
    fetchError = err?.message ? String(err.message) : "No se pudieron cargar las novedades.";
  }

  const notice = success || "";
  const errorMessage = errorParam || fetchError;

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-slate-100 bg-white/95 p-6 shadow-lg shadow-blue-900/5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">Novedades</p>
            <h1 className="text-3xl font-semibold text-slate-900">Contenido destacado</h1>
            <p className="text-sm text-slate-500 max-w-2xl">
              Administra lo que aparece en la portada, el carrusel del home y las notas recientes del sitio público.
            </p>
          </div>
          <Link
            href="/admin/novedades/nueva"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:shadow-xl"
          >
            <BadgeCheck className="h-4 w-4" aria-hidden="true" />
            Nueva novedad
          </Link>
        </div>
      </section>

      {notice ? (
        <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-5 py-4 text-sm font-medium text-emerald-700 shadow">
          <BadgeCheck className="h-5 w-5" aria-hidden="true" />
          <span>{notice}</span>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 shadow">
          <CircleAlert className="h-5 w-5" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <NovedadesTable items={novedades} initialMessage={notice} />
    </div>
  );
}
