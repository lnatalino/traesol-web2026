// src/app/api/admin/quirurgico/pacientes-v2/[id]/portal-token/send-email/route.ts
// Endpoint para regenerar token y enviar email

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { createPortalToken, getPaciente } from "@/lib/quirurgico";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { PortalPacienteEmail } from "@/emails/PortalPacienteEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session.allowed) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const email = body.email ? String(body.email).trim() : null;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Email inválido" },
        { status: 400 }
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
      session.email || "admin"
    );

    const expirationDateStr = expiresAt.toLocaleDateString("es-CL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Enviar email
    const pacienteNombre = [paciente.nombres, paciente.apellidos].filter(Boolean).join(" ") || "Paciente";
    
    const emailHtml = await render(
      PortalPacienteEmail({
        nombre: pacienteNombre,
        portalUrl: url,
        expirationDate: expirationDateStr,
      })
    );

    await resend.emails.send({
      from: "Fundación Traesol <no-reply@fundaciontraesol.cl>",
      to: email,
      subject: "Acceso al Portal del Paciente - Fundación Traesol",
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      message: `Email enviado a ${email}`,
      portal_url: url,
      expires_at: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("[api/portal-token/send-email] error:", error);
    return NextResponse.json(
      { error: "Error al enviar el email" },
      { status: 500 }
    );
  }
}
