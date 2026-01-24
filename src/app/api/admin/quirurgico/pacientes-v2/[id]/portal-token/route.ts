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

    let emailSent = false;

    // Si se solicita enviar email
    if (sendEmail && email) {
      try {
        const pacienteNombre = [paciente.nombres, paciente.apellidos].filter(Boolean).join(" ") || "Paciente";
        
        await resend.emails.send({
          from: "Fundación Traesol <no-reply@fundaciontraesol.cl>",
          to: email,
          subject: "Acceso al Portal de Paciente - Fundación Traesol",
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1e40af;">Acceso al Portal de Paciente</h2>
              <p>Estimado/a ${pacienteNombre},</p>
              <p>Ha sido registrado como paciente en un operativo quirúrgico de la Fundación Traesol.</p>
              <p>Para completar su información y subir los documentos necesarios, haga clic en el siguiente botón:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${url}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  Acceder al Portal
                </a>
              </div>
              <p>O copie y pegue este enlace en su navegador:</p>
              <p style="background-color: #f1f5f9; padding: 10px; border-radius: 4px; word-break: break-all;">
                ${url}
              </p>
              <p><strong>Este enlace le permite:</strong></p>
              <ul>
                <li>Verificar y actualizar sus datos personales</li>
                <li>Agregar contactos de emergencia</li>
                <li>Subir exámenes y documentos médicos requeridos</li>
              </ul>
              <p style="color: #dc2626;"><strong>⚠️ Importante:</strong> Este enlace es personal e intransferible. Expira el ${expiresAt.toLocaleDateString("es-CL")}.</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="color: #64748b; font-size: 12px;">
                Fundación Traesol<br />
                <a href="https://fundaciontraesol.cl">fundaciontraesol.cl</a>
              </p>
            </div>
          `,
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
