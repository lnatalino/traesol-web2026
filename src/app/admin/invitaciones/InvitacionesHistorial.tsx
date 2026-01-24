"use client";

import Link from "next/link";
import { Clock, Mail, UserCheck, UserX, AlertCircle } from "lucide-react";

export type InvitacionHistorialRow = {
  id: string;
  estado: string | null;
  created_at: string | null;
  voluntario: {
    id: string;
    nombres: string | null;
    apellidos: string | null;
    email: string | null;
  } | null;
};

type Props = {
  invitaciones: InvitacionHistorialRow[];
};

const DATE_FORMAT = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return DATE_FORMAT.format(date);
}

function getEstadoConfig(estado: string | null): {
  label: string;
  icon: typeof Clock;
  className: string;
} {
  const normalized = (estado ?? "").toLowerCase().trim();
  
  if (normalized === "aprobado" || normalized === "confirmado" || normalized === "asistio") {
    return {
      label: "Aceptada",
      icon: UserCheck,
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  }
  if (normalized === "rechazado" || normalized === "no_asistio") {
    return {
      label: "Rechazada",
      icon: UserX,
      className: "bg-rose-50 text-rose-700 border-rose-200",
    };
  }
  if (normalized === "pendiente" || normalized === "postulado") {
    return {
      label: "Pendiente",
      icon: Clock,
      className: "bg-amber-50 text-amber-700 border-amber-200",
    };
  }
  return {
    label: estado || "Sin estado",
    icon: AlertCircle,
    className: "bg-slate-50 text-slate-600 border-slate-200",
  };
}

export function InvitacionesHistorial({ invitaciones }: Props) {
  if (invitaciones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">
        <Mail className="mb-3 h-10 w-10 text-slate-300" />
        <p className="text-sm text-slate-500">
          No hay invitaciones enviadas para este operativo.
        </p>
      </div>
    );
  }

  const formatVoluntarioNombre = (vol: InvitacionHistorialRow["voluntario"]): string => {
    if (!vol) return "Voluntario eliminado";
    const parts = [vol.nombres, vol.apellidos].filter(Boolean);
    if (parts.length) return parts.join(" ");
    if (vol.email) return vol.email;
    return "Sin nombre";
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50/80">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Voluntario
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Enviada
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Estado
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {invitaciones.map((inv) => {
            const config = getEstadoConfig(inv.estado);
            const Icon = config.icon;
            const voluntario = inv.voluntario;
            
            return (
              <tr key={inv.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{formatVoluntarioNombre(voluntario)}</div>
                  {voluntario?.id && (
                    <Link
                      href={`/admin/voluntarios/${voluntario.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Ver ficha
                    </Link>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {voluntario?.email ? (
                    <a href={`mailto:${voluntario.email}`} className="hover:text-blue-600 hover:underline">
                      {voluntario.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {formatDate(inv.created_at)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.className}`}>
                    <Icon className="h-3.5 w-3.5" />
                    {config.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
