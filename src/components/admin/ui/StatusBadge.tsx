import type { ReactNode } from "react";

export type StatusVariant =
  | "draft"      // borrador - amber
  | "published"  // publicado - emerald
  | "closed"     // cerrado - slate
  | "finished"   // finalizado - slate
  | "approved"   // aprobado - emerald
  | "rejected"   // rechazado - rose
  | "pending"    // pendiente - amber
  | "active"     // activo - emerald
  | "inactive"   // inactivo - slate
  | "sent"       // enviado - blue
  | "error"      // error - rose
  | "ok"         // ok/suficiente - emerald
  | "low"        // bajo - amber
  | "critical"   // crítico - rose
  | "info";      // info neutral - slate

const VARIANT_STYLES: Record<StatusVariant, string> = {
  draft: "bg-amber-100 text-amber-700 ring-amber-200",
  published: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  closed: "bg-slate-200 text-slate-700 ring-slate-300",
  finished: "bg-slate-200 text-slate-700 ring-slate-300",
  approved: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  rejected: "bg-rose-100 text-rose-700 ring-rose-200",
  pending: "bg-amber-100 text-amber-700 ring-amber-200",
  active: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  inactive: "bg-slate-200 text-slate-600 ring-slate-300",
  sent: "bg-blue-100 text-blue-700 ring-blue-200",
  error: "bg-rose-100 text-rose-700 ring-rose-200",
  ok: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  low: "bg-amber-100 text-amber-700 ring-amber-200",
  critical: "bg-rose-100 text-rose-700 ring-rose-200",
  info: "bg-slate-100 text-slate-600 ring-slate-200",
};

const LABEL_MAP: Partial<Record<StatusVariant, string>> = {
  draft: "Borrador",
  published: "Publicado",
  closed: "Cerrado",
  finished: "Finalizado",
  approved: "Aprobado",
  rejected: "Rechazado",
  pending: "Pendiente",
  active: "Activo",
  inactive: "Inactivo",
  sent: "Enviado",
  error: "Error",
  ok: "Suficiente",
  low: "Stock bajo",
  critical: "Crítico",
};

type StatusBadgeProps = {
  /** Variante de estado */
  variant: StatusVariant;
  /** Label personalizado (opcional, usa default si no se pasa) */
  label?: string;
  /** Tamaño del badge */
  size?: "sm" | "md";
  /** Icono opcional antes del texto */
  icon?: ReactNode;
};

/**
 * Badge de estado unificado para todo el admin.
 * Colores suaves y consistentes.
 */
export function StatusBadge({
  variant,
  label,
  size = "sm",
  icon,
}: StatusBadgeProps) {
  const displayLabel = label ?? LABEL_MAP[variant] ?? variant;
  const sizeClasses = size === "sm" 
    ? "px-2.5 py-1 text-xs" 
    : "px-3 py-1.5 text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ring-1 ring-inset ${VARIANT_STYLES[variant]} ${sizeClasses}`}
    >
      {icon}
      {displayLabel}
    </span>
  );
}

/**
 * Helper para convertir estados de BD a variantes del badge
 */
export function getStatusVariant(estado: string | null): StatusVariant {
  if (!estado) return "info";
  const normalized = estado.toLowerCase().trim();
  
  // Estados de operativos
  if (normalized === "publicado") return "published";
  if (normalized === "borrador") return "draft";
  if (normalized === "cerrado") return "closed";
  if (normalized === "finalizado") return "finished";
  
  // Estados de inscripciones
  if (normalized === "aprobado" || normalized === "confirmado") return "approved";
  if (normalized === "rechazado") return "rejected";
  if (normalized === "pendiente" || normalized === "postulado") return "pending";
  
  // Estados genéricos
  if (normalized === "activo") return "active";
  if (normalized === "inactivo" || normalized === "archivado") return "inactive";
  if (normalized === "enviado") return "sent";
  if (normalized === "error") return "error";
  
  return "info";
}
