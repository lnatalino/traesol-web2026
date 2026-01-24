// src/app/admin/quirurgico/operativos/page.tsx
// Lista de operativos quirúrgicos en admin

import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminSession } from "@/lib/adminSession";
import { listOperativosQuirurgicos, getOperativoStats } from "@/lib/quirurgico";
import type { OperativoQuirurgicoSummary } from "@/lib/quirurgico/types";

export const dynamic = "force-dynamic";

const DATE_FORMAT = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago",
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return DATE_FORMAT.format(date);
}

function EstadoBadge({ estado, publicado }: { estado: string; publicado: boolean }) {
  if (publicado && estado === "publicado") {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        Publicado
      </span>
    );
  }
  if (estado === "cerrado") {
    return (
      <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
        Cerrado
      </span>
    );
  }
  if (estado === "finalizado") {
    return (
      <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
        Finalizado
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
      Borrador
    </span>
  );
}

export default async function AdminOperativosQuirurgicosPage() {
  const session = await getAdminSession();
  if (!session.allowed) {
    redirect("/login?next=/admin/quirurgico/operativos");
  }

  const operativos = await listOperativosQuirurgicos({ limit: 100 });

  // Obtener stats para cada operativo
  const operativosConStats = await Promise.all(
    operativos.map(async (op) => {
      const stats = await getOperativoStats(op.id);
      return { ...op, stats };
    })
  );

  return (
    <section className="space-y-6 rounded-[28px] border border-slate-100 bg-white/95 p-6 shadow-lg shadow-blue-900/5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Operativos Quirúrgicos</h2>
          <p className="text-sm text-slate-500">
            Gestiona los operativos quirúrgicos y sus pacientes.
          </p>
        </div>
        <Link
          href="/admin/quirurgico/operativos/nuevo"
          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          + Nuevo operativo
        </Link>
      </div>

      {operativosConStats.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center">
          <p className="text-sm text-slate-500">
            No hay operativos quirúrgicos creados aún.
          </p>
          <Link
            href="/admin/quirurgico/operativos/nuevo"
            className="mt-4 inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Crear el primero →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="text-left text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Operativo</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Ubicación</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-center">Pacientes</th>
                <th className="px-4 py-3 text-center">Postulaciones</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {operativosConStats.map((op) => (
                <tr key={op.id} className="text-slate-700">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/quirurgico/operativos/${op.id}`}
                      className="font-semibold text-slate-900 hover:text-blue-600"
                    >
                      {op.titulo}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{formatDate(op.fecha_inicio)}</td>
                  <td className="px-4 py-3">
                    {[op.ciudad, op.lugar].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <EstadoBadge estado={op.estado} publicado={op.publicado} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-medium">{op.stats.pacientes_total}</span>
                    {op.stats.pacientes_operados > 0 && (
                      <span className="text-xs text-slate-500 ml-1">
                        ({op.stats.pacientes_operados} op.)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-medium">{op.stats.postulaciones_total}</span>
                    {op.stats.postulaciones_pendientes > 0 && (
                      <span className="text-xs text-amber-600 ml-1">
                        ({op.stats.postulaciones_pendientes} pend.)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/quirurgico/operativos/${op.id}`}
                        className="rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
                      >
                        Ver
                      </Link>
                      <Link
                        href={`/admin/quirurgico/operativos/${op.id}/pacientes`}
                        className="rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                      >
                        Pacientes
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
