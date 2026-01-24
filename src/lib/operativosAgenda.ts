// src/lib/operativosAgenda.ts
// Funciones para obtener operativos para la agenda pública (Home)

import { createSupabaseServer } from "@/lib/supabaseServer";
import { toChileDateString } from "@/lib/operativosShared";

export type UpcomingOperativoRow = {
  id: string;
  titulo: string | null;
  slug: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  lugar: string | null;
  estado: string | null;
  imagen_cabecera_url: string | null;
  operativo_imagenes?: Array<{ url: string | null; path: string | null }>;
};

export type AgendaOperativo = {
  id: string;
  titulo: string;
  slug: string;
  fecha_inicio: string;
  lugar: string | null;
  imagen: string;
};

const PLACEHOLDER_IMAGE = "https://placehold.co/800x400?text=Operativo+Traesol";

/**
 * Obtiene los próximos N operativos para la agenda de Home.
 * 
 * Reglas de filtrado:
 * 1. Estado = "publicado" (excluye borrador, cerrado, finalizado)
 * 2. fecha_inicio >= hoy (operativos futuros, no pasados)
 * 3. Si existe fecha_fin, debe ser > ahora (no auto-finalizado)
 * 
 * Orden: fecha_inicio ASC (los más próximos primero)
 */
export async function getUpcomingOperativos(limit: number = 3): Promise<AgendaOperativo[]> {
  const supabase = createSupabaseServer();
  const hoy = toChileDateString();

  try {
    // Query: publicados con fecha_inicio >= hoy, ordenados por fecha_inicio ASC
    const { data, error } = await supabase
      .from("operativos")
      .select("id,titulo,slug,fecha_inicio,fecha_fin,lugar,estado,imagen_cabecera_url,operativo_imagenes(url,path)")
      .eq("estado", "publicado")
      .gte("fecha_inicio", hoy)
      .order("fecha_inicio", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(limit)
      .returns<UpcomingOperativoRow[]>();

    if (error) {
      console.error("[getUpcomingOperativos] Error:", error);
      return [];
    }

    // Filtrar adicionalmente los que no han sido auto-finalizados por fecha_fin
    const now = new Date();
    const filtered = (data ?? []).filter((op) => {
      // Si tiene fecha_fin y ya pasó, excluir
      if (op.fecha_fin) {
        const fin = new Date(op.fecha_fin);
        if (!Number.isNaN(fin.getTime()) && fin < now) {
          return false;
        }
      }
      return true;
    });

    // Mapear a formato limpio
    return filtered.slice(0, limit).map((op) => {
      const fallbackImage = op.operativo_imagenes?.[0]?.url;
      const imagen = op.imagen_cabecera_url || fallbackImage || PLACEHOLDER_IMAGE;
      
      return {
        id: op.id,
        titulo: op.titulo || "Operativo Traesol",
        slug: op.slug,
        fecha_inicio: op.fecha_inicio || "",
        lugar: op.lugar,
        imagen,
      };
    });
  } catch (err) {
    console.error("[getUpcomingOperativos] Exception:", err);
    return [];
  }
}

/**
 * Cuenta el total de operativos en la agenda (para stats)
 */
export async function countUpcomingOperativos(): Promise<number> {
  const supabase = createSupabaseServer();
  const hoy = toChileDateString();

  try {
    const { count, error } = await supabase
      .from("operativos")
      .select("id", { count: "exact", head: true })
      .eq("estado", "publicado")
      .gte("fecha_inicio", hoy);

    if (error) {
      console.error("[countUpcomingOperativos] Error:", error);
      return 0;
    }

    return count ?? 0;
  } catch {
    return 0;
  }
}
