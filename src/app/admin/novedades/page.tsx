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
import { BadgeCheck, FileText, ImageIcon, Megaphone } from "lucide-react";
import { AdminPageHeader, StatTile, StatTileGrid } from "@/components/admin/ui";
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

  // Stats
  const totalNovedades = novedades.length;
  const publicadas = novedades.filter((n) => n.publicado === true).length;
  const enCarrusel = novedades.filter((n) => n.en_carrusel === true).length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        backHref="/admin"
        eyebrow="Novedades"
        title="Novedades y carrusel"
        description="Administra las noticias visibles en la web. Define cuáles aparecen en el carrusel de inicio."
        successMessage={notice}
        errorMessage={errorMessage}
        actions={
          <Link
            href="/admin/novedades/nueva"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:shadow-xl"
          >
            <BadgeCheck className="h-4 w-4" aria-hidden="true" />
            Nueva novedad
          </Link>
        }
      />

      {/* Stats */}
      <StatTileGrid>
        <StatTile 
          icon={<FileText className="h-4 w-4" />}
          label="Total novedades"
          value={totalNovedades}
        />
        <StatTile 
          icon={<Megaphone className="h-4 w-4" />}
          label="Publicadas"
          value={publicadas}
          highlight
          highlightVariant="emerald"
        />
        <StatTile 
          icon={<ImageIcon className="h-4 w-4" />}
          label="En carrusel"
          value={enCarrusel}
          highlight
          highlightVariant="blue"
        />
      </StatTileGrid>

      <NovedadesTable items={novedades} initialMessage={notice} />
    </div>
  );
}
