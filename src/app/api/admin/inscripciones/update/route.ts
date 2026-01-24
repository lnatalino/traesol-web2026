import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseService";
import { getAdminSession } from "@/lib/adminSession";
import { normalizeInscripcionEstado } from "@/lib/inscripciones";
import {
  sendInscripcionAceptadaEmail,
  sendInscripcionRechazadaEmail,
} from "@/lib/email";
import { getErrorMessage } from "@/lib/errors";

function parseValue(value: FormDataEntryValue | null): string {
  return value === null ? "" : String(value).trim();
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }

  const form = await req.formData();
  const id = parseValue(form.get("id"));
  const estadoRaw = parseValue(form.get("estado"));
  const estadoNormalized = normalizeInscripcionEstado(estadoRaw);
  const redirectTo = parseValue(form.get("redirectTo")) || "/admin/operativos";

  if (!id) {
    const url = new URL(redirectTo || "/admin/operativos", req.url);
    url.searchParams.set("error", "Inscripción inválida");
    return NextResponse.redirect(url, 303);
  }

  if (!estadoNormalized) {
    const url = new URL(redirectTo || "/admin/operativos", req.url);
    url.searchParams.set("error", "Estado inválido");
    return NextResponse.redirect(url, 303);
  }

  try {
    const { data: currentRow, error: fetchError } = await supabaseService
      .from("inscripciones")
      .select("id,estado,operativo_id,voluntario_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!currentRow) {
      throw new Error("Inscripción no encontrada");
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentData = currentRow as any;
    const previousEstado = normalizeInscripcionEstado(currentData.estado);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = supabaseService as any;
    const { data: updatedRow, error: updateError } = await client
      .from("inscripciones")
      .update({ estado: estadoNormalized })
      .eq("id", id)
      .select("id,operativo_id,voluntario_id,estado")
      .maybeSingle();

    if (updateError) throw updateError;
    if (!updatedRow) {
      throw new Error("No se pudo actualizar la inscripción");
    }

    const updatedEstado = normalizeInscripcionEstado(updatedRow.estado) ?? estadoNormalized;

    const shouldSendAprobada = estadoNormalized === "aprobado" && previousEstado !== "aprobado";
    const shouldSendRechazada = estadoNormalized === "rechazado" && previousEstado !== "rechazado";

    if ((shouldSendAprobada || shouldSendRechazada) && updatedRow?.voluntario_id && updatedRow?.operativo_id) {
      const [voluntarioResult, operativoResult] = await Promise.all([
        supabaseService
          .from("voluntarios")
          .select("id,nombres,apellidos,email")
          .eq("id", updatedRow.voluntario_id)
          .maybeSingle(),
        supabaseService
          .from("operativos")
          .select("id,titulo,fecha_inicio,fecha_fin,lugar,whatsapp_grupo_url")
          .eq("id", updatedRow.operativo_id)
          .maybeSingle(),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const voluntario = voluntarioResult.data as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const operativo = operativoResult.data as any;

      if (voluntario?.email) {
        const payload = {
          to: voluntario.email,
          nombre: [voluntario.nombres, voluntario.apellidos].filter(Boolean).join(" ") || voluntario.email,
          operativoTitulo: operativo?.titulo || "Traesol",
          fechaInicio: operativo?.fecha_inicio || null,
          fechaFin: operativo?.fecha_fin || null,
          lugar: operativo?.lugar || null,
          whatsappGrupoUrl: operativo?.whatsapp_grupo_url || null,
        };

        try {
          if (shouldSendAprobada) {
            await sendInscripcionAceptadaEmail(payload);
          } else if (shouldSendRechazada) {
            await sendInscripcionRechazadaEmail(payload);
          }
        } catch (emailError) {
          console.error(
            "[Admin/Inscripciones] No se pudo enviar el correo de inscripción",
            getErrorMessage(emailError),
            emailError,
          );
        }
      }
    }

    return NextResponse.redirect(new URL(redirectTo, req.url), 303);
  } catch (error: unknown) {
    const url = new URL(redirectTo, req.url);
    const debug = getErrorMessage(error);
    console.error("[Admin/Inscripciones] Error actualizando inscripción", id, debug, error);
    url.searchParams.set("error", "No se pudo actualizar la inscripción.");
    return NextResponse.redirect(url, 303);
  }
}
