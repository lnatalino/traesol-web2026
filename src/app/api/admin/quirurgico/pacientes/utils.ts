import { normalizeRut } from "@/lib/quirurgico";

export type PatientInput = {
  nombre_completo?: unknown;
  rut?: unknown;
  rut_ultimos4?: unknown;
  email?: unknown;
  telefono?: unknown;
  telefono_emergencia?: unknown;
  nombre_contacto_emergencia?: unknown;
  ciudad_origen?: unknown;
  operativo_quirurgico_id?: unknown;
  requiere_vuelo?: unknown;
  requiere_hospedaje?: unknown;
  diagnostico?: unknown;
  cirugia_planificada?: unknown;
  fecha_cirugia?: unknown;
  hora_cirugia?: unknown;
  fecha_llegada_ciudad?: unknown;
  fecha_regreso_ciudad?: unknown;
  portal_token?: unknown;
  portal_is_active?: unknown;
  comentarios_paciente?: unknown;
  alta_hospitalaria_estimada?: unknown;
  vuelo_ida_fecha?: unknown;
  vuelo_ida_numero?: unknown;
  vuelo_ida_hora_salida?: unknown;
  vuelo_ida_hora_llegada?: unknown;
  vuelo_regreso_fecha?: unknown;
  vuelo_regreso_hora_salida?: unknown;
  vuelo_regreso_hora_llegada?: unknown;
  hotel_nombre?: unknown;
  hotel_direccion?: unknown;
  hotel_checkin_inicial?: unknown;
  hotel_checkout_inicial?: unknown;
  hotel_checkin_post_cirugia?: unknown;
  hotel_checkout_final?: unknown;
  visita_enfermera_fecha?: unknown;
  primera_kine_fecha?: unknown;
  segunda_kine_fecha?: unknown;
  curacion_fecha?: unknown;
  dias_estimados_santiago?: unknown;
};

export type NormalizedPatientPayload = {
  nombre_completo: string;
  rut: string | null;
  rut_ultimos4: string | null;
  email: string | null;
  telefono: string | null;
  telefono_emergencia: string | null;
  nombre_contacto_emergencia: string | null;
  ciudad_origen: string | null;
  operativo_quirurgico_id: string | null;
  requiere_vuelo: boolean;
  requiere_hospedaje: boolean;
  diagnostico: string | null;
  cirugia_planificada: string | null;
  fecha_cirugia: string | null;
  hora_cirugia: string | null;
  fecha_llegada_ciudad: string | null;
  fecha_regreso_ciudad: string | null;
  portal_token: string | null;
  portal_is_active: boolean;
  comentarios_paciente: string | null;
  alta_hospitalaria_estimada: string | null;
  vuelo_ida_fecha: string | null;
  vuelo_ida_numero: string | null;
  vuelo_ida_hora_salida: string | null;
  vuelo_ida_hora_llegada: string | null;
  vuelo_regreso_fecha: string | null;
  vuelo_regreso_hora_salida: string | null;
  vuelo_regreso_hora_llegada: string | null;
  hotel_nombre: string | null;
  hotel_direccion: string | null;
  hotel_checkin_inicial: string | null;
  hotel_checkout_inicial: string | null;
  hotel_checkin_post_cirugia: string | null;
  hotel_checkout_final: string | null;
  visita_enfermera_fecha: string | null;
  primera_kine_fecha: string | null;
  segunda_kine_fecha: string | null;
  curacion_fecha: string | null;
  dias_estimados_santiago: number | null;
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toNullableString(value: unknown): string | null {
  const normalized = cleanString(value);
  return normalized || null;
}

function toNullableInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const normalized = cleanString(value);
  if (!normalized) return null;
  const parsed = Number.parseInt(normalized, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizePatientPayload(body: PatientInput) {
  const nombre = cleanString(body.nombre_completo);
  if (!nombre) {
    return { error: "El nombre completo es obligatorio." } as const;
  }

  const rut = toNullableString(body.rut);
  if (!rut) {
    return { error: "El RUT es obligatorio." } as const;
  }
  const normalizedRut = normalizeRut(rut);
  if (!normalizedRut) {
    return { error: "Ingresa un RUT chileno válido." } as const;
  }
  const rut4 = normalizedRut.ultimos4 || null;

  const operativoId = toNullableString(body.operativo_quirurgico_id);
  if (!operativoId) {
    return { error: "Selecciona un operativo quirúrgico." } as const;
  }

  const payload: NormalizedPatientPayload = {
    nombre_completo: nombre,
    rut: normalizedRut.canonico,
    rut_ultimos4: rut4,
    email: toNullableString(body.email),
    telefono: toNullableString(body.telefono),
    telefono_emergencia: toNullableString(body.telefono_emergencia),
    nombre_contacto_emergencia: toNullableString(body.nombre_contacto_emergencia),
    ciudad_origen: toNullableString(body.ciudad_origen),
    operativo_quirurgico_id: operativoId,
    requiere_vuelo: Boolean(body.requiere_vuelo),
    requiere_hospedaje: Boolean(body.requiere_hospedaje),
    diagnostico: toNullableString(body.diagnostico),
    cirugia_planificada: toNullableString(body.cirugia_planificada),
    fecha_cirugia: toNullableString(body.fecha_cirugia),
    hora_cirugia: toNullableString(body.hora_cirugia),
    fecha_llegada_ciudad: toNullableString(body.fecha_llegada_ciudad),
    fecha_regreso_ciudad: toNullableString(body.fecha_regreso_ciudad),
    portal_token: toNullableString(body.portal_token),
    portal_is_active: body.portal_is_active === undefined ? true : Boolean(body.portal_is_active),
    comentarios_paciente: toNullableString(body.comentarios_paciente),
    alta_hospitalaria_estimada: toNullableString(body.alta_hospitalaria_estimada),
    vuelo_ida_fecha: toNullableString(body.vuelo_ida_fecha),
    vuelo_ida_numero: toNullableString(body.vuelo_ida_numero),
    vuelo_ida_hora_salida: toNullableString(body.vuelo_ida_hora_salida),
    vuelo_ida_hora_llegada: toNullableString(body.vuelo_ida_hora_llegada),
    vuelo_regreso_fecha: toNullableString(body.vuelo_regreso_fecha),
    vuelo_regreso_hora_salida: toNullableString(body.vuelo_regreso_hora_salida),
    vuelo_regreso_hora_llegada: toNullableString(body.vuelo_regreso_hora_llegada),
    hotel_nombre: toNullableString(body.hotel_nombre),
    hotel_direccion: toNullableString(body.hotel_direccion),
    hotel_checkin_inicial: toNullableString(body.hotel_checkin_inicial),
    hotel_checkout_inicial: toNullableString(body.hotel_checkout_inicial),
    hotel_checkin_post_cirugia: toNullableString(body.hotel_checkin_post_cirugia),
    hotel_checkout_final: toNullableString(body.hotel_checkout_final),
    visita_enfermera_fecha: toNullableString(body.visita_enfermera_fecha),
    primera_kine_fecha: toNullableString(body.primera_kine_fecha),
    segunda_kine_fecha: toNullableString(body.segunda_kine_fecha),
    curacion_fecha: toNullableString(body.curacion_fecha),
    dias_estimados_santiago: toNullableInteger(body.dias_estimados_santiago),
  };

  return { data: payload } as const;
}
