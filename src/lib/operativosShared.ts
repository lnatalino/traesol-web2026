// src/lib/operativosShared.ts
export type PublicOperativo = {
  id: string;
  titulo: string | null;
  slug: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  lugar: string | null;
  estado: string | null;
};

export function formatOperativoOptionLabel(op: Pick<PublicOperativo, "titulo" | "fecha_inicio">): string {
  const titulo = op.titulo || "Operativo sin título";
  if (!op.fecha_inicio) return titulo;
  const parsed = new Date(op.fecha_inicio);
  if (Number.isNaN(parsed.getTime())) return titulo;
  const fecha = parsed.toLocaleDateString("es-CL", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return `${titulo} · ${fecha}`;
}
