import type { ReactNode } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Link as LinkIcon,
  MessageCircle,
  Pencil,
  ExternalLink,
} from "lucide-react";

type OperativoSummaryCardProps = {
  operativo: {
    id: string;
    titulo: string;
    slug: string;
    estado: string;
    fecha_inicio: string | null;
    fecha_fin: string | null;
    lugar: string | null;
    cupos_total: number | null;
    whatsapp_grupo_url: string | null;
  };
  stats: {
    pending: number;
    confirmed: number;
    rejected: number;
    total: number;
  };
};

function formatRangoFechas(inicio: string | null, fin: string | null): string {
  const formatter = new Intl.DateTimeFormat("es-CL", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const startDate = inicio ? new Date(inicio) : null;
  const endDate = fin ? new Date(fin) : null;

  if (!startDate || Number.isNaN(startDate.getTime())) {
    return endDate && !Number.isNaN(endDate.getTime())
      ? formatter.format(endDate)
      : "Fecha por confirmar";
  }

  if (
    !endDate ||
    Number.isNaN(endDate.getTime()) ||
    startDate.getTime() === endDate.getTime()
  ) {
    return formatter.format(startDate);
  }

  return `${formatter.format(startDate)} – ${formatter.format(endDate)}`;
}

function humanOperativoEstado(value: string): string {
  const normalized = value.toLowerCase();
  switch (normalized) {
    case "publicado":
      return "Publicado";
    case "borrador":
      return "Borrador";
    case "finalizado":
      return "Finalizado";
    case "cerrado":
      return "Cerrado";
    default:
      return value;
  }
}

function estadoBadgeClass(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized === "publicado")
    return "bg-emerald-100 text-emerald-700 ring-emerald-200";
  if (normalized === "borrador")
    return "bg-amber-100 text-amber-700 ring-amber-200";
  if (normalized === "finalizado")
    return "bg-slate-200 text-slate-700 ring-slate-300";
  if (normalized === "cerrado")
    return "bg-rose-100 text-rose-700 ring-rose-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function StatTile({
  icon,
  label,
  value,
  highlight = false,
  subtext,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  highlight?: boolean;
  subtext?: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
        highlight
          ? "border-amber-200 bg-amber-50"
          : "border-slate-100 bg-slate-50/50"
      }`}
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          highlight ? "bg-amber-100 text-amber-600" : "bg-white text-slate-500"
        }`}
      >
        {icon}
      </span>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p
          className={`text-xl font-bold ${
            highlight ? "text-amber-700" : "text-slate-900"
          }`}
        >
          {value}
        </p>
        {subtext ? (
          <p className="text-[11px] text-slate-400">{subtext}</p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Tarjeta de resumen del operativo.
 * Responde: ¿Qué? ¿Cuándo? ¿Dónde? ¿Cuántos? en menos de 10 segundos.
 */
export function OperativoSummaryCard({
  operativo,
  stats,
}: OperativoSummaryCardProps) {
  const op = operativo;
  const publicUrl = op.slug ? `/operativos/${op.slug}` : null;
  const cuposDisponibles =
    op.cupos_total !== null ? Math.max(0, op.cupos_total - stats.confirmed) : null;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50 shadow-sm">
      {/* Header con título y estado */}
      <header className="border-b border-slate-100 bg-white px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
              Resumen del operativo
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              {op.titulo}
            </h1>
            <p className="mt-0.5 font-mono text-xs text-slate-400">
              ID: {op.id.slice(0, 8)}… · Slug: /{op.slug}
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-inset ${estadoBadgeClass(
                op.estado
              )}`}
            >
              {humanOperativoEstado(op.estado)}
            </span>
            <div className="flex gap-2">
              {publicUrl ? (
                <Link
                  href={publicUrl}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Ver público
                </Link>
              ) : null}
              <Link
                href={`/admin/operativos/${op.id}/editar`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar operativo
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Info principal: Cuándo, Dónde, Links */}
      <div className="grid gap-px bg-slate-100 sm:grid-cols-3">
        <div className="flex items-center gap-3 bg-white px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Calendar className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              ¿Cuándo?
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {formatRangoFechas(op.fecha_inicio, op.fecha_fin)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
            <MapPin className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              ¿Dónde?
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {op.lugar || "Por confirmar"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            {op.whatsapp_grupo_url ? (
              <MessageCircle className="h-5 w-5" />
            ) : (
              <LinkIcon className="h-5 w-5" />
            )}
          </span>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Chat interno
            </p>
            {op.whatsapp_grupo_url ? (
              <a
                href={op.whatsapp_grupo_url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-blue-600 underline hover:text-blue-700"
              >
                Abrir WhatsApp
              </a>
            ) : (
              <p className="text-sm text-slate-500">Sin link</p>
            )}
          </div>
        </div>
      </div>

      {/* Stats: Cupos, Confirmados, Pendientes */}
      <div className="border-t border-slate-100 bg-slate-50/30 px-5 py-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Estado de cupos e inscripciones
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            icon={<Users className="h-5 w-5" />}
            label="Cupo máximo"
            value={op.cupos_total ?? "—"}
            subtext={
              cuposDisponibles !== null
                ? `${cuposDisponibles} disponibles`
                : undefined
            }
          />
          <StatTile
            icon={<Users className="h-5 w-5 text-emerald-500" />}
            label="Confirmados"
            value={stats.confirmed}
            subtext="Listos para participar"
          />
          <StatTile
            icon={<Clock className="h-5 w-5 text-amber-500" />}
            label="Pendientes"
            value={stats.pending}
            highlight={stats.pending > 0}
            subtext={stats.pending > 0 ? "Por revisar" : "Todo al día"}
          />
          <StatTile
            icon={<Users className="h-5 w-5 text-slate-400" />}
            label="Total inscritos"
            value={stats.total}
            subtext={`${stats.rejected} rechazados`}
          />
        </div>
      </div>
    </section>
  );
}
