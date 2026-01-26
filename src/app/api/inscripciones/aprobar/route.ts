// src/app/api/inscripciones/aprobar/route.ts
// Endpoint para aprobar/rechazar inscripciones desde links en email
// Usa tokens HMAC firmados con expiración de 72 horas

import { NextResponse, type NextRequest } from "next/server";
import { validateApprovalToken } from "@/lib/approvalTokens";
import { supabaseService } from "@/lib/supabaseService";
import { sendInscripcionAceptadaEmail, sendInscripcionRechazadaEmail } from "@/lib/email";
import { getErrorMessage } from "@/lib/errors";

export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fundaciontraesol.cl";

// Tipos para las queries
type InscripcionRow = {
  id: string;
  estado: string | null;
  voluntario_id: string;
  operativo_id: string;
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
  whatsapp_grupo_url: string | null;
};

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return renderHtmlResponse({
      title: "Error",
      message: "Token no proporcionado.",
      success: false,
    });
  }

  // Validar token
  const payload = validateApprovalToken(token);
  if (!payload) {
    return renderHtmlResponse({
      title: "Enlace inválido o expirado",
      message: "Este enlace ya no es válido. Puede haber expirado (72h) o ya fue utilizado. Por favor, gestiona la postulación desde el panel de administración.",
      success: false,
      showAdminLink: true,
    });
  }

  const { inscripcionId, action } = payload;
  const nuevoEstado = action === "accept" ? "aprobado" : "rechazado";

  try {
    // Obtener inscripción actual
    const { data: inscripcion, error: inscError } = await supabaseService
      .from("inscripciones")
      .select("id, estado, voluntario_id, operativo_id")
      .eq("id", inscripcionId)
      .single();

    if (inscError || !inscripcion) {
      return renderHtmlResponse({
        title: "Inscripción no encontrada",
        message: "No se encontró la inscripción especificada. Puede haber sido eliminada.",
        success: false,
        showAdminLink: true,
      });
    }

    const insc = inscripcion as InscripcionRow;

    // Verificar que no esté ya procesada
    if (insc.estado === "aprobado" || insc.estado === "rechazado") {
      return renderHtmlResponse({
        title: "Ya procesada",
        message: `Esta postulación ya fue ${insc.estado === "aprobado" ? "aceptada" : "rechazada"} anteriormente.`,
        success: true,
        alreadyProcessed: true,
      });
    }

    // Actualizar estado
    const updateData = { 
      estado: nuevoEstado,
      // Registrar que fue via email token (si la columna existe)
    } as Record<string, unknown>;

    const { error: updateError } = await supabaseService
      .from("inscripciones")
      .update(updateData as never)
      .eq("id", inscripcionId);

    if (updateError) {
      throw updateError;
    }

    // Obtener datos del voluntario y operativo para enviar email
    const { data: voluntario } = await supabaseService
      .from("voluntarios")
      .select("id, nombres, apellidos, email")
      .eq("id", insc.voluntario_id)
      .single();

    const { data: operativo } = await supabaseService
      .from("operativos")
      .select("id, titulo, slug, fecha_inicio, fecha_fin, lugar, whatsapp_grupo_url")
      .eq("id", insc.operativo_id)
      .single();

    const vol = voluntario as VoluntarioRow | null;
    const op = operativo as OperativoRow | null;

    // Enviar email al voluntario
    if (vol?.email) {
      const emailParams = {
        to: vol.email,
        nombre: vol.nombres,
        operativoTitulo: op?.titulo,
        fechaInicio: op?.fecha_inicio,
        fechaFin: op?.fecha_fin,
        lugar: op?.lugar,
        whatsappGrupoUrl: op?.whatsapp_grupo_url,
      };

      if (action === "accept") {
        await sendInscripcionAceptadaEmail(emailParams).catch(console.error);
      } else {
        await sendInscripcionRechazadaEmail(emailParams).catch(console.error);
      }
    }

    const nombreVoluntario = [vol?.nombres, vol?.apellidos].filter(Boolean).join(" ") || "El voluntario";
    const accionTexto = action === "accept" ? "aceptada" : "rechazada";

    return renderHtmlResponse({
      title: action === "accept" ? "✓ Postulación aceptada" : "Postulación rechazada",
      message: `La postulación de <strong>${nombreVoluntario}</strong> al operativo <strong>${op?.titulo || ""}</strong> ha sido ${accionTexto}. Se ha enviado un email de notificación.`,
      success: true,
    });

  } catch (err) {
    console.error("[aprobar/route] Error:", err);
    return renderHtmlResponse({
      title: "Error",
      message: `Ocurrió un error al procesar la solicitud: ${getErrorMessage(err)}`,
      success: false,
      showAdminLink: true,
    });
  }
}

// Genera una respuesta HTML bonita para mostrar al admin
function renderHtmlResponse(params: {
  title: string;
  message: string;
  success: boolean;
  showAdminLink?: boolean;
  alreadyProcessed?: boolean;
}): Response {
  const { title, message, success, showAdminLink = false, alreadyProcessed = false } = params;
  const bgColor = success ? (alreadyProcessed ? "#fef3c7" : "#dcfce7") : "#fee2e2";
  const textColor = success ? (alreadyProcessed ? "#92400e" : "#166534") : "#991b1b";
  const iconColor = success ? (alreadyProcessed ? "#f59e0b" : "#22c55e") : "#ef4444";

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Traesol</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #1e40af 0%, #0891b2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      background: white;
      border-radius: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      max-width: 480px;
      width: 100%;
      overflow: hidden;
    }
    .header {
      background: ${bgColor};
      padding: 32px;
      text-align: center;
    }
    .icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 16px;
      font-size: 32px;
    }
    .title {
      font-size: 24px;
      font-weight: 700;
      color: ${textColor};
    }
    .body {
      padding: 32px;
    }
    .message {
      color: #475569;
      line-height: 1.6;
      text-align: center;
    }
    .actions {
      margin-top: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .btn {
      display: block;
      text-align: center;
      padding: 14px 24px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.2s;
    }
    .btn-primary {
      background: #1e40af;
      color: white;
    }
    .btn-primary:hover {
      background: #1e3a8a;
    }
    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
    }
    .btn-secondary:hover {
      background: #e2e8f0;
    }
    .footer {
      text-align: center;
      padding: 16px 32px 32px;
      color: #94a3b8;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="icon" style="color: ${iconColor}">
        ${success ? (alreadyProcessed ? "ℹ️" : "✓") : "✗"}
      </div>
      <h1 class="title">${title}</h1>
    </div>
    <div class="body">
      <p class="message">${message}</p>
      <div class="actions">
        ${showAdminLink ? `
          <a href="${SITE_URL}/admin/inscripciones" class="btn btn-primary">
            Ir al panel de administración
          </a>
        ` : ""}
        <a href="${SITE_URL}" class="btn btn-secondary">
          Volver al inicio
        </a>
      </div>
    </div>
    <div class="footer">
      Fundación Traesol · Sistema de gestión de voluntariado
    </div>
  </div>
</body>
</html>
  `;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
