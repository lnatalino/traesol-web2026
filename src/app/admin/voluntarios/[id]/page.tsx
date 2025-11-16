import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminSession";
import { humanizeInscripcionEstado, humanizeInscripcionOrigen, inferInscripcionOrigen } from "@/lib/inscripciones";
import { supabaseService } from "@/lib/supabaseService";
import type { VoluntarioAdminRow } from "@/lib/voluntariosAdmin";
import { VOLUNTARIO_COLUMNS } from "@/lib/voluntariosAdmin";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

type InscripcionRow = {
  id: string;
  tipo: string | null;
  origen: string | null;
  estado: string | null;
  created_at: string | null;
  operativo_id: string | null;
  operativos?: OperativoInfo | OperativoInfo[] | null;
};

type OperativoInfo = {
  id: string;
  titulo: string | null;
  slug: string | null;
  fecha_inicio: string | null;
};

type OperativoOption = {
  id: string;
  titulo: string | null;
  fecha_inicio: string | null;
  estado: string | null;
};

function displayBoolean(value: boolean | null): string {
  if (value === null || typeof value === "undefined") return "—";
  return value ? "Sí" : "No";
}

function displayNombre(row: VoluntarioAdminRow): string {
  const partes = [row.nombres, row.apellidos].filter(Boolean);
  return partes.length ? partes.join(" ") : "Voluntario sin nombre";
}

function displayProfesion(row: VoluntarioAdminRow): string {
  const base = row.profesion ? row.profesion.trim() : "";
  if (base === "Otro" && row.profesion_otro) return row.profesion_otro;
  if (base) return base;
  if (row.profesion_otro) return row.profesion_otro;
  return "—";
}

function originBadgeClass(origin: "postulacion" | "invitacion" | "otro"): string {
  if (origin === "invitacion") return "bg-blue-50 text-blue-700 ring-blue-200";
  if (origin === "postulacion") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const DATE_FORMAT = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago",
  year: "numeric",
  month: "short",
  day: "numeric",
});

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return DATE_TIME_FORMAT.format(date);
}

function formatDateOnly(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return DATE_FORMAT.format(date);
}

export default async function VoluntarioDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const session = await getAdminSession();
  const { id } = await params;
  const sp = await searchParams;

  if (!session.allowed) {
    redirect(`/login?next=/admin/voluntarios/${id}`);
  }

  if (!id) {
    notFound();
  }

  const [
    { data: voluntarioData, error: voluntarioError },
    { data: inscData, error: inscError },
    { data: operativosData, error: operativosError },
  ] = await Promise.all([
    supabaseService
      .from("voluntarios")
      .select(VOLUNTARIO_COLUMNS)
      .eq("id", id)
      .maybeSingle<VoluntarioAdminRow>(),
    supabaseService
      .from("inscripciones")
      .select(
        "id,tipo,origen,estado,created_at,operativo_id,operativos(id,titulo,slug,fecha_inicio)"
      )
      .eq("voluntario_id", id)
      .order("created_at", { ascending: false }),
    supabaseService
      .from("operativos")
      .select("id,titulo,fecha_inicio,estado")
      .in("estado", ["publicado", "cerrado", "finalizado"])
      .order("fecha_inicio", { ascending: true }),
  ]);

  if (voluntarioError) {
    const url = `/admin/voluntarios?error=${encodeURIComponent(String(voluntarioError.message))}`;
    redirect(url);
  }

  const voluntario = (voluntarioData ?? null) as VoluntarioAdminRow | null;
  if (!voluntario) {
    notFound();
  }

  const inscripciones = ((inscData ?? []) as unknown) as InscripcionRow[];
  const inscripcionesError = inscError ? String(inscError.message) : "";
  const operativos = (operativosData ?? []) as OperativoOption[];
  const operativosErrorMessage = operativosError ? String(operativosError.message) : "";
  const success = typeof sp?.success === "string" ? sp.success : "";
  const notice = typeof sp?.notice === "string" ? sp.notice : "";
  const errorMessage = typeof sp?.error === "string" ? sp.error : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{displayNombre(voluntario)}</h1>
          <p className="text-sm text-slate-500">Ficha completa del voluntario.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <Link href="/admin/voluntarios" className="rounded-md border px-3 py-1.5 hover:bg-slate-50">
            Volver al listado
          </Link>
          <Link
            href={`/admin/voluntarios/${voluntario.id}/editar`}
            className="rounded-md border border-blue-600 px-3 py-1.5 font-medium text-blue-600 hover:bg-blue-50"
          >
            Editar voluntario
          </Link>
          <a
            href={`/api/admin/voluntarios/export?id=${voluntario.id}`}
            className="rounded-md border border-emerald-600 px-3 py-1.5 font-medium text-emerald-600 hover:bg-emerald-50"
          >
            Exportar CSV (este voluntario)
          </a>
        </div>
      </div>

      {success ? (
        <div className="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      {notice ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {notice}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold">Datos personales</h2>
          <dl className="grid grid-cols-1 gap-2 text-sm">
            <div>
              <dt className="text-xs uppercase text-slate-400">Nombres</dt>
              <dd className="text-slate-700">{voluntario.nombres || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Apellidos</dt>
              <dd className="text-slate-700">{voluntario.apellidos || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Nacionalidad</dt>
              <dd className="text-slate-700">{voluntario.nacionalidad || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Género</dt>
              <dd className="text-slate-700">{voluntario.genero || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Fecha de nacimiento</dt>
              <dd className="text-slate-700">{formatDateOnly(voluntario.fecha_nacimiento)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Registrado el</dt>
              <dd className="text-slate-700">{formatDateTime(voluntario.created_at)}</dd>
            </div>
          </dl>
        </div>
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold">Contacto</h2>
          <dl className="grid grid-cols-1 gap-2 text-sm">
            <div>
              <dt className="text-xs uppercase text-slate-400">Email</dt>
              <dd className="text-slate-700">{voluntario.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Teléfono</dt>
              <dd className="text-slate-700">{voluntario.telefono || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Dirección</dt>
              <dd className="text-slate-700">{voluntario.direccion || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Ciudad</dt>
              <dd className="text-slate-700">{voluntario.ciudad || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Región</dt>
              <dd className="text-slate-700">{voluntario.region || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">País</dt>
              <dd className="text-slate-700">{voluntario.pais || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Instagram</dt>
              <dd className="text-slate-700">{voluntario.instagram || "—"}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold">Identificación</h2>
          <dl className="grid grid-cols-1 gap-2 text-sm">
            <div>
              <dt className="text-xs uppercase text-slate-400">RUT</dt>
              <dd className="text-slate-700">{voluntario.rut || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">ID nacional</dt>
              <dd className="text-slate-700">{voluntario.id_nacional || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Pasaporte</dt>
              <dd className="text-slate-700">{voluntario.pasaporte || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Nombre credencial</dt>
              <dd className="text-slate-700">{voluntario.nombre_credencial || "—"}</dd>
            </div>
          </dl>
        </div>
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold">Profesión y tallas</h2>
          <dl className="grid grid-cols-1 gap-2 text-sm">
            <div>
              <dt className="text-xs uppercase text-slate-400">Profesión</dt>
              <dd className="text-slate-700">{displayProfesion(voluntario)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Especialidad</dt>
              <dd className="text-slate-700">{voluntario.especialidad || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Talla polera</dt>
              <dd className="text-slate-700">{voluntario.talla_polera || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Talla pantalón</dt>
              <dd className="text-slate-700">{voluntario.talla_pantalon || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Tipo de usuario</dt>
              <dd className="text-slate-700">{voluntario.tipo_usuario || "—"}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-base font-semibold">Alimentación</h2>
        <dl className="grid grid-cols-1 gap-2 text-sm">
          <div>
            <dt className="text-xs uppercase text-slate-400">Vegetariano/a</dt>
            <dd className="text-slate-700">{displayBoolean(voluntario.alimentarias_veg)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-400">Alergias</dt>
            <dd className="text-slate-700">{voluntario.alimentarias_alergias || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-400">Observaciones</dt>
            <dd className="text-slate-700">{voluntario.alimentarias_otro || "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Inscripciones</h2>
          <span className="text-xs text-slate-500">{inscripciones.length} registros</span>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <form
            action="/api/admin/inscripciones/invitar"
            method="post"
            className="flex flex-col gap-3 md:flex-row md:items-end"
          >
            <input type="hidden" name="voluntario_id" value={voluntario.id} />
            <input type="hidden" name="redirectTo" value={`/admin/voluntarios/${voluntario.id}`} />
            <label className="flex-1 text-sm">
              <span className="block text-xs uppercase tracking-wide text-slate-500">Invitar a operativo</span>
              <select
                name="operativo_id"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                defaultValue=""
                required
                disabled={operativos.length === 0}
              >
                <option value="" disabled>
                  {operativos.length ? "Selecciona un operativo" : "No hay operativos disponibles"}
                </option>
                {operativos.map((op) => {
                  const titulo = op.titulo || "Operativo sin título";
                  const fecha = formatDateOnly(op.fecha_inicio);
                  const label = fecha === "—" ? titulo : `${titulo} · ${fecha}`;
                  return (
                    <option key={op.id} value={op.id}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </label>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={operativos.length === 0}
            >
              Enviar invitación
            </button>
          </form>
          {operativosErrorMessage ? (
            <p className="mt-2 text-xs text-red-600">{operativosErrorMessage}</p>
          ) : null}
          {!operativosErrorMessage && operativos.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">No hay operativos publicados para invitar.</p>
          ) : null}
        </div>
        {inscripcionesError ? (
          <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {inscripcionesError}
          </div>
        ) : null}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Operativo</th>
                <th className="px-4 py-3 text-left font-semibold">Origen</th>
                <th className="px-4 py-3 text-left font-semibold">Estado</th>
                <th className="px-4 py-3 text-left font-semibold">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inscripciones.length ? (
                inscripciones.map((row) => {
                  const operativoRaw = row.operativos;
                  const operativo = Array.isArray(operativoRaw)
                    ? operativoRaw[0]
                    : operativoRaw;
                  const operativoTitulo = operativo?.titulo || "—";
                  const operativoHref = operativo?.id ? `/admin/operativos/${operativo.id}` : null;
                  const origin = inferInscripcionOrigen(row.tipo, row.origen);
                  const originLabel = humanizeInscripcionOrigen(row.tipo, row.origen);
                  return (
                    <tr key={row.id} className="align-top">
                      <td className="px-4 py-3">
                        {operativoHref ? (
                          <Link href={operativoHref} className="text-blue-600 hover:underline">
                            {operativoTitulo}
                          </Link>
                        ) : (
                          <div>{operativoTitulo}</div>
                        )}
                        {operativo?.fecha_inicio ? (
                          <div className="text-xs text-slate-500">Inicio: {formatDateTime(operativo.fecha_inicio)}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${originBadgeClass(
                            origin
                          )}`}
                        >
                          {originLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3">{humanizeInscripcionEstado(row.estado)}</td>
                      <td className="px-4 py-3">{formatDateTime(row.created_at)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                    Este voluntario aún no registra inscripciones.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
