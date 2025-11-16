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

export type OperativoState = Pick<PublicOperativo, "estado" | "fecha_inicio" | "fecha_fin">;

function toTime(value: string | null): number | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getTime();
}

export function isOperativoAbierto(
  operativo: OperativoState | null | undefined,
  referenceDate: Date = new Date(),
): boolean {
  if (!operativo) return false;
  const estado = (operativo.estado || "").trim().toLowerCase();
  if (estado !== "publicado") return false;
  const now = referenceDate.getTime();
  const inicio = toTime(operativo.fecha_inicio);
  const fin = toTime(operativo.fecha_fin);
  if (typeof inicio === "number" && now < inicio) return false;
  if (typeof fin === "number" && now > fin) return false;
  return true;
}

export function isOperativoFueraDeFecha(
  operativo: OperativoState | null | undefined,
  referenceDate: Date = new Date(),
): boolean {
  if (!operativo) return false;
  const fin = toTime(operativo.fecha_fin);
  if (typeof fin !== "number") return false;
  return referenceDate.getTime() > fin;
}

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
