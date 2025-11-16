import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseService";
import { getAdminSession } from "@/lib/adminSession";
import { normalizeInscripcionEstado } from "@/lib/inscripciones";
import {
  sendInscripcionAceptadaEmail,
  sendInscripcionRechazadaEmail,
} from "@/lib/email";

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

  console.log("DEBUG inscripcion-update:request", {
    id,
    estadoRaw: estadoRaw || null,
    estadoNormalized,
    redirectTo,
  });

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

    const previousEstado = normalizeInscripcionEstado(currentRow.estado);

    console.log("DEBUG inscripcion-update:before", {
      id,
      previousEstado,
      estadoRaw: estadoRaw || null,
      estadoNormalized,
    });

    const { data: updatedRow, error: updateError } = await supabaseService
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

    console.log("DEBUG inscripcion-update:after", {
      id,
      estadoFinal: updatedEstado,
    });

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

      const voluntario = voluntarioResult.data;
      const operativo = operativoResult.data;

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
            console.log("DEBUG inscripcion-update:email", {
              id,
              from: previousEstado,
              to: updatedEstado,
              action: "aprobado",
            });
            await sendInscripcionAceptadaEmail(payload);
          } else if (shouldSendRechazada) {
            console.log("DEBUG inscripcion-update:email", {
              id,
              from: previousEstado,
              to: updatedEstado,
              action: "rechazado",
            });
            await sendInscripcionRechazadaEmail(payload);
          }
        } catch (emailError) {
          console.error("No se pudo enviar el correo de inscripción", emailError);
        }
      }
    }

    return NextResponse.redirect(new URL(redirectTo, req.url), 303);
  } catch (err: any) {
    const url = new URL(redirectTo, req.url);
    url.searchParams.set("error", err?.message ? String(err.message) : "No se pudo actualizar");
    return NextResponse.redirect(url, 303);
  }
}
