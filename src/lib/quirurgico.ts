// src/lib/quirurgico.ts
// NOTA: Este archivo re-exporta desde quirurgico/index.ts para 
// compatibilidad con imports existentes. La lógica real está en la carpeta quirurgico/

// Re-exportar todo desde la carpeta quirurgico/ (sin los legacy que están aquí)
// IMPORTANTE: NO exportar portalSession aquí porque usa next/headers (server-only)
// y este módulo se importa desde componentes client.
export {
  // Types nuevos (nombres reales del módulo)
  type Paciente,
  type PacienteContacto,
  type PacienteRequerimiento,
  type PacienteArchivo,
  type PacientePortalToken,
  type PostulacionEquipoQuirurgico,
  type OperativoQuirurgico,
  type PacienteInsert,
  type PacienteUpdate,
  type PacienteContactoInsert,
  type PacienteContactoUpdate,
  type PacienteRequerimientoInsert,
  type PacienteRequerimientoUpdate,
  type PacienteArchivoInsert,
  type OperativoQuirurgicoInsert,
  type OperativoQuirurgicoUpdate,
  type OperativoQuirurgicoPublic,
  type PacienteWithOperativo,
  // Services - pacientes
  listPacientes,
  getPaciente,
  getPacienteDetail,
  createPaciente,
  updatePaciente,
  deletePaciente,
  listContactos,
  createContacto,
  updateContacto,
  deleteContacto,
  listRequerimientos,
  createRequerimiento,
  updateRequerimiento,
  deleteRequerimiento,
  listArchivos,
  createArchivoRecord,
  deleteArchivo,
  // Services - operativos
  listOperativosQuirurgicos,
  listOperativosQuirurgicosPublic,
  getOperativoQuirurgico,
  getOperativoQuirurgicoBySlug,
  getOperativoQuirurgicoPublicBySlug,
  createOperativoQuirurgico,
  updateOperativoQuirurgico,
  deleteOperativoQuirurgico,
  listPostulacionesEquipo,
  getPostulacionEquipo,
  createPostulacionEquipo,
  updatePostulacionEquipoEstado,
  getOperativoStats,
  // Portal tokens (estas NO usan next/headers, ok para client)
  generateSecureToken,
  hashToken,
  verifyTokenHash,
  createPortalToken,
  verifyPortalToken,
  recordTokenUsage,
  revokePortalToken,
  getPortalTokenInfo,
} from "./quirurgico/index";

// NOTA: Las funciones de portalSession (createPortalSession, verifyPortalSession, etc.)
// usan next/headers y solo deben importarse en Server Components o API Routes.
// Importar directamente desde: import { createPortalSession } from "@/lib/quirurgico/portalSession"

// =============================================================================
// LEGACY TYPES Y FUNCIONES - mantenidas por compatibilidad
// =============================================================================

import type { Database } from "./database.types";

export type QuirurgicoPaciente = Database["public"]["Tables"]["quirurgico_pacientes"]["Row"];
export type QuirurgicoComunicacion = Database["public"]["Tables"]["quirurgico_comunicaciones"]["Row"];

const SURGICAL_EMAIL_FIELD_LIST = [
  "id",
  "operativo_quirurgico_id",
  "nombre_completo",
  "email",
  "telefono",
  "diagnostico",
  "cirugia_planificada",
  "fecha_cirugia",
  "hora_cirugia",
  "ciudad_origen",
  "fecha_llegada_ciudad",
  "fecha_regreso_ciudad",
  "requiere_vuelo",
  "requiere_hospedaje",
  "vuelo_ida_fecha",
  "vuelo_ida_numero",
  "vuelo_ida_hora_salida",
  "vuelo_ida_hora_llegada",
  "vuelo_regreso_fecha",
  "vuelo_regreso_hora_salida",
  "vuelo_regreso_hora_llegada",
  "hotel_nombre",
  "hotel_direccion",
  "hotel_checkin_inicial",
  "hotel_checkout_inicial",
  "hotel_checkin_post_cirugia",
  "hotel_checkout_final",
  "alta_hospitalaria_estimada",
  "visita_enfermera_fecha",
  "primera_kine_fecha",
  "segunda_kine_fecha",
  "curacion_fecha",
  "dias_estimados_santiago",
] as const;

export const SURGICAL_EMAIL_SELECT = SURGICAL_EMAIL_FIELD_LIST.join(",");
export type SurgicalEmailPayload = Pick<
  QuirurgicoPaciente,
  (typeof SURGICAL_EMAIL_FIELD_LIST)[number]
>;

export type OperativoQuirurgicoSummary = Pick<
  Database["public"]["Tables"]["operativos_quirurgicos"]["Row"],
  "id" | "titulo" | "slug" | "ciudad" | "lugar"
>;

export type QuirurgicoPacienteWithOperativo = QuirurgicoPaciente & {
  operativo?: OperativoQuirurgicoSummary | null;
};

const SURGICAL_PORTAL_FIELD_LIST = [
  "id",
  "nombre_completo",
  "rut_ultimos4",
  "diagnostico",
  "cirugia_planificada",
  "fecha_cirugia",
  "hora_cirugia",
  "fecha_llegada_ciudad",
  "fecha_regreso_ciudad",
  "requiere_vuelo",
  "requiere_hospedaje",
  "ciudad_origen",
  "telefono_emergencia",
  "nombre_contacto_emergencia",
  "portal_is_active",
  "portal_last_access_at",
  "portal_token",
] as const;

export type SurgicalPortalPatient = Pick<
  QuirurgicoPaciente,
  | "id"
  | "nombre_completo"
  | "rut_ultimos4"
  | "diagnostico"
  | "cirugia_planificada"
  | "fecha_cirugia"
  | "hora_cirugia"
  | "fecha_llegada_ciudad"
  | "fecha_regreso_ciudad"
  | "requiere_vuelo"
  | "requiere_hospedaje"
  | "ciudad_origen"
  | "telefono_emergencia"
  | "nombre_contacto_emergencia"
  | "portal_is_active"
  | "portal_last_access_at"
  | "portal_token"
>;

export const SURGICAL_PORTAL_SELECT = SURGICAL_PORTAL_FIELD_LIST.join(",");

const PORTAL_BASE_PATH = "/quirurgico/portal";

function normalizeBaseUrl(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/$/, "");
}

export type NormalizedRut = {
  canonico: string;
  formateado: string;
  ultimos4: string;
};

function addThousandsSeparators(value: string) {
  return value.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function normalizeRut(raw?: string | null): NormalizedRut | null {
  if (!raw) return null;
  const compact = raw
    .trim()
    .toUpperCase()
    .replace(/[.\s]/g, "");
  if (!compact) return null;

  let body = "";
  let dv = "";

  if (compact.includes("-")) {
    const [bodyPart, dvPart] = compact.split("-", 2);
    body = bodyPart || "";
    dv = (dvPart || "").charAt(0);
  } else {
    if (compact.length < 2) {
      return null;
    }
    body = compact.slice(0, -1);
    dv = compact.slice(-1);
  }

  if (!body || !/^[0-9]+$/.test(body)) {
    return null;
  }

  if (!/^[0-9K]$/.test(dv)) {
    return null;
  }

  const canonico = `${body}-${dv}`;
  const formateado = `${addThousandsSeparators(body)}-${dv}`;
  const ultimos4 = canonico.slice(-4);

  return { canonico, formateado, ultimos4 };
}

export function extractRutLastDigits(value?: string | null): string | null {
  const normalized = normalizeRut(value);
  return normalized?.ultimos4 ?? null;
}

export const buildQuirurgicoPortalUrl = (token?: string | null, baseUrl?: string | null) => {
  if (!token) {
    return null;
  }

  const origin =
    normalizeBaseUrl(baseUrl) ||
    normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL) ||
    normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalizeBaseUrl(process.env.SITE_URL);

  if (!origin) {
    return null;
  }

  return `${origin}${PORTAL_BASE_PATH}/${token}`;
};
