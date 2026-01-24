import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseService";
import { INSCRIPCION_ESTADO, INSCRIPCION_ORIGEN } from "@/lib/inscripciones";

/**
 * POST /api/invitaciones/rechazar
 * 
 * Procesa el rechazo de una invitación mediante token.
 * Body: { token: string }
 * 
 * Valida:
 * - Token existe y corresponde a una inscripción con origen "invitacion"
 * - No ha sido respondida previamente
 * 
 * Acciones:
 * - Actualiza estado a "rechazado"
 * - Registra fecha de respuesta
 * 
 * Retorna: { ok: true } o { ok: false, error }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body.token === "string" ? body.token.trim() : "";

    if (!token) {
      return NextResponse.json(
        { ok: false, error: "Token de invitación no proporcionado." },
        { status: 400 }
      );
    }

    // Buscar la inscripción por token
    type InscripcionResult = {
      id: string;
      estado: string | null;
      origen: string | null;
      respondido_en: string | null;
      operativo_id: string | null;
      voluntario_id: string | null;
    };

    const { data: inscripcion, error: fetchError } = await supabaseService
      .from("inscripciones")
      .select("id, estado, origen, respondido_en, operativo_id, voluntario_id")
      .eq("token_respuesta", token)
      .maybeSingle<InscripcionResult>();

    if (fetchError) {
      console.error("[invitaciones/rechazar] Error buscando inscripción:", fetchError);
      return NextResponse.json(
        { ok: false, error: "Error al procesar la invitación." },
        { status: 500 }
      );
    }

    if (!inscripcion) {
      return NextResponse.json(
        { ok: false, error: "Invitación no encontrada o token inválido." },
        { status: 404 }
      );
    }

    // Verificar que sea una invitación
    if (inscripcion.origen !== INSCRIPCION_ORIGEN.INVITACION) {
      return NextResponse.json(
        { ok: false, error: "Este enlace no corresponde a una invitación." },
        { status: 400 }
      );
    }

    // Verificar si ya fue respondida
    if (inscripcion.respondido_en) {
      return NextResponse.json({
        ok: true,
        already_responded: true,
        current_estado: inscripcion.estado,
        message: "Esta invitación ya fue procesada anteriormente.",
      });
    }

    // Actualizar estado a "rechazado"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabaseService as any)
      .from("inscripciones")
      .update({
        estado: INSCRIPCION_ESTADO.RECHAZADO,
        respondido_en: new Date().toISOString(),
      })
      .eq("id", inscripcion.id);

    if (updateError) {
      console.error("[invitaciones/rechazar] Error actualizando inscripción:", updateError);
      return NextResponse.json(
        { ok: false, error: "No se pudo procesar el rechazo." },
        { status: 500 }
      );
    }

    console.log(`[invitaciones/rechazar] Invitación rechazada: inscripcion_id=${inscripcion.id}, voluntario_id=${inscripcion.voluntario_id}, operativo_id=${inscripcion.operativo_id}`);

    return NextResponse.json({
      ok: true,
      message: "Has rechazado la invitación. Esperamos contar contigo en una próxima ocasión.",
    });
  } catch (error) {
    console.error("[invitaciones/rechazar] Error inesperado:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
