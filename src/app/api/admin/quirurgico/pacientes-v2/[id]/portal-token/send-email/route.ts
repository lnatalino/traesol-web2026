// src/app/api/admin/quirurgico/pacientes-v2/[id]/portal-token/send-email/route.ts
// Endpoint para regenerar token y enviar email

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { createPortalToken, getPaciente } from "@/lib/quirurgico";
import { supabaseService } from "@/lib/supabaseService";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { PortalPacienteEmail } from "@/emails/PortalPacienteEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

type RouteParams = { params: Promise<{ id: string }> };

// Helper para registrar email en audit log
// La tabla paciente_portal_email_log debe existir (ver docs/sql/20260127_portal_email_audit_log.sql)
async function logEmailSend(params: {
  pacienteId: string;
  emailTo: string;
  status: "pending" | "sent" | "failed";
  resendEmailId?: string | null;
  errorMessage?: string | null;
  portalUrl?: string;
  sentBy: string;
}) {
  try {
    // Cast to unknown first to allow dynamic table that may not be in types yet
    const { error } = await (supabaseService as unknown as {
      from: (table: string) => {
        insert: (data: Record<string, unknown>) => Promise<{ error: Error | null }>;
      };
    }).from("paciente_portal_email_log").insert({
      paciente_id: params.pacienteId,
      email_to: params.emailTo,
      email_subject: "Acceso al Portal del Paciente - Fundación Traesol",
      status: params.status,
      resend_email_id: params.resendEmailId || null,
      error_message: params.errorMessage || null,
      portal_url: params.portalUrl || null,
      sent_by: params.sentBy,
    });
    if (error) {
      console.warn("[portal-token/send-email] Error en audit log:", error.message);
    }
  } catch (err) {
    // No fallar si el log falla, solo registrar en consola
    console.warn("[portal-token/send-email] No se pudo registrar en audit log:", err);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  let pacienteId: string = "";
  let targetEmail: string = "";
  let adminEmail: string = "unknown";

  try {
    const session = await getAdminSession();
    if (!session.allowed) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    adminEmail = session.email || "admin";

    const { id } = await params;
    pacienteId = id;
    
    const body = await request.json().catch(() => ({}));
    const email = body.email ? String(body.email).trim() : null;
    targetEmail = email || "";

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
      );
    }

    // Verificar configuración de Resend
    if (!process.env.RESEND_API_KEY) {
      console.error("[api/portal-token/send-email] RESEND_API_KEY no configurado");
      await logEmailSend({
        pacienteId,
        emailTo: targetEmail,
        status: "failed",
        errorMessage: "RESEND_API_KEY no configurado",
        sentBy: adminEmail,
      });
      return NextResponse.json(
        { error: "Servicio de email no configurado" },
        { status: 500 }
      );
    }

    // Verificar que el paciente existe
    const paciente = await getPaciente(id);
    if (!paciente) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    // Regenerar token (esto invalida el anterior y crea uno nuevo)
    const { url, expiresAt } = await createPortalToken(
      id,
      adminEmail
    );

    const expirationDateStr = expiresAt.toLocaleDateString("es-CL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Enviar email
    const pacienteNombre = [paciente.nombres, paciente.apellidos].filter(Boolean).join(" ") || "Paciente";
    
    console.log("[api/portal-token/send-email] Preparando email para:", email);
    
    const emailHtml = await render(
      PortalPacienteEmail({
        nombre: pacienteNombre,
        portalUrl: url,
        expirationDate: expirationDateStr,
      })
    );

    const { data: emailData, error: sendError } = await resend.emails.send({
      from: "Fundación Traesol <no-reply@fundaciontraesol.cl>",
      to: email,
      subject: "Acceso al Portal del Paciente - Fundación Traesol",
      html: emailHtml,
    });

    if (sendError) {
      console.error("[api/portal-token/send-email] Resend error:", sendError);
      await logEmailSend({
        pacienteId,
        emailTo: targetEmail,
        status: "failed",
        errorMessage: sendError.message,
        portalUrl: url,
        sentBy: adminEmail,
      });
      return NextResponse.json(
        { 
          error: `Error de Resend: ${sendError.message}`,
          details: sendError.name 
        },
        { status: 500 }
      );
    }

    console.log("[api/portal-token/send-email] Email enviado con ID:", emailData?.id);

    // Registrar envío exitoso
    await logEmailSend({
      pacienteId,
      emailTo: targetEmail,
      status: "sent",
      resendEmailId: emailData?.id,
      portalUrl: url,
      sentBy: adminEmail,
    });

    return NextResponse.json({
      success: true,
      message: `Email enviado a ${email}`,
      portal_url: url,
      expires_at: expiresAt.toISOString(),
      email_id: emailData?.id,
    });
  } catch (error) {
    console.error("[api/portal-token/send-email] error:", error);
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    
    // Intentar registrar el fallo
    if (pacienteId && targetEmail) {
      await logEmailSend({
        pacienteId,
        emailTo: targetEmail,
        status: "failed",
        errorMessage,
        sentBy: adminEmail,
      });
    }
    
    return NextResponse.json(
      { error: `Error al enviar el email: ${errorMessage}` },
      { status: 500 }
    );
  }
}
