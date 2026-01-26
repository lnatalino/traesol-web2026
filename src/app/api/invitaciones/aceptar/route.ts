import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseService";
import { INSCRIPCION_ESTADO, INSCRIPCION_ORIGEN } from "@/lib/inscripciones";
import { sendInvitacionAceptadaEmail } from "@/lib/invitaciones/emails";

/**
 * POST /api/invitaciones/aceptar
 * 
 * Procesa la aceptación de una invitación mediante token.
 * Body: { token: string }
 * 
 * Valida:
 * - Token existe y corresponde a una inscripción con origen "invitacion"
 * - No ha sido respondida previamente
 * - No está expirada (opcional: inscripciones no tienen fecha expiración por defecto)
 * 
 * Acciones:
 * - Actualiza estado a "confirmado"
 * - Registra fecha de respuesta
 * - Envía email de confirmación al voluntario
 * 
 * Retorna: { ok: true, operativo_id, operativo_slug } o { ok: false, error }
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

    // Validar formato UUID básico
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(token)) {
      return NextResponse.json(
        { ok: false, error: "Token de invitación inválido." },
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
      // Error de formato UUID también puede llegar aquí
      if (fetchError.code === "22P02") {
        return NextResponse.json(
          { ok: false, error: "Token de invitación inválido." },
          { status: 400 }
        );
      }
      console.error("[invitaciones/aceptar] Error buscando inscripción:", fetchError);
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

    // Verificar que tenga operativo_id
    if (!inscripcion.operativo_id) {
      return NextResponse.json(
        { ok: false, error: "La invitación no tiene operativo asociado." },
        { status: 400 }
      );
    }

    const operativoId = inscripcion.operativo_id;

    type OperativoResult = {
      id: string;
      slug: string | null;
      titulo: string | null;
      ubicacion: string | null;
      fecha_inicio: string | null;
      fecha_fin: string | null;
      whatsapp_grupo_url: string | null;
    };

    // Verificar si ya fue respondida
    if (inscripcion.respondido_en) {
      // Ya respondida - devolver éxito pero con mensaje
      const { data: operativo } = await supabaseService
        .from("operativos")
        .select("id, slug, titulo")
        .eq("id", operativoId)
        .maybeSingle<OperativoResult>();

      return NextResponse.json({
        ok: true,
        already_responded: true,
        current_estado: inscripcion.estado,
        message: "Esta invitación ya fue procesada anteriormente.",
        operativo_id: operativo?.id || operativoId,
        operativo_slug: operativo?.slug || null,
        operativo_titulo: operativo?.titulo || null,
      });
    }

    // Actualizar estado a "confirmado"
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabaseService as any)
      .from("inscripciones")
      .update({
        estado: INSCRIPCION_ESTADO.CONFIRMADO,
        respondido_en: new Date().toISOString(),
      })
      .eq("id", inscripcion.id);

    if (updateError) {
      console.error("[invitaciones/aceptar] Error actualizando inscripción:", updateError);
      return NextResponse.json(
        { ok: false, error: "No se pudo procesar la aceptación." },
        { status: 500 }
      );
    }

    // Obtener datos del operativo para la redirección y email
    const { data: operativo } = await supabaseService
      .from("operativos")
      .select("id, slug, titulo, ubicacion, fecha_inicio, fecha_fin, whatsapp_grupo_url")
      .eq("id", operativoId)
      .maybeSingle<OperativoResult>();

    // Obtener datos del voluntario para enviar email
    type VoluntarioResult = { id: string; nombres: string | null; apellidos: string | null; email: string | null };
    const { data: voluntario } = inscripcion.voluntario_id 
      ? await supabaseService
          .from("voluntarios")
          .select("id, nombres, apellidos, email")
          .eq("id", inscripcion.voluntario_id)
          .maybeSingle<VoluntarioResult>()
      : { data: null };

    // Enviar email de confirmación al voluntario
    if (voluntario?.email) {
      try {
        const emailResult = await sendInvitacionAceptadaEmail(
          {
            nombre: voluntario.nombres || "",
            apellido: voluntario.apellidos || "",
            email: voluntario.email,
          },
          {
            titulo: operativo?.titulo || "Operativo Traesol",
            ubicacion: operativo?.ubicacion,
            fecha_inicio: operativo?.fecha_inicio,
            fecha_fin: operativo?.fecha_fin,
            whatsapp_link: operativo?.whatsapp_grupo_url,
          }
        );
        if (emailResult.success) {
          console.log(`[invitaciones/aceptar] Email confirmación enviado a ${voluntario.email}`);
        } else {
          console.warn(`[invitaciones/aceptar] No se pudo enviar email: ${emailResult.error}`);
        }
      } catch (emailError) {
        console.error("[invitaciones/aceptar] Error enviando email:", emailError);
        // No fallar la operación si el email falla
      }
    } else {
      console.warn(`[invitaciones/aceptar] Voluntario sin email, no se envía confirmación`);
    }

    console.log(`[invitaciones/aceptar] Invitación aceptada: inscripcion_id=${inscripcion.id}, voluntario_id=${inscripcion.voluntario_id}, operativo_id=${operativoId}`);

    return NextResponse.json({
      ok: true,
      message: "¡Invitación aceptada exitosamente!",
      operativo_id: operativo?.id || operativoId,
      operativo_slug: operativo?.slug || null,
      operativo_titulo: operativo?.titulo || null,
    });
  } catch (error) {
    console.error("[invitaciones/aceptar] Error inesperado:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
