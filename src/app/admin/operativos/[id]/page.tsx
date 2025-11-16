import type { ReactElement } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminSession";
import {
  humanizeInscripcionEstado,
  INSCRIPCION_ESTADO,
  INSCRIPCION_ESTADOS,
  isConfirmedEstado,
  isPendingEstado,
  isRejectedEstado,
  normalizeInscripcionEstado,
  normalizeInscripcionOrigen,
  type InscripcionEstado,
} from "@/lib/inscripciones";
import { supabaseService } from "@/lib/supabaseService";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type Operativo = {
  id: string;
  titulo: string;
  slug: string;
  descripcion: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  lugar: string | null;
  direccion: string | null;
  cupos_total: number | null;
  estado: string;
  imagen_cabecera_url: string | null;
  instagram_url: string | null;
  whatsapp_grupo_url: string | null;
  operativo_imagenes?: Array<{ id: string; url: string | null; path: string | null }>;
};

type Inscripcion = {
  id: string;
  estado: string | null;
  tipo: string | null;
  origen: string | null;
  created_at: string | null;
  voluntario_id: string | null;
};

type Voluntario = {
  id: string;
  nombres: string | null;
  apellidos: string | null;
  email: string | null;
  telefono: string | null;
  rut: string | null;
  id_nacional: string | null;
  pasaporte: string | null;
  profesion: string | null;
  profesion_otro: string | null;
  especialidad: string | null;
  nombre_credencial: string | null;
  instagram: string | null;
};

function humanOperativoEstado(value: string): string {
  const normalized = value.toLowerCase();
  switch (normalized) {
    case "publicado":
      return "Publicado";
    case "borrador":
      return "Borrador";
    case "finalizado":
      return "Finalizado";
    case "cerrado":
      return "Cerrado";
    default:
      return value;
  }
}

function estadoBadgeClass(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized === "publicado") return "bg-green-100 text-green-700 ring-green-200";
  if (normalized === "borrador") return "bg-amber-100 text-amber-700 ring-amber-200";
  if (normalized === "finalizado") return "bg-slate-200 text-slate-700 ring-slate-300";
  if (normalized === "cerrado") return "bg-red-100 text-red-700 ring-red-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function inscripcionEstadoBadgeClass(estado: InscripcionEstado | null): string {
  if (isPendingEstado(estado)) return "bg-amber-100 text-amber-700 ring-amber-200";
  if (isConfirmedEstado(estado)) return "bg-emerald-100 text-emerald-700 ring-emerald-200";
  if (isRejectedEstado(estado)) return "bg-rose-100 text-rose-700 ring-rose-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function formatRangoFechas(inicio: string | null, fin: string | null): string {
  const formatter = new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const startDate = inicio ? new Date(inicio) : null;
  const endDate = fin ? new Date(fin) : null;

  if (!startDate || Number.isNaN(startDate.getTime())) {
    return endDate && !Number.isNaN(endDate.getTime()) ? formatter.format(endDate) : "Por confirmar";
  }

  if (!endDate || Number.isNaN(endDate.getTime()) || startDate.getTime() === endDate.getTime()) {
    return formatter.format(startDate);
  }

  return `${formatter.format(startDate)} – ${formatter.format(endDate)}`;
}

function formatFechaCorta(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatInstagramHandle(value: string | null): { label: string; href?: string } {
  if (!value) return { label: "—" };
  try {
    const url = new URL(value.startsWith("http") ? value : `https://${value.replace(/^\/+/, "")}`);
    if (url.hostname.includes("instagram.com")) {
      const parts = url.pathname.split("/").filter(Boolean);
      const handle = parts[0] ? `@${parts[0]}` : url.hostname;
      return { label: handle, href: url.toString() };
    }
    return { label: url.hostname, href: url.toString() };
  } catch (error) {
    const trimmed = value.trim();
    const label = trimmed.startsWith("@") ? trimmed : `@${trimmed.replace(/^@/, "")}`;
    return { label };
  }
}

function formatNombreVoluntario(voluntario?: Voluntario): string {
  if (!voluntario) return "—";
  const parts = [voluntario.nombres, voluntario.apellidos].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  return voluntario.nombre_credencial || "—";
}

function describeInvitacionEstado(estado: InscripcionEstado | null): string {
  if (!estado || estado === INSCRIPCION_ESTADO.POSTULADO || estado === INSCRIPCION_ESTADO.PENDIENTE) {
    return "Pendiente de aceptación";
  }
  if (estado === INSCRIPCION_ESTADO.APROBADO || estado === INSCRIPCION_ESTADO.CONFIRMADO) {
    return "Aceptada por voluntario";
  }
  return "Rechazada";
}

function originBadgeClass(origin: "postulacion" | "invitacion"): string {
  if (origin === "invitacion") return "bg-blue-50 text-blue-700 ring-blue-200";
  return "bg-emerald-50 text-emerald-700 ring-emerald-200";
}

function renderEstadoPill(estado: string): ReactElement {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${estadoBadgeClass(
        estado,
      )}`}
    >
      {humanOperativoEstado(estado)}
    </span>
  );
}

function readMessage(
  source: Record<string, string | string[] | undefined> | undefined,
  key: string,
): string {
  if (!source) return "";
  const raw = source[key];
  if (Array.isArray(raw)) return raw[0] ?? "";
  return typeof raw === "string" ? raw : "";
}

export default async function OperativoDetailPage({ params, searchParams }: PageProps) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([
    params,
    searchParams ?? Promise.resolve(undefined),
  ]);
  const session = await getAdminSession();
  const operativoId = resolvedParams?.id?.trim();

  if (!operativoId) {
    notFound();
  }

  if (!session.allowed) {
    redirect(`/login?next=/admin/operativos/${operativoId}`);
  }

  const [operativoResult, inscripcionesResult] = await Promise.all([
    supabaseService
      .from("operativos")
      .select(
        "id,titulo,slug,descripcion,fecha_inicio,fecha_fin,lugar,direccion,cupos_total,estado,imagen_cabecera_url,instagram_url,whatsapp_grupo_url,operativo_imagenes(id,url,path)"
      )
      .eq("id", operativoId)
      .maybeSingle<Operativo>(),
    supabaseService
      .from("inscripciones")
      .select("id,estado,tipo,origen,created_at,voluntario_id")
      .eq("operativo_id", operativoId)
      .order("created_at", { ascending: false }),
  ]);

  if (operativoResult.error) {
    const message = encodeURIComponent(String(operativoResult.error.message));
    redirect(`/admin/operativos?error=${message}`);
  }

  const operativo = operativoResult.data;
  if (!operativo) {
    notFound();
  }

  if (inscripcionesResult.error) {
    const message = encodeURIComponent(String(inscripcionesResult.error.message));
    redirect(`/admin/operativos/${operativoId}?error=${message}`);
  }

  const inscripciones = (inscripcionesResult.data ?? []) as Inscripcion[];
  const voluntarioIds = Array.from(
    new Set(inscripciones.map((row) => row.voluntario_id).filter((value): value is string => Boolean(value)))
  );

  const statusSummary = inscripciones.reduce(
    (acc, row) => {
      const estado = normalizeInscripcionEstado(row.estado);
      if (isPendingEstado(estado)) acc.pending += 1;
      else if (isConfirmedEstado(estado)) acc.confirmed += 1;
      else if (isRejectedEstado(estado)) acc.rejected += 1;
      else acc.other += 1;
      return acc;
    },
    { pending: 0, confirmed: 0, rejected: 0, other: 0 }
  );

  const voluntariosMap = new Map<string, Voluntario>();
  if (voluntarioIds.length > 0) {
    const voluntariosResult = await supabaseService
      .from("voluntarios")
      .select(
        "id,nombres,apellidos,email,telefono,rut,id_nacional,pasaporte,profesion,profesion_otro,especialidad,nombre_credencial,instagram"
      )
      .in("id", voluntarioIds);

    if (voluntariosResult.error) {
      const message = encodeURIComponent(String(voluntariosResult.error.message));
      redirect(`/admin/operativos/${operativoId}?error=${message}`);
    }

    for (const vol of (voluntariosResult.data ?? []) as Voluntario[]) {
      voluntariosMap.set(vol.id, vol);
    }
  }

  const statusOptions: readonly string[] = INSCRIPCION_ESTADOS;

  const successMessage = readMessage(resolvedSearchParams, "success");
  const errorMessage = readMessage(resolvedSearchParams, "error");
  const fechaInicioCompleta = operativo.fecha_inicio ? formatFechaCorta(operativo.fecha_inicio) : "—";
  const fechaFinCompleta = operativo.fecha_fin ? formatFechaCorta(operativo.fecha_fin) : "—";
  const fechaRango = formatRangoFechas(operativo.fecha_inicio, operativo.fecha_fin);
  const galeria = Array.isArray(operativo.operativo_imagenes)
    ? operativo.operativo_imagenes
        .filter((item) => typeof item?.url === "string" && item.url)
        .map((item) => ({ id: item.id, url: item.url as string }))
    : [];
  const instagramHandle = formatInstagramHandle(operativo.instagram_url);
  const csvHref = `/api/admin/operativos/${operativoId}/inscripciones/accepted`;
  const publicUrl = operativo.slug ? `/operativos/${operativo.slug}` : null;
  const redirectToUrl = `/admin/operativos/${operativoId}?success=Estado+actualizado`;

  const inscripcionesDetalladas = inscripciones.map((inscripcion) => {
    const voluntario = inscripcion.voluntario_id ? voluntariosMap.get(inscripcion.voluntario_id) : undefined;
    const estadoActual = normalizeInscripcionEstado(inscripcion.estado) ?? INSCRIPCION_ESTADO.POSTULADO;
    const origenNormalizado = normalizeInscripcionOrigen(inscripcion.origen) === "invitacion" ? "invitacion" : "postulacion";

    return {
      raw: inscripcion,
      voluntario,
      estadoActual,
      estadoLabel: humanizeInscripcionEstado(estadoActual),
      estadoBadge: inscripcionEstadoBadgeClass(estadoActual),
      origen: origenNormalizado,
      nombre: formatNombreVoluntario(voluntario),
      email: voluntario?.email ?? "",
      profesion: voluntario?.profesion || voluntario?.profesion_otro || "—",
      createdLabel: formatFechaCorta(inscripcion.created_at),
    } as const;
  });

  const postulaciones = inscripcionesDetalladas.filter((row) => row.origen === "postulacion");
  const invitaciones = inscripcionesDetalladas.filter((row) => row.origen === "invitacion");
  const confirmados = inscripcionesDetalladas.filter(
    (row) => row.estadoActual === INSCRIPCION_ESTADO.APROBADO || row.estadoActual === INSCRIPCION_ESTADO.CONFIRMADO,
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">{operativo.titulo}</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>{fechaRango}</span>
            {operativo.lugar ? (
              <>
                <span>·</span>
                <span>{operativo.lugar}</span>
              </>
            ) : null}
          </div>
          <p className="max-w-2xl text-sm text-slate-600">
            {operativo.descripcion || "Sin descripción disponible."}
          </p>
        </div>
        <div className="flex flex-col items-end gap-3 text-right">
          {renderEstadoPill(operativo.estado)}
          <div className="text-xs text-slate-500">
            Slug: <span className="font-mono text-slate-700">{operativo.slug}</span>
          </div>
          <div className="flex flex-wrap justify-end gap-2 text-xs">
            {publicUrl ? (
              <Link href={publicUrl} className="inline-flex items-center rounded-md border px-3 py-1 font-medium text-slate-600 hover:bg-slate-50">
                Ver en sitio público
              </Link>
            ) : null}
            <Link
              href={`/admin/operativos/${operativoId}/editar`}
              className="inline-flex items-center rounded-md border border-blue-200 px-3 py-1 font-medium text-blue-700 hover:bg-blue-50"
            >
              Editar operativo
            </Link>
          </div>
        </div>
      </div>

      {successMessage ? (
        <div className="rounded-md border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Lugar</div>
          <div className="mt-1 text-sm text-slate-900">{operativo.lugar || operativo.direccion || "—"}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Cupos</div>
          <div className="mt-1 text-sm text-slate-900">
            {operativo.cupos_total ?? "—"}
            <span className="text-xs text-slate-500"> · Confirmados: {statusSummary.confirmed}</span>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm space-y-1">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">Enlaces internos</div>
          <div className="text-xs text-slate-600">
            {operativo.whatsapp_grupo_url ? (
              <a href={operativo.whatsapp_grupo_url} target="_blank" rel="noreferrer" className="underline">
                Grupo de WhatsApp
              </a>
            ) : (
              "Sin link interno"
            )}
          </div>
          {instagramHandle.label !== "—" ? (
            <div className="text-xs text-slate-600">
              Instagram: {instagramHandle.href ? (
                <a href={instagramHandle.href} className="underline" target="_blank" rel="noreferrer">
                  {instagramHandle.label}
                </a>
              ) : (
                <span>{instagramHandle.label}</span>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 text-sm shadow-sm">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <h2 className="font-medium text-slate-500">Fechas del operativo</h2>
              <p className="text-base text-slate-900">
                Inicio: {fechaInicioCompleta}
                <br />
                Fin: {fechaFinCompleta}
              </p>
            </div>
            <div>
              <h2 className="font-medium text-slate-500">Dirección</h2>
              <p className="text-base text-slate-900">{operativo.direccion || "—"}</p>
            </div>
            {operativo.descripcion ? (
              <div>
                <h2 className="font-medium text-slate-500">Descripción extendida</h2>
                <p className="whitespace-pre-line text-base text-slate-900">{operativo.descripcion}</p>
              </div>
            ) : null}
          </div>
          <div className="space-y-4">
            <div>
              <h2 className="font-medium text-slate-500">Notas internas</h2>
              <div className="text-base text-slate-900">
                {operativo.whatsapp_grupo_url ? (
                  <a
                    href={operativo.whatsapp_grupo_url}
                    className="inline-flex items-center gap-2 text-blue-600 underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span aria-hidden="true" className="text-lg">
                      💬
                    </span>
                    Abrir chat interno
                  </a>
                ) : (
                  <span className="text-slate-500">Sin enlace interno</span>
                )}
              </div>
              <p className="text-xs text-slate-500">Visible solo para el equipo de administración.</p>
            </div>
            {instagramHandle.label !== "—" ? (
              <div>
                <h2 className="font-medium text-slate-500">Instagram</h2>
                {instagramHandle.href ? (
                  <a href={instagramHandle.href} className="text-blue-600 underline" target="_blank" rel="noreferrer">
                    {instagramHandle.label}
                  </a>
                ) : (
                  <p className="text-base text-slate-900">{instagramHandle.label}</p>
                )}
              </div>
            ) : null}
          </div>
        </div>
        {galeria.length ? (
          <div className="mt-6 space-y-2">
            <h2 className="font-medium text-slate-500">Galería</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {galeria.map((img, index) => (
                <figure key={img.id} className="overflow-hidden rounded-lg border">
                  <img
                    src={img.url}
                    alt={`Imagen ${index + 1} del operativo ${operativo.titulo}`}
                    className="h-full w-full object-cover"
                  />
                </figure>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Inscripciones</h2>
            <p className="text-sm text-muted-foreground">
              Pendientes: {statusSummary.pending} · Confirmados: {statusSummary.confirmed} · Rechazados: {statusSummary.rejected}
            </p>
          </div>
          <a
            href={csvHref}
            className="inline-flex items-center rounded-md border px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Descargar voluntarios aceptados (CSV)
          </a>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Postulaciones ({postulaciones.length})
            </h3>
            {postulaciones.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-muted-foreground">
                No hay postulaciones para este operativo.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border bg-card">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Nombre</th>
                      <th className="px-3 py-2 text-left font-semibold">Email</th>
                      <th className="px-3 py-2 text-left font-semibold">Profesión</th>
                      <th className="px-3 py-2 text-left font-semibold">Estado</th>
                      <th className="px-3 py-2 text-left font-semibold">Registrada</th>
                      <th className="px-3 py-2 text-right font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {postulaciones.map((row) => (
                      <tr key={row.raw.id} className="border-t align-top">
                        <td className="px-3 py-2 font-medium text-slate-900">{row.nombre}</td>
                        <td className="px-3 py-2">
                          {row.email ? (
                            <a href={`mailto:${row.email}`} className="text-blue-600 underline">
                              {row.email}
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2">{row.profesion}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${row.estadoBadge}`}
                          >
                            {row.estadoLabel}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{row.createdLabel}</td>
                        <td className="px-3 py-2 text-right text-xs">
                          <div className="flex flex-wrap justify-end gap-2">
                            <form action="/api/admin/inscripciones/update" method="post">
                              <input type="hidden" name="id" value={row.raw.id} />
                              <input type="hidden" name="estado" value="aprobado" />
                              <input type="hidden" name="redirectTo" value={redirectToUrl} />
                              <button
                                type="submit"
                                className="inline-flex items-center rounded-md border border-green-600 px-3 py-1 font-medium text-green-700 hover:bg-green-50"
                              >
                                Aceptar
                              </button>
                            </form>
                            <form action="/api/admin/inscripciones/update" method="post">
                              <input type="hidden" name="id" value={row.raw.id} />
                              <input type="hidden" name="estado" value="rechazado" />
                              <input type="hidden" name="redirectTo" value={redirectToUrl} />
                              <button
                                type="submit"
                                className="inline-flex items-center rounded-md border border-rose-500 px-3 py-1 font-medium text-rose-600 hover:bg-rose-50"
                              >
                                Rechazar
                              </button>
                            </form>
                          </div>
                          <form action="/api/admin/inscripciones/update" method="post" className="mt-3 space-y-2">
                            <input type="hidden" name="id" value={row.raw.id} />
                            <input type="hidden" name="redirectTo" value={redirectToUrl} />
                            <select name="estado" defaultValue={row.estadoActual} className="w-full rounded-md border px-2 py-1">
                              {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {humanizeInscripcionEstado(status)}
                                </option>
                              ))}
                            </select>
                            <button
                              type="submit"
                              className="inline-flex w-full items-center justify-center rounded-md border px-3 py-1 font-medium text-slate-600 hover:bg-slate-50"
                            >
                              Guardar
                            </button>
                          </form>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Invitaciones enviadas ({invitaciones.length})
            </h3>
            {invitaciones.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-muted-foreground">
                No hay invitaciones para este operativo.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border bg-card">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Nombre</th>
                      <th className="px-3 py-2 text-left font-semibold">Email</th>
                      <th className="px-3 py-2 text-left font-semibold">Profesión</th>
                      <th className="px-3 py-2 text-left font-semibold">Estado</th>
                      <th className="px-3 py-2 text-left font-semibold">Registrada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitaciones.map((row) => (
                      <tr key={row.raw.id} className="border-t">
                        <td className="px-3 py-2 font-medium text-slate-900">{row.nombre}</td>
                        <td className="px-3 py-2">
                          {row.email ? (
                            <a href={`mailto:${row.email}`} className="text-blue-600 underline">
                              {row.email}
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2">{row.profesion}</td>
                        <td className="px-3 py-2 text-sm text-slate-600">
                          {describeInvitacionEstado(row.estadoActual)}
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{row.createdLabel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Voluntarios confirmados ({confirmados.length})
            </h3>
            {confirmados.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-muted-foreground">
                Aún no hay voluntarios confirmados.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border bg-card">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">Nombre</th>
                      <th className="px-3 py-2 text-left font-semibold">Email</th>
                      <th className="px-3 py-2 text-left font-semibold">Profesión</th>
                      <th className="px-3 py-2 text-left font-semibold">Origen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {confirmados.map((row) => (
                      <tr key={row.raw.id} className="border-t">
                        <td className="px-3 py-2 font-medium text-slate-900">{row.nombre}</td>
                        <td className="px-3 py-2">
                          {row.email ? (
                            <a href={`mailto:${row.email}`} className="text-blue-600 underline">
                              {row.email}
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2">{row.profesion}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${originBadgeClass(row.origen)}`}
                          >
                            {row.origen === "invitacion" ? "Invitación" : "Postulación"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
