// src/app/api/admin/quirurgico/pacientes-v2/[id]/portal-token/route.ts
// Gestión de token de portal para un paciente

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import {
  createPortalToken,
  revokePortalToken,
  getPortalTokenInfo,
  getPaciente,
} from "@/lib/quirurgico";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { PortalPacienteEmail } from "@/emails/PortalPacienteEmail";

const resend = new Resend(process.env.RESEND_API_KEY);

type RouteParams = { params: Promise<{ id: string }> };

// GET - Obtener info del token actual
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session.allowed) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const tokenInfo = await getPortalTokenInfo(id);

    return NextResponse.json({ token_info: tokenInfo });
  } catch (error) {
    console.error("[api/admin/pacientes/[id]/portal-token] get error:", error);
    return NextResponse.json(
      { error: "Error al obtener info del token" },
      { status: 500 }
    );
  }
}

// POST - Crear o regenerar token, opcionalmente enviar por email
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session.allowed) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const sendEmail = body.sendEmail === true;
    const email = body.email ? String(body.email).trim() : null;
    
    // Verificar que el paciente existe
    const paciente = await getPaciente(id);
    if (!paciente) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    const { token, url, expiresAt } = await createPortalToken(
      id,
      session.email || "admin"
    );

    const expirationDateStr = expiresAt.toLocaleDateString("es-CL", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let emailSent = false;

    // Si se solicita enviar email
    if (sendEmail && email) {
      try {
        const pacienteNombre = [paciente.nombres, paciente.apellidos].filter(Boolean).join(" ") || "Paciente";
        
        // Renderizar email usando template institucional
        const emailHtml = await render(
          PortalPacienteEmail({
            nombre: pacienteNombre,
            portalUrl: url,
            expirationDate: expirationDateStr,
          })
        );

        // Usar FROM verificado (env var o fallback)
        const emailFrom = process.env.EMAIL_FROM || process.env.RESEND_FROM || "Fundación Traesol <notificaciones@mail.traesol.cl>";
        
        await resend.emails.send({
          from: emailFrom,
          to: email,
          subject: "Acceso al Portal del Paciente - Fundación Traesol",
          html: emailHtml,
        });
        emailSent = true;
      } catch (emailError) {
        console.error("[portal-token] email error:", emailError);
        // No fallar si el email no se envía, el token sigue siendo válido
      }
    }

    return NextResponse.json({
      success: true,
      portal_url: url,
      expires_at: expiresAt.toISOString(),
      expiration_date_formatted: expirationDateStr,
      email_sent: emailSent,
    });
  } catch (error) {
    console.error("[api/admin/pacientes/[id]/portal-token] create error:", error);
    return NextResponse.json(
      { error: "Error al crear token de acceso" },
      { status: 500 }
    );
  }
}

// DELETE - Revocar token
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session.allowed) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    await revokePortalToken(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/admin/pacientes/[id]/portal-token] revoke error:", error);
    return NextResponse.json(
      { error: "Error al revocar token" },
      { status: 500 }
    );
  }
}
