import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { SurgicalConfirmationEmail } from "@/emails/SurgicalConfirmationEmail";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import { buildEmailBodyPreview } from "@/lib/quirurgico/communications";
import type { SurgicalEmailPayload } from "@/lib/quirurgico";
import { SURGICAL_EMAIL_SELECT } from "@/lib/quirurgico";
import type { Database } from "@/lib/database.types";

type RouteContext = { params: Promise<{ id: string }> };

const DEFAULT_EMAIL_TYPE = "confirmacion";
type QuirurgicoCommunicationInsert = Database["public"]["Tables"]["quirurgico_comunicaciones"]["Insert"];
type EmailResponse = { success: boolean; message: string };

export async function POST(req: NextRequest, { params }: RouteContext) {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json<EmailResponse>({ success: false, message: "No autorizado" }, { status: 403 });
  }

  try {
    const resolvedParams = await params;
    const pacienteId = resolvedParams?.id;

    if (!pacienteId) {
      return NextResponse.json<EmailResponse>(
        { success: false, message: "Falta el ID del paciente." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const tipoRaw = typeof body?.tipo === "string" ? body.tipo.trim() : DEFAULT_EMAIL_TYPE;
    const tipo = tipoRaw || DEFAULT_EMAIL_TYPE;

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    const fromName = process.env.RESEND_NAME ?? "Traesol";
    const internalTo = process.env.RESEND_INTERNAL_TO;

    if (!apiKey || !from) {
      console.error("Config correo incompleta", { apiKey: Boolean(apiKey), from: Boolean(from) });
      return NextResponse.json<EmailResponse>(
        { success: false, message: "Falta configuración de correo en el servidor." },
        { status: 500 }
      );
    }

    const resend = new Resend(apiKey);
    const { data: paciente, error: pacienteError } = await supabaseService
      .from("quirurgico_pacientes")
      .select(SURGICAL_EMAIL_SELECT)
      .eq("id", pacienteId)
      .maybeSingle<SurgicalEmailPayload>();

    if (pacienteError || !paciente) {
      console.error("[quirurgico] obtener paciente correo", pacienteError);
      return NextResponse.json<EmailResponse>(
        { success: false, message: "No pudimos obtener al paciente." },
        { status: 404 }
      );
    }

    if (!paciente.email) {
      return NextResponse.json<EmailResponse>(
        { success: false, message: "El paciente no tiene un correo registrado." },
        { status: 400 }
      );
    }

    const subject = tipo === "confirmacion"
      ? "Confirmación de operativo médico-quirúrgico"
      : "Actualización de operativo médico-quirúrgico";
    const to = paciente.email;
    const emailComponent = React.createElement(SurgicalConfirmationEmail, {
      nombre: paciente.nombre_completo ?? "Paciente",
      diagnostico: paciente.diagnostico,
      cirugia_planificada: paciente.cirugia_planificada,
      fecha_cirugia: paciente.fecha_cirugia,
      hora_cirugia: paciente.hora_cirugia,
      ciudad_origen: paciente.ciudad_origen,
      fecha_llegada_ciudad: paciente.fecha_llegada_ciudad,
      fecha_regreso_ciudad: paciente.fecha_regreso_ciudad,
      requiere_vuelo: paciente.requiere_vuelo,
      requiere_hospedaje: paciente.requiere_hospedaje,
      vuelo_ida_fecha: paciente.vuelo_ida_fecha,
      vuelo_ida_numero: paciente.vuelo_ida_numero,
      vuelo_ida_hora_salida: paciente.vuelo_ida_hora_salida,
      vuelo_ida_hora_llegada: paciente.vuelo_ida_hora_llegada,
      vuelo_regreso_fecha: paciente.vuelo_regreso_fecha,
      vuelo_regreso_hora_salida: paciente.vuelo_regreso_hora_salida,
      vuelo_regreso_hora_llegada: paciente.vuelo_regreso_hora_llegada,
      hotel_nombre: paciente.hotel_nombre,
      hotel_direccion: paciente.hotel_direccion,
      hotel_checkin_inicial: paciente.hotel_checkin_inicial,
      hotel_checkout_inicial: paciente.hotel_checkout_inicial,
      hotel_checkin_post_cirugia: paciente.hotel_checkin_post_cirugia,
      hotel_checkout_final: paciente.hotel_checkout_final,
      alta_hospitalaria_estimada: paciente.alta_hospitalaria_estimada,
      visita_enfermera_fecha: paciente.visita_enfermera_fecha,
      primera_kine_fecha: paciente.primera_kine_fecha,
      segunda_kine_fecha: paciente.segunda_kine_fecha,
      curacion_fecha: paciente.curacion_fecha,
      dias_estimados_santiago: paciente.dias_estimados_santiago,
    });
    const html = await render(emailComponent);
    const plainText = await render(emailComponent, { plainText: true });

    const fromHeader = `${fromName} <${from}>`;
    const { data: resendData, error: sendError } = await resend.emails.send({
      from: fromHeader,
      to,
      subject,
      react: emailComponent,
      ...(internalTo ? { bcc: internalTo } : {}),
    });

    if (sendError) {
      console.error("[quirurgico] enviar correo error", sendError);
      return NextResponse.json<EmailResponse>(
        { success: false, message: "No se pudo enviar el correo. Intenta nuevamente más tarde." },
        { status: 500 }
      );
    }

    const body_preview_raw = buildEmailBodyPreview({ html, plainText });
    const metadata: QuirurgicoCommunicationInsert["metadata"] = {
      enviado_por: session.email || "admin",
      resend_message_id: resendData?.id ?? null,
      operativo_id: paciente.operativo_quirurgico_id ?? null,
    };

    const logPayload: QuirurgicoCommunicationInsert = {
      paciente_id: paciente.id,
      tipo,
      to_email: to,
      subject,
      body_preview: body_preview_raw || null,
      metadata,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: logError } = await (supabaseService as any)
      .from("quirurgico_comunicaciones")
      .insert(logPayload);

    if (logError) {
      console.error("[quirurgico] log comunicacion error", {
        code: logError.code,
        message: logError.message,
        details: logError.details,
        row: logPayload,
      });
      return NextResponse.json<EmailResponse>(
        { success: false, message: "El correo fue enviado pero no se pudo registrar el historial." },
        { status: 500 }
      );
    }

    return NextResponse.json<EmailResponse>(
      { success: true, message: "Correo enviado correctamente." },
      { status: 200 }
    );
  } catch (err) {
    console.error("[quirurgico] enviar correo inesperado", err);
    return NextResponse.json<EmailResponse>(
      { success: false, message: "No se pudo enviar el correo. Intenta nuevamente." },
      { status: 500 }
    );
  }
}