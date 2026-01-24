// src/app/admin/quirurgico/operativos/[id]/page.tsx
// Detalle de un operativo quirúrgico con tabs

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, UserPlus, Settings, ExternalLink } from "lucide-react";
import { getAdminSession } from "@/lib/adminSession";
import { getOperativoQuirurgico, getOperativoStats, listPacientes, listPostulacionesEquipo } from "@/lib/quirurgico";
import { OperativoForm } from "../_components/OperativoForm";

export const dynamic = "force-dynamic";

type PageParams = { params: Promise<{ id: string }> };

const DATE_FORMAT = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return DATE_FORMAT.format(date);
}

export default async function OperativoDetailPage({ params }: PageParams) {
  const session = await getAdminSession();
  if (!session.allowed) {
    redirect("/login?next=/admin/quirurgico/operativos");
  }

  const { id } = await params;
  const operativo = await getOperativoQuirurgico(id);

  if (!operativo) {
    notFound();
  }

  const [stats, pacientes, postulaciones] = await Promise.all([
    getOperativoStats(id),
    listPacientes({ operativoId: id, limit: 5 }),
    listPostulacionesEquipo(id, { estado: "pendiente" }),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
  const publicUrl = operativo.publicado ? `${baseUrl}/quirurgico/${operativo.slug}` : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-[28px] border border-slate-100 bg-white/95 p-6 shadow-lg shadow-blue-900/5">
        <Link
          href="/admin/quirurgico/operativos"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a operativos
        </Link>
        
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-slate-900">{operativo.titulo}</h1>
              {operativo.publicado ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  Publicado
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                  Borrador
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {formatDate(operativo.fecha_inicio)}
              {operativo.fecha_fin && operativo.fecha_fin !== operativo.fecha_inicio && (
                <> — {formatDate(operativo.fecha_fin)}</>
              )}
              {operativo.ciudad && <> · {operativo.ciudad}</>}
            </p>
            {publicUrl && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                Ver página pública <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
          
          <div className="flex gap-2">
            <Link
              href={`/admin/quirurgico/operativos/${id}/pacientes`}
              className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
            >
              <Users className="h-4 w-4" />
              Ver pacientes
            </Link>
            <Link
              href={`/admin/quirurgico/operativos/${id}/pacientes/nuevo`}
              className="inline-flex items-center gap-2 rounded-full border border-blue-200 px-5 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              <UserPlus className="h-4 w-4" />
              Agregar paciente
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pacientes</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.pacientes_total}</p>
          <p className="mt-1 text-xs text-slate-500">
            {stats.pacientes_activos} activos · {stats.pacientes_operados} operados
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Postulaciones equipo</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.postulaciones_total}</p>
          <p className="mt-1 text-xs text-slate-500">
            {stats.postulaciones_pendientes} pendientes · {stats.postulaciones_aprobadas} aprobadas
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Estado</p>
          <p className="mt-2 text-lg font-semibold text-slate-900 capitalize">{operativo.estado}</p>
          <p className="mt-1 text-xs text-slate-500">
            {operativo.publicado ? "Visible en público" : "No visible"}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Ubicación</p>
          <p className="mt-2 text-lg font-semibold text-slate-900">
            {operativo.lugar || operativo.ciudad || "Por definir"}
          </p>
          {operativo.lugar && operativo.ciudad && (
            <p className="mt-1 text-xs text-slate-500">{operativo.ciudad}</p>
          )}
        </div>
      </div>

      {/* Últimos pacientes */}
      {pacientes.length > 0 && (
        <section className="rounded-[28px] border border-slate-100 bg-white/95 p-6 shadow-lg shadow-blue-900/5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Últimos pacientes</h3>
            <Link
              href={`/admin/quirurgico/operativos/${id}/pacientes`}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Ver todos →
            </Link>
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            {pacientes.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-slate-900">{p.nombres} {p.apellidos}</p>
                  <p className="text-xs text-slate-500">
                    {p.ciudad_origen || "—"} · Cirugía: {p.fecha_cirugia ? formatDate(p.fecha_cirugia) : "Por agendar"}
                  </p>
                </div>
                <Link
                  href={`/admin/quirurgico/operativos/${id}/pacientes/${p.id}`}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Ver ficha
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Postulaciones pendientes */}
      {postulaciones.length > 0 && (
        <section className="rounded-[28px] border border-amber-100 bg-amber-50/50 p-6">
          <h3 className="text-lg font-semibold text-slate-900">
            Postulaciones de equipo pendientes ({postulaciones.length})
          </h3>
          <div className="mt-4 space-y-2">
            {postulaciones.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
                <div>
                  <p className="font-medium text-slate-900">{p.nombres} {p.apellidos}</p>
                  <p className="text-xs text-slate-500">{p.profesion} {p.especialidad && `· ${p.especialidad}`}</p>
                </div>
                <Link
                  href={`/admin/quirurgico/operativos/${id}/equipo/${p.id}`}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  Revisar
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Formulario de edición */}
      <section className="rounded-[28px] border border-slate-100 bg-white/95 p-6 shadow-lg shadow-blue-900/5">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="h-5 w-5 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900">Configuración del operativo</h3>
        </div>
        <OperativoForm operativo={operativo} />
      </section>
    </div>
  );
}
