"use client";

import Link from "next/link";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Eye,
  Pencil,
  Trash2,
  Save,
} from "lucide-react";
import { getComputedEstado, type ComputedOperativoEstado } from "@/lib/operativosShared";

export type CountInfo = {
  total: number;
  byStatus: Record<string, number>;
};

export type OperativoCardData = {
  id: string;
  titulo: string;
  slug: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  lugar: string | null;
  estado: string;
  cupos_total: number | null;
};

type OperativoAdminCardProps = {
  operativo: OperativoCardData;
  countInfo?: CountInfo;
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-CL", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function humanEstado(value: ComputedOperativoEstado): string {
  switch (value) {
    case "publicado":
      return "Publicado";
    case "borrador":
      return "Borrador";
    case "cerrado":
      return "Cerrado";
    case "finalizado":
      return "Finalizado";
    default:
      return value;
  }
}

function estadoBadgeClass(value: ComputedOperativoEstado): string {
  if (value === "publicado")
    return "bg-emerald-100 text-emerald-700 ring-emerald-300";
  if (value === "borrador")
    return "bg-amber-100 text-amber-700 ring-amber-300";
  if (value === "cerrado")
    return "bg-slate-200 text-slate-600 ring-slate-300";
  if (value === "finalizado")
    return "bg-slate-300 text-slate-700 ring-slate-400";
  return "bg-gray-200 text-gray-700 ring-gray-300";
}

export function OperativoAdminCard({ operativo, countInfo }: OperativoAdminCardProps) {
  const op = operativo;
  const total = countInfo?.total ?? 0;
  const pendientes =
    countInfo?.byStatus.pendiente ?? countInfo?.byStatus.postulado ?? 0;
  const confirmados = countInfo?.byStatus.confirmado ?? 0;
  const rechazados = countInfo?.byStatus.rechazado ?? 0;

  // Calcular estado computado (incluye auto-finalización por fecha)
  const computedEstado = getComputedEstado({
    estado: op.estado,
    fecha_inicio: op.fecha_inicio,
    fecha_fin: op.fecha_fin,
  });

  // Generate placeholder image based on computed estado
  const placeholderColor = computedEstado === "publicado" ? "0ea5e9" : computedEstado === "borrador" ? "f59e0b" : "64748b";

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-200 hover:shadow-lg hover:shadow-blue-900/5 hover:border-slate-300/80 md:flex-row">
      {/* Image / Visual Section */}
      <div className="relative h-40 w-full shrink-0 overflow-hidden bg-gradient-to-br from-slate-100 to-slate-50 md:h-auto md:w-48">
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-2xl text-white text-2xl font-bold shadow-inner"
            style={{ backgroundColor: `#${placeholderColor}` }}
          >
            {op.titulo.charAt(0).toUpperCase()}
          </div>
        </div>
        {/* Estado badge overlaid on image */}
        <span
          className={`absolute left-3 top-3 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset ${estadoBadgeClass(
            computedEstado
          )}`}
        >
          {humanEstado(computedEstado)}
        </span>
      </div>

      {/* Content Section */}
      <div className="flex flex-1 flex-col p-5">
        {/* Header: Title + Slug */}
        <header className="mb-3">
          <h3 className="text-lg font-semibold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
            {op.titulo}
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-slate-400 tracking-wide">
            /{op.slug}
          </p>
        </header>

        {/* Metadata Row */}
        <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span>{formatDate(op.fecha_inicio)}</span>
            {op.fecha_fin && (
              <span className="text-slate-400">→ {formatDate(op.fecha_fin)}</span>
            )}
          </span>
          {op.lugar && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-rose-500" />
              <span>{op.lugar}</span>
            </span>
          )}
        </div>

        {/* Stats Grid - Admin Info */}
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatTile
            icon={<Users className="h-4 w-4 text-blue-500" />}
            label="Cupos"
            value={op.cupos_total ?? "—"}
          />
          <StatTile
            icon={<Users className="h-4 w-4 text-emerald-500" />}
            label="Inscritos"
            value={total}
          />
          <StatTile
            icon={<Clock className="h-4 w-4 text-amber-500" />}
            label="Pendientes"
            value={pendientes}
            highlight={pendientes > 0}
          />
          <StatTile
            icon={<Users className="h-4 w-4 text-slate-400" />}
            label="Confirmados"
            value={confirmados}
          />
        </div>

        {/* Actions Footer */}
        <footer className="mt-auto flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
          {/* Primary Actions */}
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/operativos/${op.id}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Ver detalle</span>
            </Link>
            <Link
              href={`/admin/operativos/${op.id}/editar`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Editar</span>
            </Link>
          </div>

          {/* Estado Change Form */}
          <form
            action="/api/admin/operativos/publish"
            method="post"
            className="ml-auto flex items-center gap-2"
          >
            <input type="hidden" name="id" value={op.id} />
            <input type="hidden" name="redirectTo" value="/admin/operativos" />
            <select
              name="estado"
              defaultValue={op.estado}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="borrador">Borrador</option>
              <option value="publicado">Publicado</option>
              <option value="cerrado">Cerrado</option>
              <option value="finalizado">Finalizado</option>
            </select>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Guardar</span>
            </button>
          </form>

          {/* Danger Action */}
          <form action="/api/admin/operativos/delete" method="post">
            <input type="hidden" name="id" value={op.id} />
            <input
              type="hidden"
              name="redirectTo"
              value="/admin/operativos?success=Operativo+eliminado"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 shadow-sm transition hover:bg-rose-100 hover:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
              onClick={(e) => {
                if (!confirm("¿Seguro que deseas eliminar este operativo?")) {
                  e.preventDefault();
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Eliminar</span>
            </button>
          </form>
        </footer>
      </div>
    </article>
  );
}

function StatTile({
  icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
        highlight
          ? "border-amber-200 bg-amber-50"
          : "border-slate-100 bg-slate-50/50"
      }`}
    >
      {icon}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p
          className={`text-sm font-bold ${
            highlight ? "text-amber-700" : "text-slate-700"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
