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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Operativos</h1>
          <p className="text-sm text-slate-500">Gestiona la lista de operativos publicados y en borrador.</p>
        </div>
        <Link
          href="/admin/operativos/nuevo"
          className="inline-flex items-center rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
        >
          Nuevo operativo
        </Link>
      </div>

      {notice && (
        <div className="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
          {notice}
        </div>
      )}

      {(errorParam || errorMessage) && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorParam || errorMessage}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left">Título</th>
              <th className="px-4 py-3 text-left">Fechas</th>
              <th className="px-4 py-3 text-left">Lugar</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">Cupos</th>
              <th className="px-4 py-3 text-left">Inscripciones</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {operativos.map((op) => {
              const countInfo = counts.get(op.id);
              const estadoClass = estadoBadgeClass(op.estado);
              return (
                <tr key={op.id} className="border-t align-top">
                  <td className="px-4 py-4">
                    <div className="font-semibold text-slate-900">{op.titulo}</div>
                    <div className="text-xs uppercase tracking-wide text-slate-400">slug: {op.slug}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-900">{formatDate(op.fecha_inicio)}</div>
                    {op.fecha_fin ? (
                      <div className="text-xs text-slate-500">Fin: {formatDate(op.fecha_fin)}</div>
                    ) : (
                      <div className="text-xs text-slate-400">Fin: —</div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-slate-900">{op.lugar || "—"}</td>
                  <td className="px-4 py-3 align-top">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${estadoClass}`}
                    >
                      {humanEstado(op.estado)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-900">{op.cupos_total ?? "—"}</td>
                  <td className="px-4 py-3 align-top text-sm text-slate-600">
                    {formatStatusCounts(countInfo)}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Link
                        href={`/admin/operativos/${op.id}`}
                        className="inline-flex items-center rounded-md border border-slate-200 px-3 py-1 font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Ver detalle
                      </Link>
                      <Link
                        href={`/admin/operativos/${op.id}/editar`}
                        className="inline-flex items-center rounded-md border border-slate-200 px-3 py-1 font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Editar
                      </Link>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs">
                      <form action="/api/admin/operativos/publish" method="post" className="inline-flex flex-wrap items-center gap-2">
                        <input type="hidden" name="id" value={op.id} />
                        <input type="hidden" name="redirectTo" value="/admin/operativos" />
                        <select
                          name="estado"
                          defaultValue={op.estado}
                          className="rounded-md border border-slate-200 px-2 py-1"
                        >
                          <option value="borrador">Borrador</option>
                          <option value="publicado">Publicado</option>
                          <option value="cerrado">Cerrado</option>
                          <option value="finalizado">Finalizado</option>
                        </select>
                        <button
                          type="submit"
                          className="inline-flex items-center rounded-md border border-slate-200 px-3 py-1 font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          Guardar
                        </button>
                      </form>
                      <form action="/api/admin/operativos/delete" method="post" className="inline">
                        <input type="hidden" name="id" value={op.id} />
                        <input type="hidden" name="redirectTo" value="/admin/operativos?success=Operativo+eliminado" />
                        <button
                          type="submit"
                          className="inline-flex items-center rounded-md border border-red-300 px-3 py-1 font-medium text-red-600 transition hover:bg-red-50"
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
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
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
