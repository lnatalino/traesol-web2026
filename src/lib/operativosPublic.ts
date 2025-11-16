// src/lib/operativosPublic.ts
import type { PublicOperativo } from "@/lib/operativosShared";

export type PublicOperativoRow = {
  id: string;
  titulo: string | null;
  slug: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  lugar: string | null;
  estado: string | null;
};

export const PUBLIC_OPERATIVO_FIELDS = "id,titulo,slug,fecha_inicio,fecha_fin,lugar,estado";

export const PUBLIC_OPERATIVO_STATES = ["publicado"] as const;

export function mapPublicOperativos(rows: PublicOperativoRow[] | null | undefined): PublicOperativo[] {
  if (!rows || rows.length === 0) return [];
  return rows.map((op) => ({
    id: op.id,
    titulo: op.titulo,
    slug: typeof op.slug === "string" ? op.slug.trim() || null : null,
    fecha_inicio: op.fecha_inicio,
    fecha_fin: op.fecha_fin,
    lugar: op.lugar,
    estado: op.estado ?? null,
  }));
}
