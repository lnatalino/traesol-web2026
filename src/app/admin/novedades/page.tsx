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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Novedades</h1>
          <p className="text-sm text-slate-500">Gestiona lo que aparece en la portada y el carrusel del sitio.</p>
        </div>
        <Link
          href="/admin/novedades/nueva"
          className="inline-flex items-center gap-2 rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
        >
          <BadgeCheck className="h-4 w-4" aria-hidden="true" />
          Nueva novedad
        </Link>
      </div>

      {notice ? (
        <div className="flex items-start gap-2 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
          <BadgeCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{notice}</span>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <NovedadesTable
        items={novedades}
        initialMessage={notice}
      />
    </div>
  );
}
