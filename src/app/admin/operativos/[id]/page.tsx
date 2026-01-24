import type { ReactElement } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  Users,
  UserCheck,
  UserPlus,
  ClipboardList,
  Package,
  Download,
  ArrowLeft,
  Search,
  ExternalLink,
  Send,
  History,
} from "lucide-react";
import { AdminSectionCard } from "@/components/admin/operativos/AdminSectionCard";
import { OperativoSummaryCard } from "@/components/admin/operativos/OperativoSummaryCard";
import { OperativoInventoryMassive } from "@/components/admin/OperativoInventoryMassive";
import InviteVolunteers from "./InviteVolunteers";
import {
  buildProfesionOptions,
  buildEspecialidadOptions,
} from "@/lib/voluntariosAdmin";
import { ConfirmadosTableWithSearch } from "./ConfirmadosTableWithSearch";
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
import { getPlanInventarioOperativo } from "@/lib/inventario";
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
  profesion: string | null;
  profesion_otro: string | null;
  especialidad: string | null;
  nombre_credencial: string | null;
};

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────────────────────────────────────── */

function inscripcionEstadoBadgeClass(estado: InscripcionEstado | null): string {
  if (isPendingEstado(estado))
    return "bg-amber-100 text-amber-700 ring-amber-200";
  if (isConfirmedEstado(estado))
    return "bg-emerald-100 text-emerald-700 ring-emerald-200";
  if (isRejectedEstado(estado))
    return "bg-rose-100 text-rose-700 ring-rose-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
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

function formatNombreVoluntario(voluntario?: Voluntario): string {
  if (!voluntario) return "—";
  const parts = [voluntario.nombres, voluntario.apellidos].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  return voluntario.nombre_credencial || "—";
}

function originBadgeClass(origin: "postulacion" | "invitacion"): string {
  if (origin === "invitacion")
    return "bg-blue-50 text-blue-700 ring-blue-200";
  return "bg-emerald-50 text-emerald-700 ring-emerald-200";
}

function readMessage(
  source: Record<string, string | string[] | undefined> | undefined,
  key: string
): string {
  if (!source) return "";
  const raw = source[key];
  if (Array.isArray(raw)) return raw[0] ?? "";
  return typeof raw === "string" ? raw : "";
}

/* ─────────────────────────────────────────────────────────────────────────────
   PAGE COMPONENT
   ───────────────────────────────────────────────────────────────────────────── */

export default async function OperativoDetailPage({
  params,
  searchParams,
}: PageProps) {
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

  /* ───────────────────────────────────────────────────────────────────────────
     FETCH DATA
     ─────────────────────────────────────────────────────────────────────────── */

  const [operativoResult, inscripcionesResult] = await Promise.all([
    supabaseService
      .from("operativos")
      .select(
        "id,titulo,slug,descripcion,fecha_inicio,fecha_fin,lugar,direccion,cupos_total,estado,imagen_cabecera_url,instagram_url,whatsapp_grupo_url"
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
    new Set(
      inscripciones
        .map((row) => row.voluntario_id)
        .filter((value): value is string => Boolean(value))
    )
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
        "id,nombres,apellidos,email,telefono,rut,profesion,profesion_otro,especialidad,nombre_credencial"
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

  // Cargar opciones para filtros de invitaciones
  const allVolunteersResult = await supabaseService
    .from("voluntarios")
    .select("profesion,especialidad");
  const allVolunteers = (allVolunteersResult.data ?? []) as Array<{
    profesion: string | null;
    especialidad: string | null;
  }>;
  const profesionOptions = buildProfesionOptions(allVolunteers);
  const especialidadOptions = buildEspecialidadOptions(allVolunteers);
  const inviteFilterOptions = {
    profesiones: profesionOptions.values,
    especialidades: especialidadOptions.values,
    includeEmptyProfesion: profesionOptions.includeEmpty,
    includeEmptyEspecialidad: especialidadOptions.includeEmpty,
  };

  /* ───────────────────────────────────────────────────────────────────────────
     PROCESS DATA
     ─────────────────────────────────────────────────────────────────────────── */

  const statusOptions: readonly string[] = INSCRIPCION_ESTADOS;
  const successMessage = readMessage(resolvedSearchParams, "success");
  const errorMessage = readMessage(resolvedSearchParams, "error");
  const noticeMessage = readMessage(resolvedSearchParams, "notice");
  const csvHref = `/api/admin/operativos/${operativoId}/inscripciones/accepted`;
  const redirectToUrl = `/admin/operativos/${operativoId}?success=Estado+actualizado`;

  const inscripcionesDetalladas = inscripciones.map((inscripcion) => {
    const voluntario = inscripcion.voluntario_id
      ? voluntariosMap.get(inscripcion.voluntario_id)
      : undefined;
    const estadoActual =
      normalizeInscripcionEstado(inscripcion.estado) ?? INSCRIPCION_ESTADO.POSTULADO;
    const origenNormalizado =
      normalizeInscripcionOrigen(inscripcion.origen) === "invitacion"
        ? "invitacion"
        : "postulacion";

    return {
      raw: inscripcion,
      voluntario: voluntario ? { id: voluntario.id, rut: voluntario.rut } : undefined,
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

  // Separar por tipo
  const confirmados = inscripcionesDetalladas.filter(
    (row) =>
      row.estadoActual === INSCRIPCION_ESTADO.APROBADO ||
      row.estadoActual === INSCRIPCION_ESTADO.CONFIRMADO
  );

  const postulacionesPendientes = inscripcionesDetalladas.filter(
    (row) => row.origen === "postulacion" && isPendingEstado(row.estadoActual)
  );

  const postulacionesResueltas = inscripcionesDetalladas.filter(
    (row) =>
      row.origen === "postulacion" &&
      (isConfirmedEstado(row.estadoActual) || isRejectedEstado(row.estadoActual))
  );

  const invitaciones = inscripcionesDetalladas.filter(
    (row) => row.origen === "invitacion"
  );

  // Inventario
  const inventarioPlan = await getPlanInventarioOperativo(operativoId);
  const inventarioPlanCards = [
    {
      key: "uniformes" as const,
      label: "Uniformes",
      needed: inventarioPlan.necesidades.uniformesNecesarios,
      detail: "Renovación al primer operativo y cada 3.",
      stock: inventarioPlan.stock.uniforme,
    },
    {
      key: "lanyards" as const,
      label: "Lanyards",
      needed: inventarioPlan.necesidades.lanyardsNecesarios,
      detail: "Uno por cada voluntario confirmado.",
      stock: inventarioPlan.stock.lanyard,
    },
    {
      key: "credenciales" as const,
      label: "Credenciales",
      needed: inventarioPlan.necesidades.credencialesTotales,
      detail: `Incluye ${inventarioPlan.necesidades.credencialesExtra} de respaldo.`,
      stock: inventarioPlan.stock.credencial,
    },
  ];

  /* ───────────────────────────────────────────────────────────────────────────
     RENDER
     ─────────────────────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Volver */}
      <nav className="flex items-center gap-2 text-sm">
        <Link
          href="/admin/operativos"
          className="inline-flex items-center gap-1.5 text-slate-500 transition hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a operativos
        </Link>
      </nav>

      {/* Mensajes de feedback */}
      {successMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          ✓ {successMessage}
        </div>
      ) : null}

      {noticeMessage ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          ℹ {noticeMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-800">
          ⚠ {errorMessage}
        </div>
      ) : null}

      {/* ═══════════════════════════════════════════════════════════════════════
         A) RESUMEN DEL OPERATIVO
         ═══════════════════════════════════════════════════════════════════════ */}
      <OperativoSummaryCard
        operativo={operativo}
        stats={{
          pending: statusSummary.pending,
          confirmed: statusSummary.confirmed,
          rejected: statusSummary.rejected,
          total: inscripciones.length,
        }}
      />

      {/* ═══════════════════════════════════════════════════════════════════════
         B) CONFIRMADOS - Lo más importante
         ═══════════════════════════════════════════════════════════════════════ */}
      <AdminSectionCard
        title={`Voluntarios confirmados (${confirmados.length})`}
        hint="Voluntarios que ya están listos para participar en este operativo. Haz clic en un nombre para ver su ficha completa."
        icon={<UserCheck className="h-4 w-4" />}
        actions={
          <a
            href={csvHref}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5" />
            Descargar CSV
          </a>
        }
      >
        {confirmados.length === 0 ? (
          <EmptyState message="Aún no hay voluntarios confirmados. Revisa las postulaciones pendientes o envía invitaciones." />
        ) : (
          <ConfirmadosTableWithSearch rows={confirmados} />
        )}
      </AdminSectionCard>

      {/* ═══════════════════════════════════════════════════════════════════════
         C) POSTULACIONES
         ═══════════════════════════════════════════════════════════════════════ */}
      <AdminSectionCard
        title={`Postulaciones pendientes (${postulacionesPendientes.length})`}
        hint="Aquí revisas las postulaciones y decides quién participa. Acepta o rechaza cada una."
        icon={<ClipboardList className="h-4 w-4" />}
      >
        {postulacionesPendientes.length === 0 ? (
          <EmptyState message="No hay postulaciones pendientes de revisión. ¡Todo al día!" />
        ) : (
          <PostulacionesTable
            rows={postulacionesPendientes}
            redirectToUrl={redirectToUrl}
            statusOptions={statusOptions}
          />
        )}
      </AdminSectionCard>

      {postulacionesResueltas.length > 0 ? (
        <AdminSectionCard
          title={`Postulaciones resueltas (${postulacionesResueltas.length})`}
          hint="Historial de postulaciones que ya fueron aprobadas o rechazadas."
          icon={<History className="h-4 w-4" />}
        >
          <VolunteerTable
            rows={postulacionesResueltas}
            columns={["nombre", "email", "profesion", "estado"]}
            showEstado
          />
        </AdminSectionCard>
      ) : null}

      {/* ═══════════════════════════════════════════════════════════════════════
         D) INVITACIONES - Invitar + Historial
         ═══════════════════════════════════════════════════════════════════════ */}
      <AdminSectionCard
        title="Invitar voluntarios"
        hint="Invita voluntarios desde la base general. Las invitaciones enviadas quedarán registradas abajo."
        icon={<Send className="h-4 w-4" />}
      >
        <InviteVolunteers
          operativoId={operativoId}
          redirectTo={redirectToUrl}
          options={inviteFilterOptions}
        />
      </AdminSectionCard>

      <AdminSectionCard
        title={`Invitaciones enviadas (${invitaciones.length})`}
        hint="Historial de invitaciones enviadas para este operativo. Puedes ver el estado de cada una."
        icon={<History className="h-4 w-4" />}
      >
        {invitaciones.length === 0 ? (
          <EmptyState message="Aún no se han enviado invitaciones para este operativo." />
        ) : (
          <InvitacionesTable rows={invitaciones} />
        )}
      </AdminSectionCard>

      {/* ═══════════════════════════════════════════════════════════════════════
         E) INVENTARIO PARA CONFIRMADOS - ENTREGA MASIVA
         ═══════════════════════════════════════════════════════════════════════ */}
      <OperativoInventoryMassive operativoId={operativo.id} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SUB-COMPONENTS
   ───────────────────────────────────────────────────────────────────────────── */

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-5 py-8 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

type RowData = {
  raw: { id: string };
  voluntario?: {
    id: string;
    rut: string | null;
  };
  nombre: string;
  email: string;
  profesion: string;
  estadoLabel: string;
  estadoBadge: string;
  estadoActual: string;
  origen: "postulacion" | "invitacion";
  createdLabel: string;
};

function VolunteerTable({
  rows,
  columns,
  showEstado = false,
  showOrigen = false,
}: {
  rows: RowData[];
  columns: string[];
  showEstado?: boolean;
  showOrigen?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">Nombre</th>
            <th className="px-4 py-3 text-left">Email</th>
            <th className="px-4 py-3 text-left">Profesión</th>
            {showEstado ? (
              <th className="px-4 py-3 text-left">Estado</th>
            ) : null}
            {showOrigen ? (
              <th className="px-4 py-3 text-left">Origen</th>
            ) : null}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.raw.id} className="hover:bg-slate-50/50">
              <td className="px-4 py-3 font-medium text-slate-900">
                {row.nombre}
              </td>
              <td className="px-4 py-3">
                {row.email ? (
                  <a
                    href={`mailto:${row.email}`}
                    className="text-blue-600 underline"
                  >
                    {row.email}
                  </a>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3 text-slate-600">{row.profesion}</td>
              {showEstado ? (
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${row.estadoBadge}`}
                  >
                    {row.estadoLabel}
                  </span>
                </td>
              ) : null}
              {showOrigen ? (
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${originBadgeClass(row.origen)}`}
                  >
                    {row.origen === "invitacion" ? "Invitación" : "Postulación"}
                  </span>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PostulacionesTable({
  rows,
  redirectToUrl,
  statusOptions,
}: {
  rows: RowData[];
  redirectToUrl: string;
  statusOptions: readonly string[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">Nombre</th>
            <th className="px-4 py-3 text-left">Email</th>
            <th className="px-4 py-3 text-left">Profesión</th>
            <th className="px-4 py-3 text-left">Fecha</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.raw.id} className="hover:bg-slate-50/50">
              <td className="px-4 py-3 font-medium text-slate-900">
                {row.nombre}
              </td>
              <td className="px-4 py-3">
                {row.email ? (
                  <a
                    href={`mailto:${row.email}`}
                    className="text-blue-600 underline"
                  >
                    {row.email}
                  </a>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3 text-slate-600">{row.profesion}</td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {row.createdLabel}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap justify-end gap-2">
                  {/* Botón Aceptar */}
                  <form action="/api/admin/inscripciones/update" method="post">
                    <input type="hidden" name="id" value={row.raw.id} />
                    <input type="hidden" name="estado" value="aprobado" />
                    <input type="hidden" name="redirectTo" value={redirectToUrl} />
                    <button
                      type="submit"
                      className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      ✓ Aceptar
                    </button>
                  </form>
                  {/* Botón Rechazar */}
                  <form action="/api/admin/inscripciones/update" method="post">
                    <input type="hidden" name="id" value={row.raw.id} />
                    <input type="hidden" name="estado" value="rechazado" />
                    <input type="hidden" name="redirectTo" value={redirectToUrl} />
                    <button
                      type="submit"
                      className="inline-flex items-center rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      ✗ Rechazar
                    </button>
                  </form>
                </div>
                {/* Selector avanzado */}
                <form
                  action="/api/admin/inscripciones/update"
                  method="post"
                  className="mt-2 flex items-center gap-2"
                >
                  <input type="hidden" name="id" value={row.raw.id} />
                  <input type="hidden" name="redirectTo" value={redirectToUrl} />
                  <select
                    name="estado"
                    defaultValue={row.estadoActual}
                    className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {humanizeInscripcionEstado(status)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
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
  );
}

function InvitacionesTable({ rows }: { rows: RowData[] }) {
  function describeEstado(estado: string): string {
    const normalized = estado.toLowerCase();
    if (
      normalized === "postulado" ||
      normalized === "pendiente"
    )
      return "Pendiente de respuesta";
    if (normalized === "aprobado" || normalized === "confirmado")
      return "Aceptada";
    return "Rechazada";
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 text-left">Nombre</th>
            <th className="px-4 py-3 text-left">Email</th>
            <th className="px-4 py-3 text-left">Profesión</th>
            <th className="px-4 py-3 text-left">Estado</th>
            <th className="px-4 py-3 text-left">Enviada</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row) => (
            <tr key={row.raw.id} className="hover:bg-slate-50/50">
              <td className="px-4 py-3 font-medium text-slate-900">
                {row.nombre}
              </td>
              <td className="px-4 py-3">
                {row.email ? (
                  <a
                    href={`mailto:${row.email}`}
                    className="text-blue-600 underline"
                  >
                    {row.email}
                  </a>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3 text-slate-600">{row.profesion}</td>
              <td className="px-4 py-3 text-slate-600">
                {describeEstado(row.estadoActual)}
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {row.createdLabel}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type InventoryCardData = {
  key: string;
  label: string;
  needed: number;
  detail: string;
  stock: {
    cantidadActual: number | null;
    unidad: string | null;
  };
};

function InventoryCard({ card }: { card: InventoryCardData }) {
  const unidadLabel = card.stock.unidad?.trim() || "unidades";
  const isConfigured = typeof card.stock.cantidadActual === "number";
  const stockActual = isConfigured ? (card.stock.cantidadActual ?? 0) : null;
  const faltantes =
    typeof stockActual === "number"
      ? Math.max(0, card.needed - stockActual)
      : null;

  const status =
    !isConfigured || faltantes === null
      ? {
          label: "Configura stock",
          className: "bg-slate-100 text-slate-600",
        }
      : faltantes === 0
      ? {
          label: "✓ Suficiente",
          className: "bg-emerald-100 text-emerald-700",
        }
      : faltantes <= 5
      ? {
          label: `Atención: faltan ${faltantes}`,
          className: "bg-amber-100 text-amber-700",
        }
      : {
          label: `Faltan ${faltantes}`,
          className: "bg-rose-100 text-rose-700",
        };

  return (
    <article className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">{card.label}</p>
          <p className="text-xs text-slate-500">{card.detail}</p>
        </div>
        <span
          className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${status.className}`}
        >
          {status.label}
        </span>
      </div>
      <dl className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-slate-50 px-2 py-2">
          <dt className="text-[10px] font-medium uppercase text-slate-400">
            Necesarios
          </dt>
          <dd className="text-lg font-bold text-slate-900">{card.needed}</dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-2 py-2">
          <dt className="text-[10px] font-medium uppercase text-slate-400">
            Stock
          </dt>
          <dd className="text-lg font-bold text-slate-900">
            {isConfigured ? stockActual : "—"}
          </dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-2 py-2">
          <dt className="text-[10px] font-medium uppercase text-slate-400">
            Faltantes
          </dt>
          <dd className="text-lg font-bold text-slate-900">
            {isConfigured ? faltantes : "—"}
          </dd>
        </div>
      </dl>
    </article>
  );
}
