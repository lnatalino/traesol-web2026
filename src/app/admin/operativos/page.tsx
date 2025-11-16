import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";

export const dynamic = "force-dynamic";

type OperativoRow = {
  id: string;
  titulo: string;
  slug: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  lugar: string | null;
  estado: string;
  cupos_total: number | null;
  created_at?: string | null;
};

type InscripcionRow = {
  id: string;
  operativo_id: string | null;
  estado: string | null;
};

type CountInfo = {
  total: number;
  byStatus: Record<string, number>;
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

function humanEstado(value: string): string {
  const normalized = value.toLowerCase();
  switch (normalized) {
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

function estadoBadgeClass(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized === "publicado") return "bg-green-100 text-green-700 ring-green-200";
  if (normalized === "borrador") return "bg-amber-100 text-amber-700 ring-amber-200";
  if (normalized === "cerrado") return "bg-slate-200 text-slate-700 ring-slate-300";
  if (normalized === "finalizado") return "bg-slate-300 text-slate-700 ring-slate-400";
  return "bg-gray-200 text-gray-700 ring-gray-300";
}

function buildCounts(rows: InscripcionRow[]): Map<string, CountInfo> {
  const map = new Map<string, CountInfo>();
  for (const row of rows) {
    if (!row.operativo_id) continue;
    const key = row.operativo_id;
    const estado = (row.estado || "pendiente").toLowerCase();
    const info = map.get(key) ?? { total: 0, byStatus: {} };
    info.total += 1;
    info.byStatus[estado] = (info.byStatus[estado] ?? 0) + 1;
    map.set(key, info);
  }
  return map;
}

function formatStatusCounts(info: CountInfo | undefined): string {
  if (!info) return "0 inscripciones";
  const total = info.total;
  const pending = info.byStatus.pendiente ?? info.byStatus.postulado ?? 0;
  if (total === 0) return "0 inscripciones";
  if (pending > 0) {
    return `${total} inscripciones (pendientes: ${pending})`;
  }
  return `${total} inscripciones`;
}

export default async function AdminOperativosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const session = await getAdminSession();
  if (!session.allowed) {
    redirect("/login?next=/admin/operativos");
  }

  const notice = typeof params?.success === "string" ? params.success : "";
  const errorParam = typeof params?.error === "string" ? params.error : "";

  let errorMessage = "";
  let operativos: OperativoRow[] = [];
  let inscripciones: InscripcionRow[] = [];

  try {
    const [opsRes, inscRes] = await Promise.all([
      supabaseService
        .from("operativos")
        .select("id,titulo,slug,fecha_inicio,fecha_fin,lugar,estado,cupos_total,created_at")
        .order("fecha_inicio", { ascending: false }),
      supabaseService
        .from("inscripciones")
        .select("id,operativo_id,estado"),
    ]);

    if (opsRes.error) throw opsRes.error;
    if (inscRes.error) throw inscRes.error;

    operativos = (opsRes.data ?? []) as OperativoRow[];
    inscripciones = (inscRes.data ?? []) as InscripcionRow[];
  } catch (err: any) {
    errorMessage = err?.message ? String(err.message) : "No se pudieron cargar los operativos.";
  }

  const counts = buildCounts(inscripciones);

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-slate-100 bg-white/95 p-6 shadow-lg shadow-blue-900/5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">Operativos</p>
            <h1 className="text-3xl font-semibold text-slate-900">Gestión de operativos</h1>
            <p className="text-sm text-slate-500 max-w-2xl">
              Revisa el estado de publicación, cupos y postulaciones en curso. Todos los cambios se reflejan de inmediato en el sitio público.
            </p>
          </div>
          <Link
            href="/admin/operativos/nuevo"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:shadow-xl"
          >
            Nuevo operativo
          </Link>
        </div>
      </section>

      {notice ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 px-5 py-4 text-sm font-medium text-emerald-700 shadow">
          {notice}
        </div>
      ) : null}

      {errorParam || errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 shadow">
          {errorParam || errorMessage}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-[30px] border border-slate-100 bg-white/95 shadow-xl shadow-blue-900/5">
        <table className="min-w-full divide-y divide-slate-100 text-sm">
          <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-4 text-left">Título</th>
              <th className="px-5 py-4 text-left">Fechas</th>
              <th className="px-5 py-4 text-left">Lugar</th>
              <th className="px-5 py-4 text-left">Estado</th>
              <th className="px-5 py-4 text-left">Cupos</th>
              <th className="px-5 py-4 text-left">Inscripciones</th>
              <th className="px-5 py-4 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {operativos.map((op) => {
              const countInfo = counts.get(op.id);
              const estadoClass = estadoBadgeClass(op.estado);
              return (
                <tr key={op.id} className="align-top transition hover:bg-slate-50/50">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-slate-900">{op.titulo}</div>
                    <div className="text-[11px] uppercase tracking-wide text-slate-400">slug: {op.slug}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-slate-900">{formatDate(op.fecha_inicio)}</div>
                    {op.fecha_fin ? (
                      <div className="text-xs text-slate-500">Fin: {formatDate(op.fecha_fin)}</div>
                    ) : (
                      <div className="text-xs text-slate-400">Fin: —</div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-900">{op.lugar || "—"}</td>
                  <td className="px-5 py-4 align-top">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${estadoClass}`}
                    >
                      {humanEstado(op.estado)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-900">{op.cupos_total ?? "—"}</td>
                  <td className="px-5 py-4 text-sm text-slate-600">
                    {formatStatusCounts(countInfo)}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Link
                        href={`/admin/operativos/${op.id}`}
                        className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Ver detalle
                      </Link>
                      <Link
                        href={`/admin/operativos/${op.id}/editar`}
                        className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Editar
                      </Link>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs">
                      <form action="/api/admin/operativos/publish" method="post" className="inline-flex flex-wrap items-center gap-2">
                        <input type="hidden" name="id" value={op.id} />
                        <input type="hidden" name="redirectTo" value="/admin/operativos" />
                        <select
                          name="estado"
                          defaultValue={op.estado}
                          className="rounded-xl border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
                        >
                          <option value="borrador">Borrador</option>
                          <option value="publicado">Publicado</option>
                          <option value="cerrado">Cerrado</option>
                          <option value="finalizado">Finalizado</option>
                        </select>
                        <button
                          type="submit"
                          className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          Guardar
                        </button>
                      </form>
                      <form action="/api/admin/operativos/delete" method="post" className="inline">
                        <input type="hidden" name="id" value={op.id} />
                        <input type="hidden" name="redirectTo" value="/admin/operativos?success=Operativo+eliminado" />
                        <button
                          type="submit"
                          className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 font-semibold text-rose-600 transition hover:bg-rose-100"
                        >
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
            {operativos.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                  No hay operativos cargados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
