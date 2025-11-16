import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import { sendInvitacionOperativoEmail } from "@/lib/email";
import {
  inferInscripcionOrigen,
  INSCRIPCION_ESTADO,
  INSCRIPCION_ORIGEN,
  INSCRIPCION_TIPO_SCOPE,
  InscripcionInsert,
} from "@/lib/inscripciones";
import type { InscripcionEstado, InscripcionTipo } from "@/lib/inscripciones";

const ESTADO_PENDIENTE: InscripcionEstado = INSCRIPCION_ESTADO.PENDIENTE;
const ORIGEN_INVITACION = INSCRIPCION_ORIGEN.INVITACION;
const ORIGEN_POSTULACION = INSCRIPCION_ORIGEN.POSTULACION;
const TIPO_ESPECIFICA = INSCRIPCION_TIPO_SCOPE.ESPECIFICA;
const YA_INSCRITA_SET = new Set<InscripcionEstado>([INSCRIPCION_ESTADO.APROBADO, INSCRIPCION_ESTADO.CONFIRMADO]);

const BASE_SUMMARY = {
  INVITACION_ENVIADA: 0,
  INVITACION_REENVIADA: 0,
  YA_INSCRITO: 0,
  YA_POSTULO: 0,
  ERROR: 0,
} as const;

type InvitePayload = {
  operativoId: string;
  voluntarioIds: string[];
};

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
  estado: InscripcionEstado | null;
  tipo: InscripcionTipo | null;
  origen: string | null;
  voluntario_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type InviteResultStatus =
  | "INVITACION_ENVIADA"
  | "INVITACION_REENVIADA"
  | "YA_INSCRITO"
  | "YA_POSTULO"
  | "ERROR";

type InviteSummary = Record<InviteResultStatus, number>;

type InviteResult = { id: string; ok: boolean; status: InviteResultStatus; message: string };

type PendingInvite = {
  voluntarioId: string;
  voluntario: VoluntarioRow;
  email: string;
};

function sanitizeIds(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value): value is string => value.length > 0);
}

function buildOperativoLink(slug: string | null): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://fundaciontraesol.cl";
  const trimmed = base.replace(/\/$/, "");
  if (!slug) return `${trimmed}/operativos`;
  return `${trimmed}/operativos/${slug}`;
}

function buildSiteLink(slug: string | null, action: "accept" | "reject"): string {
  const base = buildOperativoLink(slug);
  const suffix = action === "accept" ? "acepto" : "rechazo";
  return `${base}?respuesta=${suffix}`;
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }

  let payload: InvitePayload | null = null;
  try {
    payload = (await req.json()) as InvitePayload;
  } catch (error) {
    payload = null;
  }

  const operativoId = typeof payload?.operativoId === "string" ? payload.operativoId.trim() : "";
  const voluntarioIds = sanitizeIds(payload?.voluntarioIds);

  if (!operativoId || voluntarioIds.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Debes seleccionar al menos un voluntario y un operativo." },
      { status: 400 }
    );
  }

  try {
    const uniqueVoluntarioIds = Array.from(new Set(voluntarioIds));

    const [operativoResponse, voluntariosResponse, existentesResponse] = await Promise.all([
      supabaseService
        .from("operativos")
        .select("id,titulo,slug,fecha_inicio,fecha_fin,lugar")
        .eq("id", operativoId)
        .maybeSingle<OperativoRow>(),
      supabaseService.from("voluntarios").select("id,nombres,apellidos,email").in("id", uniqueVoluntarioIds),
      supabaseService
        .from("inscripciones")
        .select("id,estado,tipo,origen,voluntario_id,created_at,updated_at")
        .eq("operativo_id", operativoId)
        .in("voluntario_id", uniqueVoluntarioIds),
    ]);

    const { data: operativo, error: operativoError } = operativoResponse;
    const { data: voluntarios, error: voluntarioError } = voluntariosResponse;
    const { data: existentes, error: existentesError } = existentesResponse;

    if (operativoError) throw operativoError;
    if (voluntarioError) throw voluntarioError;
    if (existentesError) throw existentesError;
    if (!operativo) {
      throw new Error("El operativo indicado no existe.");
    }

    const voluntarioMap = new Map((voluntarios as VoluntarioRow[]).map((row) => [row.id, row]));
    const existenteMap = new Map<string, InscripcionRow>();

    const parseDateValue = (value: string | null): number => {
      if (!value) return 0;
      const timestamp = Date.parse(value);
      return Number.isNaN(timestamp) ? 0 : timestamp;
    };

    for (const row of (existentes ?? []) as InscripcionRow[]) {
      if (!row?.voluntario_id) continue;
      const current = existenteMap.get(row.voluntario_id);
      if (!current) {
        existenteMap.set(row.voluntario_id, row);
        continue;
      }

      const currentTs = Math.max(parseDateValue(current.updated_at), parseDateValue(current.created_at));
      const incomingTs = Math.max(parseDateValue(row.updated_at), parseDateValue(row.created_at));
      if (incomingTs >= currentTs) {
        existenteMap.set(row.voluntario_id, row);
      }
    }

    const acceptUrl = buildSiteLink(operativo.slug, "accept");
    const rejectUrl = buildSiteLink(operativo.slug, "reject");
    const operativoLink = buildOperativoLink(operativo.slug);

    const summary: InviteSummary = { ...BASE_SUMMARY };
    const results: InviteResult[] = [];
    const rowsToInsert: InscripcionInsert[] = [];
    const pendingInvites: PendingInvite[] = [];
    const resendInvites: Array<PendingInvite & { inscripcionId: string }> = [];

    for (const id of uniqueVoluntarioIds) {
      const voluntario = voluntarioMap.get(id);
      if (!voluntario) {
        summary.ERROR += 1;
        results.push({ id, ok: false, status: "ERROR", message: "Voluntario no encontrado" });
        continue;
      }

      if (!voluntario.email) {
        summary.ERROR += 1;
        results.push({ id, ok: false, status: "ERROR", message: "El voluntario no tiene email registrado" });
        continue;
      }

      const email = voluntario.email as string;

      const inscripcion = existenteMap.get(id);
      const estadoActual = inscripcion?.estado ?? null;
      const origenActual = inferInscripcionOrigen(inscripcion?.tipo, inscripcion?.origen);

      if (inscripcion && estadoActual && YA_INSCRITA_SET.has(estadoActual)) {
        summary.YA_INSCRITO += 1;
        results.push({ id, ok: false, status: "YA_INSCRITO", message: "Esta persona ya está inscrita en este operativo." });
        continue;
      }

      if (
        inscripcion &&
        estadoActual === ESTADO_PENDIENTE &&
        (origenActual === ORIGEN_POSTULACION || inscripcion.origen === null)
      ) {
        summary.YA_POSTULO += 1;
        results.push({
          id,
          ok: false,
          status: "YA_POSTULO",
          message: "Esta persona ya postuló y está pendiente de revisión.",
        });
        continue;
      }

      if (inscripcion && origenActual === ORIGEN_INVITACION) {
        resendInvites.push({ voluntarioId: id, voluntario, email, inscripcionId: inscripcion.id });
        continue;
      }

      // OJO: `tipo` usa literalmente el campo `InscripcionInsert["tipo"]`, que mapea 1:1 a la columna `tipo` en la tabla.
      const insertRow: InscripcionInsert = {
        operativo_id: operativoId,
        voluntario_id: id,
        estado: ESTADO_PENDIENTE,
        tipo: TIPO_ESPECIFICA,
        origen: ORIGEN_INVITACION,
      };

      rowsToInsert.push(insertRow);
      pendingInvites.push({ voluntarioId: id, voluntario, email });
    }

    for (const pending of resendInvites) {
      try {
        const { error: updateError } = await supabaseService
          .from("inscripciones")
          .update({
            estado: ESTADO_PENDIENTE,
            origen: ORIGEN_INVITACION,
          })
          .eq("id", pending.inscripcionId)
          .select("id")
          .single();

        if (updateError) {
          throw updateError;
        }

        const nombres =
          [pending.voluntario.nombres, pending.voluntario.apellidos].filter(Boolean).join(" ").trim() || pending.email;

        await sendInvitacionOperativoEmail({
          voluntario: { nombres, email: pending.email },
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

        summary.INVITACION_REENVIADA += 1;
        results.push({
          id: pending.voluntarioId,
          ok: true,
          status: "INVITACION_REENVIADA",
          message: "Invitación reenviada correctamente.",
        });
      } catch (error: any) {
        console.error("[INVITACIONES] Error reenviando invitación", pending.voluntarioId, error);
        summary.ERROR += 1;
        results.push({
          id: pending.voluntarioId,
          ok: false,
          status: "ERROR",
          message: error?.message ? String(error.message) : "No se pudo reenviar la invitación.",
        });
      }
    }

    if (rowsToInsert.length > 0) {
      for (const row of rowsToInsert) {
        console.log("[INVITACIONES] Row lista para insert:", row);
        if (!row.tipo) {
          console.error("[INVITACIONES] ATENCIÓN: row.tipo viene vacío", row);
        }
        if (!row.operativo_id || !row.voluntario_id) {
          console.error("[INVITACIONES] ATENCIÓN: IDs incompletos antes del insert", row);
        }
      }

      const { data: insertData, error: insertError } = await supabaseService
        .from("inscripciones")
        .insert(rowsToInsert)
        .select("voluntario_id");

      if (insertError) {
        console.error("[INVITACIONES] Supabase insert error:", insertError);
        summary.ERROR += rowsToInsert.length;
        for (const pending of pendingInvites) {
          results.push({
            id: pending.voluntarioId,
            ok: false,
            status: "ERROR",
            message: "No se pudo registrar la invitación. Reintenta más tarde.",
          });
        }

        return NextResponse.json(
          {
            ok: false,
            message: "No se pudieron registrar las invitaciones.",
            summary,
            results,
            supabaseError: {
              message: insertError.message,
              details: insertError.details,
              hint: insertError.hint,
              code: insertError.code,
            },
          },
          { status: 500 }
        );
      }

      const insertedVoluntarios = new Set((insertData ?? []).map((row) => row.voluntario_id).filter(Boolean));

      for (const pending of pendingInvites) {
        if (!insertedVoluntarios.has(pending.voluntarioId)) {
          continue;
        }

        try {
          const nombres =
            [pending.voluntario.nombres, pending.voluntario.apellidos].filter(Boolean).join(" ").trim() || pending.email;

          await sendInvitacionOperativoEmail({
            voluntario: { nombres, email: pending.email },
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
          results.push({
            id: pending.voluntarioId,
            ok: true,
            status: "INVITACION_ENVIADA",
            message: "Invitación enviada correctamente.",
          });
        } catch (error: any) {
          console.error("Error enviando correo de invitación", pending.voluntarioId, error);
          summary.ERROR += 1;
          results.push({
            id: pending.voluntarioId,
            ok: false,
            status: "ERROR",
            message: error?.message ? String(error.message) : "No se pudo enviar el correo de invitación.",
          });
        }
      }
    }

    return NextResponse.json({
      ok: summary.ERROR === 0,
      summary,
      results,
    });
  } catch (error: any) {
    console.error("POST /api/admin/invitaciones", error);
    return NextResponse.json(
      { ok: false, error: error?.message ? String(error.message) : "No se pudieron enviar las invitaciones." },
      { status: 500 }
    );
  }
}
