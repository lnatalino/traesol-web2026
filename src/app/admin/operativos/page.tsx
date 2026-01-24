import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Stethoscope } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import {
  OperativoAdminCard,
  type CountInfo,
  type OperativoCardData,
} from "@/components/admin/operativos/OperativoAdminCard";
import { getAdminSession } from "@/lib/adminSession";
import { getErrorMessage } from "@/lib/errors";
import { supabaseService } from "@/lib/supabaseService";

export const dynamic = "force-dynamic";

type InscripcionRow = {
  id: string;
  operativo_id: string | null;
  estado: string | null;
};

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
  let operativos: OperativoCardData[] = [];
  let inscripciones: InscripcionRow[] = [];

  try {
    const [opsRes, inscRes] = await Promise.all([
      supabaseService
        .from("operativos")
        .select("id,titulo,slug,fecha_inicio,fecha_fin,lugar,estado,cupos_total")
        .order("fecha_inicio", { ascending: false })
        .returns<OperativoCardData[]>(),
      supabaseService
        .from("inscripciones")
        .select("id,operativo_id,estado")
        .returns<InscripcionRow[]>(),
    ]);

    if (opsRes.error) throw opsRes.error;
    if (inscRes.error) throw inscRes.error;

    operativos = opsRes.data ?? [];
    inscripciones = inscRes.data ?? [];
  } catch (error: unknown) {
    const debug = getErrorMessage(error);
    console.error("[Admin/Operativos] No se pudieron cargar los operativos", debug, error);
    errorMessage = "No se pudieron cargar los operativos.";
  }

  const counts = buildCounts(inscripciones);

  return (
    <div className="space-y-6">
      <AdminHeader
        eyebrow="Operativos"
        title="Gestión de operativos médicos"
        description="Administra operativos médicos en terreno: fechas, lugares, estados, inscripciones e invitaciones asociadas."
        action={(
          <Link
            href="/admin/operativos/nuevo"
            className="inline-flex items-center gap-2 justify-center rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:shadow-xl"
          >
            <Plus className="h-4 w-4" />
            Nuevo operativo
          </Link>
        )}
      />

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

      {/* Cards Grid */}
      {operativos.length > 0 ? (
        <div className="space-y-4">
          {operativos.map((op) => (
            <OperativoAdminCard
              key={op.id}
              operativo={op}
              countInfo={counts.get(op.id)}
            />
          ))}
        </div>
      ) : !errorMessage ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100">
            <Stethoscope className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700">
            Sin operativos
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Todavía no hay operativos cargados. Crea el primero usando el botón
            "Nuevo operativo".
          </p>
          <Link
            href="/admin/operativos/nuevo"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Crear operativo
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center shadow">
          <p className="text-rose-600">{errorMessage}</p>
        </div>
      )}
    </div>
  );
}
