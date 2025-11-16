import type { Database } from "@/lib/database.types";

export type InscripcionEstado = Database["public"]["Enums"]["inscripcion_estado"];
export type InscripcionTipo = Database["public"]["Enums"]["inscripcion_tipo"];
export type InscripcionRow = Database["public"]["Tables"]["inscripciones"]["Row"];
export type InscripcionInsert = Database["public"]["Tables"]["inscripciones"]["Insert"];
export type InscripcionUpdate = Database["public"]["Tables"]["inscripciones"]["Update"];

type InscripcionOrigenDb = NonNullable<InscripcionRow["origen"]>;

export const INSCRIPCION_ESTADO = {
  POSTULADO: "postulado",
  APROBADO: "aprobado",
  RECHAZADO: "rechazado",
  CONFIRMADO: "confirmado",
  ASISTIO: "asistio",
  NO_ASISTIO: "no_asistio",
  PENDIENTE: "pendiente",
} as const satisfies Record<string, InscripcionEstado>;

const INSCRIPCION_ESTADO_VALUES = Object.values(INSCRIPCION_ESTADO) as readonly InscripcionEstado[];

const HUMAN_LABELS: Record<InscripcionEstado, string> = {
  [INSCRIPCION_ESTADO.POSTULADO]: "Postulado",
  [INSCRIPCION_ESTADO.APROBADO]: "Aprobado",
  [INSCRIPCION_ESTADO.RECHAZADO]: "Rechazado",
  [INSCRIPCION_ESTADO.CONFIRMADO]: "Confirmado",
  [INSCRIPCION_ESTADO.ASISTIO]: "Asistió",
  [INSCRIPCION_ESTADO.NO_ASISTIO]: "No asistió",
  [INSCRIPCION_ESTADO.PENDIENTE]: "Pendiente",
};

const ESTADOS_SET = new Set<string>(INSCRIPCION_ESTADO_VALUES);
const PENDING_SET = new Set<InscripcionEstado>([
  INSCRIPCION_ESTADO.POSTULADO,
  INSCRIPCION_ESTADO.PENDIENTE,
]);
const CONFIRMED_SET = new Set<InscripcionEstado>([
  INSCRIPCION_ESTADO.APROBADO,
  INSCRIPCION_ESTADO.CONFIRMADO,
  INSCRIPCION_ESTADO.ASISTIO,
]);
const REJECTED_SET = new Set<InscripcionEstado>([
  INSCRIPCION_ESTADO.RECHAZADO,
  INSCRIPCION_ESTADO.NO_ASISTIO,
]);
const INSCRITO_SET = new Set<InscripcionEstado>(CONFIRMED_SET);
const FINALIZADO_SET = new Set<InscripcionEstado>(REJECTED_SET);

export const INSCRIPCION_ESTADOS: readonly InscripcionEstado[] = INSCRIPCION_ESTADO_VALUES;

export const PENDING_INSCRIPCION_ESTADOS: readonly InscripcionEstado[] = Array.from(PENDING_SET);
export const INSCRIPCION_TIPO_SCOPE = {
  GENERAL: "general",
  ESPECIFICA: "especifica",
} as const satisfies Record<string, InscripcionTipo>;

const INSCRIPCION_TIPO_MAP: Record<string, InscripcionTipo> = {
  [INSCRIPCION_TIPO_SCOPE.GENERAL]: INSCRIPCION_TIPO_SCOPE.GENERAL,
  [INSCRIPCION_TIPO_SCOPE.ESPECIFICA]: INSCRIPCION_TIPO_SCOPE.ESPECIFICA,
};

export const INSCRIPCION_ORIGEN = {
  POSTULACION: "postulacion",
  INVITACION: "invitacion",
} as const satisfies Record<string, InscripcionOrigenDb>;

const INSCRIPCION_ORIGEN_MAP: Record<string, InscripcionOrigenDb> = {
  [INSCRIPCION_ORIGEN.POSTULACION]: INSCRIPCION_ORIGEN.POSTULACION,
  [INSCRIPCION_ORIGEN.INVITACION]: INSCRIPCION_ORIGEN.INVITACION,
};

export type InscripcionOrigen = InscripcionOrigenDb | "otro";

export function isInscripcionEstado(value: string | null | undefined): value is InscripcionEstado {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return ESTADOS_SET.has(normalized);
}

export function normalizeInscripcionEstado(value: string | null | undefined): InscripcionEstado | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return isInscripcionEstado(normalized) ? (normalized as InscripcionEstado) : null;
}

export function isPendingEstado(estado: InscripcionEstado | null | undefined): boolean {
  return estado ? PENDING_SET.has(estado) : false;
}

export function isConfirmedEstado(estado: InscripcionEstado | null | undefined): boolean {
  return estado ? CONFIRMED_SET.has(estado) : false;
}

export function isRejectedEstado(estado: InscripcionEstado | null | undefined): boolean {
  return estado ? REJECTED_SET.has(estado) : false;
}

export function isPendingInscripcionEstado(value: string | null | undefined): boolean {
  const normalized = normalizeInscripcionEstado(value);
  return isPendingEstado(normalized);
}

export function isInscritoInscripcionEstado(value: string | null | undefined): boolean {
  const normalized = normalizeInscripcionEstado(value);
  return normalized ? INSCRITO_SET.has(normalized) : false;
}

export function isFinalizadaInscripcionEstado(value: string | null | undefined): boolean {
  const normalized = normalizeInscripcionEstado(value);
  return normalized ? FINALIZADO_SET.has(normalized) : false;
}

export function humanizeInscripcionEstado(value: string | null | undefined): string {
  const normalized = normalizeInscripcionEstado(value);
  if (!normalized) {
    return value ? value : "Sin estado";
  }
  return HUMAN_LABELS[normalized] ?? normalized;
}

export function normalizeInscripcionTipo(value: string | null | undefined): InscripcionTipo | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (INSCRIPCION_TIPO_MAP[normalized]) {
    return INSCRIPCION_TIPO_MAP[normalized];
  }
  if (normalized.includes("gral") || normalized.includes("general")) {
    return INSCRIPCION_TIPO_SCOPE.GENERAL;
  }
  if (
    normalized.includes("espec") ||
    normalized.includes("postul") ||
    normalized.includes("invit")
  ) {
    return INSCRIPCION_TIPO_SCOPE.ESPECIFICA;
  }
  return null;
}

export function normalizeInscripcionOrigen(value: string | null | undefined): InscripcionOrigenDb | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (INSCRIPCION_ORIGEN_MAP[normalized]) {
    return INSCRIPCION_ORIGEN_MAP[normalized];
  }
  if (normalized.includes("invit")) return INSCRIPCION_ORIGEN.INVITACION;
  if (normalized.includes("postul")) return INSCRIPCION_ORIGEN.POSTULACION;
  return null;
}

export function isPostulacionTipo(value: string | null | undefined): boolean {
  return normalizeInscripcionOrigen(value) === INSCRIPCION_ORIGEN.POSTULACION;
}

export function isInvitacionTipo(value: string | null | undefined): boolean {
  return normalizeInscripcionOrigen(value) === INSCRIPCION_ORIGEN.INVITACION;
}

export function inferInscripcionOrigen(
  tipoOrOrigen: string | null | undefined,
  explicitOrigen?: string | null | undefined,
): InscripcionOrigen {
  const normalizedOrigin = normalizeInscripcionOrigen(explicitOrigen ?? tipoOrOrigen);
  if (normalizedOrigin) {
    return normalizedOrigin;
  }
  const normalizedTipo = normalizeInscripcionTipo(tipoOrOrigen);
  if (!normalizedTipo) return "otro";
  if (normalizedTipo === INSCRIPCION_TIPO_SCOPE.GENERAL) return "otro";
  if (normalizedTipo === INSCRIPCION_TIPO_SCOPE.ESPECIFICA) return "postulacion";
  return "otro";
}

export function humanizeInscripcionOrigen(
  tipoOrOrigen: string | null | undefined,
  explicitOrigen?: string | null | undefined,
): string {
  const origin = inferInscripcionOrigen(tipoOrOrigen, explicitOrigen);
  if (origin === "invitacion") return "Invitación";
  if (origin === "postulacion") return "Postulación";
  return "Registro";
}
