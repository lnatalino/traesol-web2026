// src/app/admin/quirurgico/operativos/[id]/pacientes/page.tsx
// Lista de pacientes de un operativo quirúrgico

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus, Mail, Link as LinkIcon, Eye } from "lucide-react";
import { getAdminSession } from "@/lib/adminSession";
import { getOperativoQuirurgico, listPacientes, getPortalTokenInfo } from "@/lib/quirurgico";
import type { PacienteListItem, PacientePortalTokenInfo } from "@/lib/quirurgico/types";

export const dynamic = "force-dynamic";

type PageParams = { params: Promise<{ id: string }> };
type SearchParams = { searchParams: Promise<{ q?: string }> };

const DATE_FORMAT = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago",
  day: "numeric",
  month: "short",
});

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return DATE_FORMAT.format(date);
}

function EstadoBadge({ estado }: { estado: string }) {
  const styles: Record<string, string> = {
    activo: "bg-blue-50 text-blue-700",
    operado: "bg-emerald-50 text-emerald-700",
    alta: "bg-slate-100 text-slate-600",
    cancelado: "bg-rose-50 text-rose-700",
  };
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[estado] || styles.activo}`}>
      {estado.charAt(0).toUpperCase() + estado.slice(1)}
    </span>
  );
}

export default async function PacientesOperativoPage({ params, searchParams }: PageParams & SearchParams) {
  const session = await getAdminSession();
  if (!session.allowed) {
    redirect("/login?next=/admin/quirurgico/operativos");
  }

  const { id } = await params;
  const { q } = await searchParams;
  
  const operativo = await getOperativoQuirurgico(id);
  if (!operativo) {
    notFound();
  }

  const pacientes = await listPacientes({
    operativoId: id,
    search: q,
    limit: 200,
  });

  return (
    <section className="space-y-6 rounded-[28px] border border-slate-100 bg-white/95 p-6 shadow-lg shadow-blue-900/5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link
            href={`/admin/quirurgico/operativos/${id}`}
            className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al operativo
          </Link>
          <h2 className="text-2xl font-semibold text-slate-900">
            Pacientes · {operativo.titulo}
          </h2>
          <p className="text-sm text-slate-500">
            {pacientes.length} paciente{pacientes.length !== 1 ? "s" : ""} registrado{pacientes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href={`/admin/quirurgico/operativos/${id}/pacientes/nuevo`}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700"
        >
          <UserPlus className="h-4 w-4" />
          Agregar paciente
        </Link>
      </div>

      {/* Búsqueda */}
      <form className="flex gap-3" method="get">
        <input
          type="text"
          name="q"
          defaultValue={q || ""}
          placeholder="Buscar por nombre, apellido o RUT..."
          className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        <button
          type="submit"
          className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          Buscar
        </button>
        {q && (
          <Link
            href={`/admin/quirurgico/operativos/${id}/pacientes`}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Limpiar
          </Link>
        )}
      </form>

      {/* Lista */}
      {pacientes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center">
          <p className="text-sm text-slate-500">
            {q ? "No se encontraron pacientes con ese criterio." : "Aún no hay pacientes en este operativo."}
          </p>
          <Link
            href={`/admin/quirurgico/operativos/${id}/pacientes/nuevo`}
            className="mt-4 inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Agregar el primero →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Paciente</th>
                <th className="px-4 py-3">RUT</th>
                <th className="px-4 py-3">Ciudad</th>
                <th className="px-4 py-3">Cirugía</th>
                <th className="px-4 py-3">Logística</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pacientes.map((p) => (
                <tr key={p.id} className="text-slate-700">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/quirurgico/operativos/${id}/pacientes/${p.id}`}
                      className="font-semibold text-slate-900 hover:text-blue-600"
                    >
                      {p.nombres} {p.apellidos}
                    </Link>
                    {p.email && (
                      <p className="text-xs text-slate-500">{p.email}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{p.rut || "—"}</td>
                  <td className="px-4 py-3">{p.ciudad_origen || "—"}</td>
                  <td className="px-4 py-3">{formatDate(p.fecha_cirugia)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {p.requiere_vuelo && (
                        <span className="rounded bg-sky-100 px-1.5 py-0.5 text-xs text-sky-700">✈️</span>
                      )}
                      {p.requiere_hospedaje && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">🏨</span>
                      )}
                      {!p.requiere_vuelo && !p.requiere_hospedaje && (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <EstadoBadge estado={p.estado} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/quirurgico/operativos/${id}/pacientes/${p.id}`}
                        className="rounded-full border border-slate-200 p-1.5 text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
                        title="Ver ficha"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
