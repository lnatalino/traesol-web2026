import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminHero } from "@/components/admin/AdminHero";
import { getAdminSession } from "@/lib/adminSession";
import {
  humanizeInscripcionEstado,
  humanizeInscripcionOrigen,
  inferInscripcionOrigen,
  INSCRIPCION_ESTADO,
  isConfirmedEstado,
  isPendingEstado,
  isRejectedEstado,
  normalizeInscripcionEstado,
} from "@/lib/inscripciones";
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

function buildInitials(row: VoluntarioAdminRow): string {
  const nameParts = [row.nombres, row.apellidos].filter(Boolean);
  if (nameParts.length >= 2) {
    return `${nameParts[0]!.charAt(0)}${nameParts[1]!.charAt(0)}`.toUpperCase();
  }
  if (nameParts.length === 1 && nameParts[0]) {
    const first = nameParts[0]!.slice(0, 2);
    return first.toUpperCase();
  }
  if (row.nombre_credencial) {
    return row.nombre_credencial.slice(0, 2).toUpperCase();
  }
  if (row.email) {
    return row.email.slice(0, 2).toUpperCase();
  }
  return "VO";
}

function formatInstagramHandle(value: string | null): { label: string; href?: string } {
  if (!value) return { label: "—" };
  try {
    const normalized = value.startsWith("http") ? value : `https://${value.replace(/^\/+/, "")}`;
    const url = new URL(normalized);
    const handle = url.pathname.split("/").filter(Boolean)[0];
    const label = handle ? `@${handle}` : url.hostname;
    return { label, href: url.toString() };
  } catch (error) {
    const trimmed = value.trim();
    const label = trimmed.startsWith("@") ? trimmed : `@${trimmed.replace(/^@/, "")}`;
    return { label };
  }
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
      .select("id,tipo,origen,estado,created_at,operativo_id")
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
  const operativosRelacionadosIds = Array.from(
    new Set(inscripciones.map((row) => row.operativo_id).filter((value): value is string => Boolean(value)))
  );
  let operativosRelacionados: OperativoInfo[] = [];
  let operativosRelacionadosError = "";
  if (operativosRelacionadosIds.length > 0) {
    const { data, error } = await supabaseService
      .from("operativos")
      .select("id,titulo,slug,fecha_inicio")
      .in("id", operativosRelacionadosIds);
    if (error) {
      operativosRelacionadosError = String(error.message);
    } else {
      operativosRelacionados = (data ?? []) as OperativoInfo[];
    }
  }
  const operativosRelacionadosMap = new Map<string, OperativoInfo>(
    operativosRelacionados.map((row) => [row.id, row])
  );
  const inscripcionesError = [inscError ? String(inscError.message) : "", operativosRelacionadosError]
    .filter(Boolean)
    .join(". ");
  const operativos = (operativosData ?? []) as OperativoOption[];
  const operativosErrorMessage = operativosError ? String(operativosError.message) : "";
  const success = typeof sp?.success === "string" ? sp.success : "";
  const notice = typeof sp?.notice === "string" ? sp.notice : "";
  const errorMessage = typeof sp?.error === "string" ? sp.error : "";
  const initials = buildInitials(voluntario);
  const instagramHandle = formatInstagramHandle(voluntario.instagram);
  const redirectBackUrl = `/admin/voluntarios/${voluntario.id}?success=Estado+actualizado`;
  const inviteRedirectUrl = `/admin/voluntarios/${voluntario.id}?success=Invitacion+reenviada`;

  const inscripcionesDetalladas = inscripciones.map((row) => {
    const operativo = row.operativo_id ? operativosRelacionadosMap.get(row.operativo_id) ?? null : null;
    const estadoNormalizado = normalizeInscripcionEstado(row.estado) ?? INSCRIPCION_ESTADO.POSTULADO;
    return {
      raw: row,
      operativo,
      operativoTitulo: operativo?.titulo || "Operativo sin título",
      operativoHref: operativo?.id ? `/admin/operativos/${operativo.id}` : null,
      estadoNormalizado,
      estadoLabel: humanizeInscripcionEstado(row.estado),
      origin: inferInscripcionOrigen(row.tipo, row.origen),
      originLabel: humanizeInscripcionOrigen(row.tipo, row.origen),
      fechaLabel: formatDateTime(row.created_at),
      fechaInicioLabel: operativo?.fecha_inicio ? formatDateTime(operativo.fecha_inicio) : "—",
    } as const;
  });

  const historicoConfirmadas = inscripcionesDetalladas.filter(({ estadoNormalizado }) =>
    isConfirmedEstado(estadoNormalizado)
  );
  const postulacionesPendientes = inscripcionesDetalladas.filter(
    ({ origin, estadoNormalizado }) =>
      origin === "postulacion" && (isPendingEstado(estadoNormalizado) || isRejectedEstado(estadoNormalizado))
  );
  const invitacionesRecibidas = inscripcionesDetalladas.filter(({ origin }) => origin === "invitacion");

  return (
    <div className="space-y-8">
      <AdminHero
        eyebrow="Voluntario"
        title={displayNombre(voluntario)}
        description={(
          <div className="space-y-2 text-white/80">
            <div className="flex flex-wrap gap-4 text-sm">
              <span>RUT: {voluntario.rut || "Sin registro"}</span>
              <span>Perfil: {voluntario.tipo_usuario || "Voluntario/a"}</span>
            </div>
          </div>
        )}
        rightSlot={(
          <div className="flex flex-col items-stretch gap-3 text-sm">
            <Link
              href="/admin/voluntarios"
              className="inline-flex items-center justify-center rounded-full border border-white/30 px-5 py-2 font-semibold text-white transition hover:bg-white/10"
            >
              Volver al listado
            </Link>
            <Link
              href={`/admin/voluntarios/${voluntario.id}/editar`}
              className="inline-flex items-center justify-center rounded-full bg-white/90 px-5 py-2 font-semibold text-slate-900 transition hover:bg-white"
            >
              Editar voluntario
            </Link>
            <a
              href={`/api/admin/voluntarios/export?id=${voluntario.id}`}
              className="inline-flex items-center justify-center rounded-full border border-white/40 px-5 py-2 font-semibold text-white transition hover:bg-white/10"
            >
              Exportar CSV
            </a>
          </div>
        )}
        footer={(
          <div className="grid gap-6 lg:grid-cols-[auto,1fr]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-[32px] bg-white/10 text-3xl font-semibold uppercase">
                {initials}
              </div>
              <dl className="space-y-2 text-sm text-white">
                <div className="flex flex-wrap gap-2 text-white/80">
                  <dt className="text-white/60">Email</dt>
                  <dd>{voluntario.email || "—"}</dd>
                </div>
                <div className="flex flex-wrap gap-2 text-white/80">
                  <dt className="text-white/60">Teléfono</dt>
                  <dd>{voluntario.telefono || "—"}</dd>
                </div>
                <div className="flex flex-wrap gap-2 text-white/80">
                  <dt className="text-white/60">Instagram</dt>
                  <dd>
                    {instagramHandle.label === "—" ? (
                      <span>—</span>
                    ) : instagramHandle.href ? (
                      <a href={instagramHandle.href} target="_blank" rel="noreferrer" className="underline">
                        {instagramHandle.label}
                      </a>
                    ) : (
                      <span>{instagramHandle.label}</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-3xl border border-white/15 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Profesión</p>
                <p className="mt-2 text-lg font-semibold">{displayProfesion(voluntario)}</p>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Especialidad</p>
                <p className="mt-2 text-lg font-semibold">{voluntario.especialidad || "—"}</p>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Alimentación</p>
                <p className="mt-2 text-lg font-semibold">{displayBoolean(voluntario.alimentarias_veg)}</p>
              </div>
              <div className="rounded-3xl border border-white/15 bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">Tallas</p>
                <p className="mt-2 text-sm font-semibold">Polera {voluntario.talla_polera || "—"} · Pantalón {voluntario.talla_pantalon || "—"}</p>
              </div>
            </div>
          </div>
        )}
      />

      {success ? (
        <div className="rounded-[28px] border border-emerald-200/70 bg-emerald-50/80 px-5 py-4 text-sm font-medium text-emerald-900 shadow-sm">
          {success}
        </div>
      ) : null}

      {notice ? (
        <div className="rounded-[28px] border border-amber-200/70 bg-amber-50/80 px-5 py-4 text-sm font-medium text-amber-900 shadow-sm">
          {notice}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-[28px] border border-rose-200/70 bg-rose-50/80 px-5 py-4 text-sm font-medium text-rose-900 shadow-sm">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2">
        <article className="space-y-3 rounded-[32px] border border-slate-100 bg-white/95 p-5 shadow-sm shadow-slate-900/5">
          <h2 className="text-base font-semibold text-slate-900">Datos personales</h2>
          <dl className="grid grid-cols-1 gap-2 text-sm text-slate-700">
            <div>
              <dt className="text-xs uppercase text-slate-400">Nombres</dt>
              <dd>{voluntario.nombres || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Apellidos</dt>
              <dd>{voluntario.apellidos || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Nacionalidad</dt>
              <dd>{voluntario.nacionalidad || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Género</dt>
              <dd>{voluntario.genero || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Fecha de nacimiento</dt>
              <dd>{formatDateOnly(voluntario.fecha_nacimiento)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Registrado el</dt>
              <dd>{formatDateTime(voluntario.created_at)}</dd>
            </div>
          </dl>
        </article>
        <article className="space-y-3 rounded-[32px] border border-slate-100 bg-white/95 p-5 shadow-sm shadow-slate-900/5">
          <h2 className="text-base font-semibold text-slate-900">Contacto</h2>
          <dl className="grid grid-cols-1 gap-2 text-sm text-slate-700">
            <div>
              <dt className="text-xs uppercase text-slate-400">Email</dt>
              <dd>{voluntario.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Teléfono</dt>
              <dd>{voluntario.telefono || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Dirección</dt>
              <dd>{voluntario.direccion || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Ciudad</dt>
              <dd>{voluntario.ciudad || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Región</dt>
              <dd>{voluntario.region || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">País</dt>
              <dd>{voluntario.pais || "—"}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="space-y-3 rounded-[32px] border border-slate-100 bg-white/95 p-5 shadow-sm shadow-slate-900/5">
          <h2 className="text-base font-semibold text-slate-900">Identificación</h2>
          <dl className="grid grid-cols-1 gap-2 text-sm text-slate-700">
            <div>
              <dt className="text-xs uppercase text-slate-400">RUT</dt>
              <dd>{voluntario.rut || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">ID nacional</dt>
              <dd>{voluntario.id_nacional || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Pasaporte</dt>
              <dd>{voluntario.pasaporte || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Nombre credencial</dt>
              <dd>{voluntario.nombre_credencial || "—"}</dd>
            </div>
          </dl>
        </article>
        <article className="space-y-3 rounded-[32px] border border-slate-100 bg-white/95 p-5 shadow-sm shadow-slate-900/5">
          <h2 className="text-base font-semibold text-slate-900">Profesión y tallas</h2>
          <dl className="grid grid-cols-1 gap-2 text-sm text-slate-700">
            <div>
              <dt className="text-xs uppercase text-slate-400">Profesión</dt>
              <dd>{displayProfesion(voluntario)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Especialidad</dt>
              <dd>{voluntario.especialidad || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Talla polera</dt>
              <dd>{voluntario.talla_polera || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Talla pantalón</dt>
              <dd>{voluntario.talla_pantalon || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-400">Tipo de usuario</dt>
              <dd>{voluntario.tipo_usuario || "—"}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="space-y-3 rounded-[32px] border border-slate-100 bg-white/95 p-5 shadow-sm shadow-slate-900/5">
        <h2 className="text-base font-semibold text-slate-900">Alimentación</h2>
        <dl className="grid grid-cols-1 gap-2 text-sm text-slate-700">
          <div>
            <dt className="text-xs uppercase text-slate-400">Vegetariano/a</dt>
            <dd>{displayBoolean(voluntario.alimentarias_veg)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-400">Alergias</dt>
            <dd>{voluntario.alimentarias_alergias || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-400">Observaciones</dt>
            <dd>{voluntario.alimentarias_otro || "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-4 rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-sm shadow-slate-900/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Invitar a nuevo operativo</h2>
            <p className="text-sm text-slate-500">Envía nuevamente una invitación inmediata.</p>
          </div>
          <span className="text-xs text-slate-500">{inscripciones.length} registros totales</span>
        </div>
        <div className="rounded-[28px] border border-slate-100 bg-slate-50/80 p-5">
          <form
            action="/api/admin/inscripciones/invitar"
            method="post"
            className="flex flex-col gap-3 md:flex-row md:items-end"
          >
            <input type="hidden" name="voluntario_id" value={voluntario.id} />
            <input type="hidden" name="redirectTo" value={`/admin/voluntarios/${voluntario.id}`} />
            <label className="flex-1 text-sm">
              <span className="block text-xs uppercase tracking-[0.3em] text-slate-500">Operativo</span>
              <select
                name="operativo_id"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm"
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
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={operativos.length === 0}
            >
              Enviar invitación
            </button>
          </form>
          {operativosErrorMessage ? (
            <p className="mt-2 text-xs text-rose-600">{operativosErrorMessage}</p>
          ) : null}
          {!operativosErrorMessage && operativos.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">No hay operativos publicados para invitar.</p>
          ) : null}
        </div>
        {inscripcionesError ? (
          <div className="rounded-[28px] border border-rose-200/70 bg-rose-50/80 px-5 py-4 text-sm font-medium text-rose-900 shadow-sm">
            {inscripcionesError}
          </div>
        ) : null}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <article className="space-y-4 rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-sm shadow-slate-900/5">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">Inscripciones confirmadas</h2>
            <p className="text-sm text-slate-500">Historial de participaciones aceptadas o confirmadas.</p>
          </header>
          {historicoConfirmadas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500">
              Este voluntario aún no registra confirmaciones.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[28px] border border-slate-100 bg-white/90 shadow-inner">
              <table className="min-w-[720px] text-sm">
                <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold">Operativo</th>
                    <th className="px-5 py-3 text-left font-semibold">Estado</th>
                    <th className="px-5 py-3 text-left font-semibold">Fecha</th>
                    <th className="px-5 py-3 text-left font-semibold">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {historicoConfirmadas.map((entry) => (
                    <tr key={entry.raw.id} className="border-t align-middle">
                      <td className="px-5 py-3 align-top text-sm font-medium text-slate-900">
                        {entry.operativoHref ? (
                          <Link href={entry.operativoHref} className="block truncate font-semibold text-blue-600 underline">
                            {entry.operativoTitulo}
                          </Link>
                        ) : (
                          <span className="block truncate">{entry.operativoTitulo}</span>
                        )}
                        <p className="text-xs text-slate-500">Inicio: {entry.fechaInicioLabel}</p>
                      </td>
                      <td className="px-5 py-3 align-middle whitespace-nowrap text-sm font-medium text-slate-700">
                        {entry.estadoLabel}
                      </td>
                      <td className="px-5 py-3 align-middle whitespace-nowrap text-sm text-slate-500">{entry.fechaLabel}</td>
                      <td className="px-5 py-3 align-middle">
                        {entry.operativoHref ? (
                          <Link
                            href={entry.operativoHref}
                            className="inline-flex items-center rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Ver operativo
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400">Sin detalle</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="space-y-4 rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-sm shadow-slate-900/5">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">Postulaciones del voluntario</h2>
            <p className="text-sm text-slate-500">Pendientes o rechazadas para gestionar manualmente.</p>
          </header>
          {postulacionesPendientes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500">
              No hay postulaciones para revisar.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[28px] border border-slate-100 bg-white/90 shadow-inner">
              <table className="min-w-[760px] text-sm">
                <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold">Operativo</th>
                    <th className="px-5 py-3 text-left font-semibold">Estado</th>
                    <th className="px-5 py-3 text-left font-semibold">Fecha</th>
                    <th className="px-5 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {postulacionesPendientes.map((entry) => (
                    <tr key={entry.raw.id} className="border-t align-middle">
                      <td className="px-5 py-3 align-top">
                        <div className="font-semibold text-slate-900">{entry.operativoTitulo}</div>
                        <p className="text-xs text-slate-500">{entry.fechaLabel}</p>
                      </td>
                      <td className="px-5 py-3 align-middle whitespace-nowrap">
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                          {entry.estadoLabel}
                        </span>
                      </td>
                      <td className="px-5 py-3 align-middle whitespace-nowrap text-xs text-slate-500">{entry.fechaLabel}</td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap justify-end gap-2 text-xs">
                          <form action="/api/admin/inscripciones/update" method="post">
                            <input type="hidden" name="id" value={entry.raw.id} />
                            <input type="hidden" name="estado" value="aprobado" />
                            <input type="hidden" name="redirectTo" value={redirectBackUrl} />
                            <button
                              type="submit"
                              className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                            >
                              Aceptar
                            </button>
                          </form>
                          <form action="/api/admin/inscripciones/update" method="post">
                            <input type="hidden" name="id" value={entry.raw.id} />
                            <input type="hidden" name="estado" value="rechazado" />
                            <input type="hidden" name="redirectTo" value={redirectBackUrl} />
                            <button
                              type="submit"
                              className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-4 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                            >
                              Rechazar
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="space-y-4 rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-sm shadow-slate-900/5">
          <header className="space-y-1">
            <h2 className="text-lg font-semibold text-slate-900">Invitaciones enviadas</h2>
            <p className="text-sm text-slate-500">Historial de invitaciones emitidas al voluntario.</p>
          </header>
          {invitacionesRecibidas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-center text-sm text-slate-500">
              Aún no se han enviado invitaciones directas.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[28px] border border-slate-100 bg-white/90 shadow-inner">
              <table className="min-w-[720px] text-sm">
                <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold">Operativo</th>
                    <th className="px-5 py-3 text-left font-semibold">Estado</th>
                    <th className="px-5 py-3 text-left font-semibold">Fecha</th>
                    <th className="px-5 py-3 text-right font-semibold">Reenviar</th>
                  </tr>
                </thead>
                <tbody>
                  {invitacionesRecibidas.map((entry) => (
                    <tr key={entry.raw.id} className="border-t align-middle">
                      <td className="px-5 py-3 align-top">
                        <div className="font-semibold text-slate-900">{entry.operativoTitulo}</div>
                        <p className="text-xs text-slate-500">{entry.fechaLabel}</p>
                      </td>
                      <td className="px-5 py-3 align-middle whitespace-nowrap text-sm text-slate-700">{entry.estadoLabel}</td>
                      <td className="px-5 py-3 align-middle whitespace-nowrap text-xs text-slate-500">{entry.fechaLabel}</td>
                      <td className="px-5 py-3 text-right">
                        {entry.operativo?.id ? (
                          <form action="/api/admin/inscripciones/invitar" method="post" className="inline-flex">
                            <input type="hidden" name="voluntario_id" value={voluntario.id} />
                            <input type="hidden" name="operativo_id" value={entry.operativo.id} />
                            <input type="hidden" name="redirectTo" value={inviteRedirectUrl} />
                            <button
                              type="submit"
                              className="inline-flex items-center rounded-full border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Reenviar invitación
                            </button>
                          </form>
                        ) : (
                          <span className="text-xs text-slate-400">Sin operativo</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </section>

      <section className="space-y-4 rounded-[32px] border border-slate-100 bg-white/95 p-6 shadow-sm shadow-slate-900/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Resumen de inscripciones</h2>
            <p className="text-sm text-slate-500">Listado completo con el origen y estado de cada registro.</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 md:text-right">{inscripcionesDetalladas.length} totales</span>
        </div>
        <div className="overflow-x-auto rounded-[28px] border border-slate-100 bg-white/90 shadow-inner">
          <table className="min-w-[820px] divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left font-semibold">Operativo</th>
                <th className="px-5 py-3 text-left font-semibold">Origen</th>
                <th className="px-5 py-3 text-left font-semibold">Estado</th>
                <th className="px-5 py-3 text-left font-semibold">Creado el</th>
              </tr>
            </thead>
            <tbody>
              {inscripcionesDetalladas.length ? (
                inscripcionesDetalladas.map((entry) => (
                  <tr key={entry.raw.id} className="border-t align-middle">
                    <td className="px-5 py-4 align-top text-sm font-semibold text-slate-900">
                      {entry.operativoHref ? (
                        <Link href={entry.operativoHref} className="block truncate text-blue-600 underline">
                          {entry.operativoTitulo}
                        </Link>
                      ) : (
                        <span className="block truncate">{entry.operativoTitulo}</span>
                      )}
                      <p className="text-xs text-slate-500">Inicio: {entry.fechaInicioLabel}</p>
                    </td>
                    <td className="px-5 py-4 align-middle whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${originBadgeClass(
                          entry.origin
                        )}`}
                      >
                        {entry.originLabel}
                      </span>
                    </td>
                    <td className="px-5 py-4 align-middle whitespace-nowrap text-sm font-medium text-slate-700">
                      {entry.estadoLabel}
                    </td>
                    <td className="px-5 py-4 align-middle whitespace-nowrap text-sm text-slate-500">{entry.fechaLabel}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-500">
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
