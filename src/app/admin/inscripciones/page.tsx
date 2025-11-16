import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminSession";
import {
  humanizeInscripcionEstado,
  humanizeInscripcionOrigen,
  inferInscripcionOrigen,
  PENDING_INSCRIPCION_ESTADOS,
  type InscripcionOrigen,
} from "@/lib/inscripciones";
import { supabaseService } from "@/lib/supabaseService";

export const dynamic = "force-dynamic";

const LIMIT = 300;

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type InscripcionRow = {
  id: string;
  voluntario_id: string | null;
  operativo_id: string | null;
  estado: string | null;
  tipo: string | null;
  origen: string | null;
  created_at: string | null;
};

type VoluntarioRow = {
  id: string;
  nombres: string | null;
  apellidos: string | null;
  email: string | null;
  profesion: string | null;
  profesion_otro: string | null;
  especialidad: string | null;
};

type OperativoRow = {
  id: string;
  titulo: string | null;
  slug: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  lugar: string | null;
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return DATE_TIME_FORMAT.format(parsed);
}

function displayNombre(vol: VoluntarioRow | undefined): string {
  if (!vol) return "—";
  const parts = [vol.nombres, vol.apellidos].filter(Boolean);
  return parts.length ? parts.join(" ") : "—";
}

function displayEmail(vol: VoluntarioRow | undefined): string {
  if (!vol?.email) return "—";
  return vol.email;
}

function displayProfesion(vol: VoluntarioRow | undefined): string {
  if (!vol) return "—";
  if (vol.profesion && vol.profesion !== "Otro") return vol.profesion;
  return vol.profesion_otro || vol.profesion || "—";
}

function displayEspecialidad(vol: VoluntarioRow | undefined): string {
  return vol?.especialidad || "—";
}

function originBadgeClass(origin: InscripcionOrigen): string {
  if (origin === "invitacion") return "bg-blue-50 text-blue-700 ring-blue-200";
  if (origin === "postulacion") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function describeInvitacionEstado(estado: string | null): string {
  const normalized = (estado ?? "").trim().toLowerCase();
  if (normalized === "pendiente") return "Pendiente de aceptación";
  if (normalized === "aprobado" || normalized === "confirmado") return "Aceptada por el voluntario";
  if (normalized === "rechazado") return "Rechazada";
  if (!normalized) return "Sin estado";
  return humanizeInscripcionEstado(normalized);
}

export default async function AdminInscripcionesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const session = await getAdminSession();
  if (!session.allowed) {
    redirect("/login?next=/admin/inscripciones");
  }

  const notice = typeof params?.success === "string" ? params.success : "";
  const errorParam = typeof params?.error === "string" ? params.error : "";

  let errorMessage = "";
  let inscripciones: InscripcionRow[] = [];
  let voluntarioMap = new Map<string, VoluntarioRow>();
  let operativoMap = new Map<string, OperativoRow>();

  try {
    const { data: inscData, error: inscError } = await supabaseService
      .from("inscripciones")
      .select("id,voluntario_id,operativo_id,estado,tipo,origen,created_at")
      .in("estado", PENDING_INSCRIPCION_ESTADOS as readonly string[])
      .order("created_at", { ascending: false })
      .limit(LIMIT);

    if (inscError) throw inscError;

    inscripciones = (inscData ?? []) as InscripcionRow[];

    const voluntarioIds = Array.from(
      new Set(inscripciones.map((row) => row.voluntario_id).filter((id): id is string => Boolean(id)))
    );
    const operativoIds = Array.from(
      new Set(inscripciones.map((row) => row.operativo_id).filter((id): id is string => Boolean(id)))
    );

    if (voluntarioIds.length) {
      const { data: voluntarios, error: volError } = await supabaseService
        .from("voluntarios")
        .select("id,nombres,apellidos,email,profesion,profesion_otro,especialidad")
        .in("id", voluntarioIds);

      if (volError) throw volError;

      const list = (voluntarios ?? []) as VoluntarioRow[];
      voluntarioMap = new Map(list.map((vol) => [vol.id, vol]));
    }

    if (operativoIds.length) {
      const { data: operativos, error: opError } = await supabaseService
        .from("operativos")
        .select("id,titulo,slug,fecha_inicio,fecha_fin,lugar")
        .in("id", operativoIds);

      if (opError) throw opError;

      const list = (operativos ?? []) as OperativoRow[];
      operativoMap = new Map(list.map((op) => [op.id, op]));
    }
  } catch (err: any) {
    errorMessage = err?.message ? String(err.message) : "No se pudieron cargar las inscripciones.";
  }

  const filteredRows = inscripciones.filter((row) => Boolean(row.operativo_id));
  const grouped = new Map<
    string,
    {
      operativo: OperativoRow | undefined;
      entries: Array<
        InscripcionRow & {
          voluntario?: VoluntarioRow;
          createdLabel: string;
          origin: InscripcionOrigen;
          originLabel: string;
          estadoLabel: string;
        }
      >;
    }
  >();

  for (const row of filteredRows) {
    const operativoId = row.operativo_id as string;
    const voluntario = row.voluntario_id ? voluntarioMap.get(row.voluntario_id) : undefined;
    const origin = inferInscripcionOrigen(row.tipo, row.origen);
    const bucket = grouped.get(operativoId) ?? {
      operativo: operativoMap.get(operativoId),
      entries: [],
    };
    bucket.entries.push({
      ...row,
      voluntario,
      createdLabel: formatDate(row.created_at),
      origin,
      originLabel: humanizeInscripcionOrigen(row.tipo, row.origen),
      estadoLabel: humanizeInscripcionEstado(row.estado),
    });
    grouped.set(operativoId, bucket);
  }

  const groupedList = Array.from(grouped.entries()).map(([operativoId, info]) => {
    const operativo = info.operativo;
    const originSummary = info.entries.reduce(
      (acc, entry) => {
        acc[entry.origin] = (acc[entry.origin] || 0) + 1;
        return acc;
      },
      { postulacion: 0, invitacion: 0, otro: 0 } as Record<InscripcionOrigen, number>
    );
    return {
      operativoId,
      operativo,
      entries: info.entries,
      originSummary,
      titulo: operativo?.titulo || "Operativo sin título",
      fechas: `${formatDate(operativo?.fecha_inicio ?? null)}${
        operativo?.fecha_fin ? ` · Fin: ${formatDate(operativo.fecha_fin)}` : ""
      }`,
      lugar: operativo?.lugar || "—",
      count: info.entries.length,
      fechaInicioValue: operativo?.fecha_inicio ? new Date(operativo.fecha_inicio).getTime() : 0,
    };
  });

  groupedList.sort((a, b) => a.fechaInicioValue - b.fechaInicioValue);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Inscripciones</h1>
          <p className="text-sm text-slate-500">
            Revisa el estado de las postulaciones a operativos y gestiona próximas acciones.
          </p>
        </div>
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

      {groupedList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No hay inscripciones pendientes en este momento.
        </div>
      ) : (
        <div className="space-y-6">
          {groupedList.map((group) => (
            <section key={group.operativoId} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{group.titulo}</h2>
                  <p className="text-sm text-slate-500">
                    {group.fechas} · {group.lugar}
                  </p>
                </div>
                <Link
                  href={`/admin/operativos/${group.operativoId}`}
                  className="text-sm font-medium text-blue-600 underline"
                >
                  Ver operativo
                </Link>
              </div>
              <div className="mt-4 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                {group.count} inscripciones pendientes
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                <span>
                  Postulaciones: <span className="font-semibold text-slate-700">{group.originSummary.postulacion}</span>
                </span>
                <span>
                  Invitaciones: <span className="font-semibold text-slate-700">{group.originSummary.invitacion}</span>
                </span>
              </div>

              {(() => {
                const postulaciones = group.entries.filter(
                  (entry) => entry.origen === "postulacion" || entry.origen === null,
                );
                const invitaciones = group.entries.filter((entry) => entry.origen === "invitacion");
                const redirectTo = "/admin/inscripciones";

                return (
                  <div className="mt-4 space-y-6">
                    <section>
                      <header className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                          Postulaciones ({postulaciones.length})
                        </h3>
                      </header>
                      {postulaciones.length === 0 ? (
                        <p className="mt-3 rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                          No hay postulaciones para este operativo.
                        </p>
                      ) : (
                        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-100">
                          <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              <tr>
                                <th className="px-4 py-3">Nombre</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Profesión</th>
                                <th className="px-4 py-3">Especialidad</th>
                                <th className="px-4 py-3">Origen</th>
                                <th className="px-4 py-3">Registrada</th>
                                <th className="px-4 py-3 text-right">Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {postulaciones.map((entry) => {
                                const nombre = displayNombre(entry.voluntario);
                                const email = displayEmail(entry.voluntario);
                                const profesion = displayProfesion(entry.voluntario);
                                const especialidad = displayEspecialidad(entry.voluntario);

                                return (
                                  <tr key={entry.id} className="border-t">
                                    <td className="px-4 py-3">
                                      <div className="font-medium text-slate-900">{nombre}</div>
                                      {entry.voluntario_id && (
                                        <div className="text-xs text-slate-500">
                                          <Link href={`/admin/voluntarios/${entry.voluntario_id}`} className="underline">
                                            Ver ficha
                                          </Link>
                                        </div>
                                      )}
                                    </td>
                                    <td className="px-4 py-3">
                                      {email !== "—" ? (
                                        <a href={`mailto:${email}`} className="text-blue-600 underline">
                                          {email}
                                        </a>
                                      ) : (
                                        "—"
                                      )}
                                    </td>
                                    <td className="px-4 py-3">{profesion}</td>
                                    <td className="px-4 py-3">{especialidad}</td>
                                    <td className="px-4 py-3">
                                      <span
                                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${originBadgeClass(
                                          entry.origin,
                                        )}`}
                                      >
                                        {entry.originLabel}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3">{entry.createdLabel}</td>
                                    <td className="px-4 py-3 text-right text-xs">
                                      <div className="flex flex-wrap justify-end gap-2">
                                        <form action="/api/admin/inscripciones/update" method="post">
                                          <input type="hidden" name="id" value={entry.id} />
                                          <input type="hidden" name="estado" value="aprobado" />
                                          <input type="hidden" name="redirectTo" value={redirectTo} />
                                          <button
                                            type="submit"
                                            className="inline-flex items-center rounded-md border border-green-600 px-3 py-1 font-medium text-green-700 transition hover:bg-green-50"
                                          >
                                            Aceptar
                                          </button>
                                        </form>
                                        <form action="/api/admin/inscripciones/update" method="post">
                                          <input type="hidden" name="id" value={entry.id} />
                                          <input type="hidden" name="estado" value="rechazado" />
                                          <input type="hidden" name="redirectTo" value={redirectTo} />
                                          <button
                                            type="submit"
                                            className="inline-flex items-center rounded-md border border-rose-500 px-3 py-1 font-medium text-rose-600 transition hover:bg-rose-50"
                                          >
                                            Rechazar
                                          </button>
                                        </form>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>

                    <section>
                      <header className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                          Invitaciones enviadas ({invitaciones.length})
                        </h3>
                      </header>
                      {invitaciones.length === 0 ? (
                        <p className="mt-3 rounded-md border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                          No hay invitaciones para este operativo.
                        </p>
                      ) : (
                        <div className="mt-3 overflow-x-auto rounded-xl border border-slate-100">
                          <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                              <tr>
                                <th className="px-4 py-3">Nombre</th>
                                <th className="px-4 py-3">Email</th>
                                <th className="px-4 py-3">Profesión</th>
                                <th className="px-4 py-3">Especialidad</th>
                                <th className="px-4 py-3">Estado</th>
                                <th className="px-4 py-3">Registrada</th>
                              </tr>
                            </thead>
                            <tbody>
                              {invitaciones.map((entry) => {
                                const nombre = displayNombre(entry.voluntario);
                                const email = displayEmail(entry.voluntario);
                                const profesion = displayProfesion(entry.voluntario);
                                const especialidad = displayEspecialidad(entry.voluntario);
                                const estadoDescripcion = describeInvitacionEstado(entry.estado);

                                return (
                                  <tr key={entry.id} className="border-t">
                                    <td className="px-4 py-3">
                                      <div className="font-medium text-slate-900">{nombre}</div>
                                      {entry.voluntario_id && (
                                        <div className="text-xs text-slate-500">
                                          <Link href={`/admin/voluntarios/${entry.voluntario_id}`} className="underline">
                                            Ver ficha
                                          </Link>
                                        </div>
                                      )}
                                    </td>
                                    <td className="px-4 py-3">
                                      {email !== "—" ? (
                                        <a href={`mailto:${email}`} className="text-blue-600 underline">
                                          {email}
                                        </a>
                                      ) : (
                                        "—"
                                      )}
                                    </td>
                                    <td className="px-4 py-3">{profesion}</td>
                                    <td className="px-4 py-3">{especialidad}</td>
                                    <td className="px-4 py-3 text-slate-600">{estadoDescripcion}</td>
                                    <td className="px-4 py-3">{entry.createdLabel}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>
                  </div>
                );
              })()}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
