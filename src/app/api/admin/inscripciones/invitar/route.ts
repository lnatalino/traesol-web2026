import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import { sendInvitacionOperativoEmail } from "@/lib/email";
import { getErrorMessage } from "@/lib/errors";
import {
  inferInscripcionOrigen,
  INSCRIPCION_ORIGEN,
  INSCRIPCION_TIPO_SCOPE,
  isConfirmedEstado,
  isPendingEstado,
  normalizeInscripcionEstado,
  type InscripcionInsert,
} from "@/lib/inscripciones";
import { type InscripcionEstado } from "@/lib/inscripciones";

function parseValue(value: FormDataEntryValue | null): string {
  return value === null ? "" : String(value).trim();
}

function ensureRedirect(url: string, fallback: string, req: Request): URL {
  const value = url || fallback;
  return new URL(value, req.url);
}

type VoluntarioRow = {
  id: string;
  nombres: string | null;
  apellidos: string | null;
  email: string | null;
};

type OperativoRow = {
  id: string;
  titulo: string | null;
  slug: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  lugar: string | null;
};

type InscripcionRow = {
  id: string;
  estado: string | null;
  tipo: string | null;
  origen?: string | null;
  voluntario_id: string | null;
  created_at?: string | null;
};

function buildDetailLink(slug: string | null): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://fundaciontraesol.cl";
  const trimmed = base.replace(/\/$/, "");
  if (!slug) return `${trimmed}/operativos`;
  return `${trimmed}/operativos/${slug}`;
}

const INVITACION_ESTADO_FALLBACK: InscripcionEstado = "pendiente";

type InviteResultStatus =
  | "INVITACION_ENVIADA"
  | "YA_INSCRITO"
  | "INVITACION_PENDIENTE"
  | "YA_POSTULO"
  | "ERROR";

type InviteDecision = InviteResultStatus | "DISPONIBLE";

function resolveInviteDecision(rows: InscripcionRow[]): InviteDecision {
  if (!rows.length) return "DISPONIBLE";

  let hasPendingInvitation = false;
  let hasPendingPostulacion = false;

  for (const row of rows) {
    const estado = normalizeInscripcionEstado(row.estado);
    if (isConfirmedEstado(estado)) {
      return "YA_INSCRITO";
    }
    if (isPendingEstado(estado)) {
      const origin = inferInscripcionOrigen(row.tipo, row.origen);
      if (origin === INSCRIPCION_ORIGEN.INVITACION) {
        hasPendingInvitation = true;
      } else if (origin === INSCRIPCION_ORIGEN.POSTULACION) {
        hasPendingPostulacion = true;
      }
    }
  }

  if (hasPendingInvitation) return "INVITACION_PENDIENTE";
  if (hasPendingPostulacion) return "YA_POSTULO";
  return "DISPONIBLE";
}

function buildSiteLink(slug: string | null, type: "accept" | "reject"): string {
  const detail = buildDetailLink(slug);
  const action = type === "accept" ? "acepto" : "rechazo";
  return `${detail}?respuesta=${action}`;
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  const contentType = req.headers.get("content-type") || "";
  const expectsJson = contentType.includes("application/json");

  if (!session.allowed) {
    if (expectsJson) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
    }

    const target = new URL("/login", req.url);
    target.searchParams.set("next", "/admin/invitaciones");
    return NextResponse.redirect(target, 303);
  }

  let voluntarioIds: string[] = [];
  let operativoId = "";
  let estadoRaw = "";
  let redirectTo = "";

  if (expectsJson) {
    type JsonPayload = {
      voluntarioIds?: unknown;
      operativoId?: unknown;
      estado?: unknown;
    };

    let rawPayload: unknown = null;
    try {
      rawPayload = await req.json();
    } catch {
      rawPayload = null;
    }
    const payload = rawPayload && typeof rawPayload === "object" ? (rawPayload as JsonPayload) : null;
    const ids = Array.isArray(payload?.voluntarioIds) ? payload?.voluntarioIds : [];
    voluntarioIds = ids
      .map((value: unknown) => (typeof value === "string" ? value.trim() : ""))
      .filter((value: string): value is string => value.length > 0);
    operativoId = typeof payload?.operativoId === "string" ? payload.operativoId.trim() : "";
    estadoRaw = typeof payload?.estado === "string" ? payload.estado : "";
    redirectTo = "/admin/invitaciones";
  } else {
    const form = await req.formData();
    const voluntarioValues = form.getAll("voluntario_id");
    voluntarioIds = voluntarioValues
      .map((value) => parseValue(value))
      .filter((value): value is string => value.length > 0);
    operativoId = parseValue(form.get("operativo_id"));
    estadoRaw = parseValue(form.get("estado"));
    redirectTo = parseValue(form.get("redirectTo"));
  }

  const invitacionEstado = normalizeInscripcionEstado(estadoRaw) ?? INVITACION_ESTADO_FALLBACK;
  const fallback = operativoId ? `/admin/operativos/${operativoId}` : "/admin/inscripciones";
  const successUrl = expectsJson ? null : ensureRedirect(redirectTo, fallback, req);

  if (!voluntarioIds.length || !operativoId) {
    if (expectsJson) {
      return NextResponse.json(
        { ok: false, error: "Debes seleccionar al menos un voluntario y un operativo." },
        { status: 400 }
      );
    }

    const url = ensureRedirect(redirectTo, fallback, req);
    url.searchParams.set("error", "Faltan voluntario u operativo para enviar la invitación.");
    return NextResponse.redirect(url, 303);
  }

  try {
    const uniqueVoluntarioIds = Array.from(new Set(voluntarioIds));

    const { data: voluntarioRows, error: volError } = await supabaseService
      .from("voluntarios")
      .select("id,nombres,apellidos,email")
      .in("id", uniqueVoluntarioIds);

    if (volError) throw volError;

    const voluntarioList = (voluntarioRows ?? []) as VoluntarioRow[];
    const voluntarioMap = new Map(voluntarioList.map((row) => [row.id, row]));

    const missingVoluntarios = uniqueVoluntarioIds.filter((id) => !voluntarioMap.has(id));
    if (missingVoluntarios.length) {
      throw new Error("No fue posible obtener los datos de todos los voluntarios seleccionados.");
    }

    const { data: operativo, error: opError } = await supabaseService
      .from("operativos")
      .select("id,titulo,slug,fecha_inicio,fecha_fin,lugar")
      .eq("id", operativoId)
      .maybeSingle<OperativoRow>();

    if (opError) throw opError;
    if (!operativo) {
      throw new Error("El operativo indicado no existe.");
    }

    const { data: existentes, error: existingError } = await supabaseService
      .from("inscripciones")
      .select("id,estado,tipo,origen,voluntario_id,created_at")
      .eq("operativo_id", operativoId)
      .in("voluntario_id", uniqueVoluntarioIds)
      .order("created_at", { ascending: false });

    if (existingError) throw existingError;

    const existenteMap = new Map<string, InscripcionRow[]>();
    for (const row of (existentes ?? []) as InscripcionRow[]) {
      if (!row?.voluntario_id) continue;
      const key = String(row.voluntario_id);
      const list = existenteMap.get(key);
      if (list) {
        list.push(row);
      } else {
        existenteMap.set(key, [row]);
      }
    }

    const acceptUrl = buildSiteLink(operativo.slug, "accept");
    const rejectUrl = buildSiteLink(operativo.slug, "reject");
    const operativoLink = buildDetailLink(operativo.slug);

    const results: Array<{ id: string; ok: boolean; status: InviteResultStatus; message: string }> = [];
    const summary: Record<InviteResultStatus, number> = {
      INVITACION_ENVIADA: 0,
      YA_INSCRITO: 0,
      INVITACION_PENDIENTE: 0,
      YA_POSTULO: 0,
      ERROR: 0,
    };

    for (const id of uniqueVoluntarioIds) {
      const voluntario = voluntarioMap.get(id);
      if (!voluntario) {
        summary.ERROR += 1;
        results.push({
          id,
          ok: false,
          status: "ERROR",
          message: "No se encontraron los datos del voluntario",
        });
        continue;
      }

      if (!voluntario.email) {
        summary.ERROR += 1;
        results.push({
          id,
          ok: false,
          status: "ERROR",
          message: "Sin email registrado para este voluntario",
        });
        continue;
      }

      const decision = resolveInviteDecision(existenteMap.get(id) ?? []);
      if (decision !== "DISPONIBLE") {
        summary[decision] += 1;
        let message = "";
        if (decision === "YA_INSCRITO") {
          message = "Esta persona ya está inscrita en este operativo.";
        } else if (decision === "INVITACION_PENDIENTE") {
          message = "Ya tiene una invitación pendiente para este operativo.";
        } else if (decision === "YA_POSTULO") {
          message = "Esta persona ya postuló a este operativo y está pendiente de revisión.";
        }
        results.push({ id, ok: false, status: decision, message });
        continue;
      }

      try {
        const insertPayload: InscripcionInsert = {
          voluntario_id: id,
          operativo_id: operativoId,
          estado: invitacionEstado,
          tipo: INSCRIPCION_TIPO_SCOPE.ESPECIFICA,
          origen: INSCRIPCION_ORIGEN.INVITACION,
        };

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await supabaseService.from("inscripciones").insert(insertPayload as any);
        if (insertError) throw insertError;

        const nombres = [voluntario.nombres, voluntario.apellidos]
          .filter(Boolean)
          .join(" ")
          .trim() || voluntario.email;

        await sendInvitacionOperativoEmail({
          voluntario: { nombres, email: voluntario.email },
          operativo: {
            titulo: operativo.titulo || "Operativo Traesol",
            fecha_inicio: operativo.fecha_inicio,
            fecha_fin: operativo.fecha_fin,
            lugar: operativo.lugar,
            link: operativoLink,
          },
          acceptUrl,
          rejectUrl,
        });

        summary.INVITACION_ENVIADA += 1;
        results.push({ id, ok: true, status: "INVITACION_ENVIADA", message: "Invitación enviada correctamente." });
      } catch (error: unknown) {
        const debug = getErrorMessage(error);
        console.error("Error invitando voluntario", id, debug, error);
        summary.ERROR += 1;
        results.push({
          id,
          ok: false,
          status: "ERROR",
          message: "No se pudo enviar la invitación.",
        });
      }
    }

    if (expectsJson) {
      return NextResponse.json({
        ok: summary.ERROR === 0,
        summary,
        results,
      });
    }

    if (successUrl) {
      const successMessages: string[] = [];
      const noticeMessages: string[] = [];
      const errorMessages: string[] = [];

      if (summary.INVITACION_ENVIADA > 0) {
        successMessages.push(
          summary.INVITACION_ENVIADA === 1
            ? "Se envió 1 invitación nueva."
            : `Se enviaron ${summary.INVITACION_ENVIADA} invitaciones nuevas.`
        );
      }
      if (summary.INVITACION_PENDIENTE > 0) {
        noticeMessages.push(
          summary.INVITACION_PENDIENTE === 1
            ? "Se omitió 1 persona porque ya tenía una invitación pendiente."
            : `Se omitieron ${summary.INVITACION_PENDIENTE} personas porque ya tenían invitaciones pendientes.`
        );
      }
      if (summary.YA_POSTULO > 0) {
        noticeMessages.push(
          summary.YA_POSTULO === 1
            ? "Se omitió 1 persona porque ya postuló a este operativo."
            : `Se omitieron ${summary.YA_POSTULO} personas porque ya habían postulado a este operativo.`
        );
      }
      if (summary.YA_INSCRITO > 0) {
        noticeMessages.push(
          summary.YA_INSCRITO === 1
            ? "Se omitió 1 persona porque ya está inscrita en el operativo."
            : `Se omitieron ${summary.YA_INSCRITO} personas porque ya están inscritas en el operativo.`
        );
      }
      if (summary.ERROR > 0) {
        const firstError = results.find((item) => !item.ok && item.status === "ERROR");
        const detail = firstError?.message ? ` (${firstError.message})` : "";
        errorMessages.push(
          summary.ERROR === 1
            ? `1 invitación falló${detail}.`
            : `${summary.ERROR} invitaciones fallaron. Revisa los registros.`
        );
      }

      if (successMessages.length) {
        successUrl.searchParams.set("success", successMessages.join(" "));
      }
      if (noticeMessages.length) {
        successUrl.searchParams.set("notice", noticeMessages.join(" "));
      }
      if (errorMessages.length) {
        successUrl.searchParams.set("error", errorMessages.join(" "));
      }
    }

    return NextResponse.redirect(successUrl ?? new URL("/admin/invitaciones", req.url), 303);
  } catch (error: unknown) {
    const debug = getErrorMessage(error);
    console.error("Error enviando invitaciones", debug, error);
    if (expectsJson) {
      return NextResponse.json(
        { ok: false, error: "No se pudieron enviar las invitaciones." },
        { status: 500 }
      );
    }

    const url = ensureRedirect(redirectTo, fallback, req);
    url.searchParams.set("error", "No se pudo enviar la invitación.");
    return NextResponse.redirect(url, 303);
  }
}
