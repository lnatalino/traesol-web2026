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

// Helper: Obtiene hora actual en Chile (America/Santiago)
export function getNowInChile(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Santiago" })
  );
}

// Helper: Formatea fecha a YYYY-MM-DD en timezone Chile
export function toChileDateString(date: Date = getNowInChile()): string {
  return date.toISOString().slice(0, 10);
}

// Helper: Obtiene el inicio del día en Chile (00:00:00)
export function getStartOfDayInChile(date: Date = getNowInChile()): Date {
  const dateStr = date.toLocaleDateString("en-CA", { timeZone: "America/Santiago" });
  return new Date(`${dateStr}T00:00:00`);
}

function toTime(value: string | null): number | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getTime();
}

/**
 * LEGACY: Usa getComputedEstado en su lugar.
 * Verifica si un operativo está "abierto" para inscripciones.
 */
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

/**
 * Determina si un operativo está disponible para enviar invitaciones.
 * 
 * Requisitos:
 * 1. Estado = publicado (no cerrado, finalizado, ni borrador)
 * 2. Fecha no ha pasado (fecha_fin > ahora, o si no hay fecha_fin, fecha_inicio > ahora)
 * 
 * A diferencia de isOperativoParaPublico, INCLUYE operativos futuros Y en curso.
 * A diferencia de isOperativoAbierto, INCLUYE operativos que aún no han comenzado.
 */
export function isOperativoParaInvitaciones(
  operativo: OperativoState | null | undefined,
  referenceDate: Date = getNowInChile()
): boolean {
  if (!operativo) return false;
  
  const computed = getComputedEstado(operativo, referenceDate);
  // Solo operativos publicados (no cerrados, finalizados ni borradores)
  if (computed !== "publicado") return false;
  
  // NO ha pasado la fecha (fecha_fin si existe, sino fecha_inicio)
  // getComputedEstado ya marca como "finalizado" si pasó la fecha
  // Así que si llegamos aquí, el operativo aún está vigente
  return true;
}

export function isOperativoFueraDeFecha(
  operativo: OperativoState | null | undefined,
  referenceDate: Date = new Date(),
): boolean {
  if (!operativo) return false;
  
  // Usar fecha_fin si existe, sino fecha_inicio como corte
  const fin = toTime(operativo.fecha_fin) ?? toTime(operativo.fecha_inicio);
  if (typeof fin !== "number") return false;
  
  // Si ya llegó la fecha de fin (o inicio si no hay fin), está fuera de fecha
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

/**
 * Calcula el estado computado de un operativo para mostrar en UI y lógica de negocio.
 * 
 * Estados posibles:
 * - "finalizado": fecha pasada (auto) O estado manual = finalizado/cerrado
 * - "cerrado": estado manual = cerrado (inscripciones cerradas pero fecha no ha llegado)
 * - "publicado": estado = publicado, fecha no ha llegado, no cerrado
 * - "borrador": cualquier otro caso (estado = borrador o vacío)
 * 
 * REGLA CLAVE: Una vez llega la fecha del operativo, se considera FINALIZADO automáticamente.
 */
export type ComputedOperativoEstado = "publicado" | "cerrado" | "finalizado" | "borrador";

export function getComputedEstado(
  operativo: OperativoState | null | undefined,
  referenceDate: Date = getNowInChile()
): ComputedOperativoEstado {
  if (!operativo) return "borrador";
  
  const estadoRaw = (operativo.estado || "").trim().toLowerCase();
  
  // Estado manual "finalizado" siempre prevalece
  if (estadoRaw === "finalizado") return "finalizado";
  
  // Auto-finalización: si fecha ya llegó/pasó (usa fecha_fin o fecha_inicio como corte)
  if (isOperativoFueraDeFecha(operativo, referenceDate)) return "finalizado";
  
  // Estado manual "cerrado" (inscripciones cerradas, pero fecha no ha llegado)
  if (estadoRaw === "cerrado") return "cerrado";
  
  // Publicado y vigente (fecha aún no llega)
  if (estadoRaw === "publicado") return "publicado";
  
  // Por defecto: borrador
  return "borrador";
}

/**
 * Verifica si un operativo es FUTURO (fecha_inicio >= hoy).
 * Un operativo futuro es uno que aún no ha comenzado.
 */
export function isOperativoFuturo(
  operativo: OperativoState | null | undefined,
  referenceDate: Date = getNowInChile()
): boolean {
  if (!operativo) return false;
  
  const inicio = toTime(operativo.fecha_inicio);
  if (typeof inicio !== "number") return false;
  
  // Comparar contra el inicio del día actual en Chile
  const todayStart = getStartOfDayInChile(referenceDate).getTime();
  
  // fecha_inicio debe ser >= hoy (permite operativos que empiezan hoy)
  return inicio >= todayStart;
}

/**
 * Determina si un operativo debe aparecer en listados públicos (Home, /operativos, etc).
 * 
 * Requisitos para aparecer en público:
 * 1. Estado computed == "publicado" (no borrador, cerrado ni finalizado)
 * 2. Fecha de inicio >= hoy (operativo futuro o que empieza hoy)
 * 
 * IMPORTANTE: Un operativo cerrado o finalizado NO aparece en público.
 */
export function isOperativoParaPublico(
  operativo: OperativoState | null | undefined,
  referenceDate: Date = getNowInChile()
): boolean {
  if (!operativo) return false;
  
  // Debe estar publicado (no finalizado, cerrado ni borrador)
  const computed = getComputedEstado(operativo, referenceDate);
  if (computed !== "publicado") return false;
  
  // Debe ser operativo futuro (fecha_inicio >= hoy)
  return isOperativoFuturo(operativo, referenceDate);
}

/**
 * LEGACY: Alias de isOperativoParaPublico para compatibilidad.
 * Determina si un operativo debe aparecer en la agenda pública.
 */
export function isOperativoParaAgenda(
  operativo: OperativoState | null | undefined,
  referenceDate: Date = getNowInChile()
): boolean {
  return isOperativoParaPublico(operativo, referenceDate);
}