// src/lib/invitaciones/emails.ts
// Funciones para enviar emails relacionados con invitaciones de voluntarios

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fundaciontraesol.cl";
const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL || 
  "https://alohwvivujbhlpqunad.supabase.co/storage/v1/object/public/public/logo-traesol.png";
const HEADER_GRADIENT = "linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)";

interface VoluntarioData {
  nombre: string;
  apellido: string;
  email: string;
}

interface OperativoData {
  titulo: string;
  ubicacion?: string | null;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  whatsapp_link?: string | null;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "Por confirmar";
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-CL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Envía email de confirmación cuando un voluntario acepta una invitación
 */
export async function sendInvitacionAceptadaEmail(
  voluntario: VoluntarioData,
  operativo: OperativoData
): Promise<{ success: boolean; error?: string; emailId?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[invitaciones/emails] RESEND_API_KEY no configurado");
    return { success: false, error: "Servicio de email no configurado" };
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; padding: 24px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <!-- Header con gradiente -->
    <div style="background: ${HEADER_GRADIENT}; padding: 32px 24px; text-align: center;">
      <a href="${SITE_URL}" target="_blank" rel="noopener" style="text-decoration: none;">
        <img src="${LOGO_URL}" alt="Traesol" width="120" height="40" style="display: inline-block; max-height: 40px; width: auto; border: 0; margin-bottom: 12px;" />
      </a>
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; line-height: 1.3;">🎉 ¡Tu participación está confirmada!</h1>
    </div>
    
    <!-- Contenido -->
    <div style="padding: 32px 24px; color: #334155; font-size: 16px; line-height: 1.6;">
      <p style="margin: 0 0 16px;">
        Hola <strong>${voluntario.nombre} ${voluntario.apellido}</strong>,
      </p>
      
      <p style="margin: 0 0 24px;">
        ¡Excelentes noticias! Has confirmado tu participación en el operativo. 
        Nos alegra mucho contar contigo en esta misión.
      </p>
      
      <!-- Info del operativo -->
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h3 style="color: #166534; margin: 0 0 16px; font-size: 18px;">✅ ${operativo.titulo}</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          ${operativo.ubicacion ? `
          <tr>
            <td style="color: #64748b; padding: 6px 0; width: 100px;">Ubicación:</td>
            <td style="color: #334155; font-weight: 500; padding: 6px 0;">${operativo.ubicacion}</td>
          </tr>
          ` : ''}
          ${operativo.fecha_inicio ? `
          <tr>
            <td style="color: #64748b; padding: 6px 0;">Inicio:</td>
            <td style="color: #334155; font-weight: 500; padding: 6px 0;">${formatDate(operativo.fecha_inicio)}</td>
          </tr>
          ` : ''}
          ${operativo.fecha_fin ? `
          <tr>
            <td style="color: #64748b; padding: 6px 0;">Término:</td>
            <td style="color: #334155; font-weight: 500; padding: 6px 0;">${formatDate(operativo.fecha_fin)}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      
      ${operativo.whatsapp_link ? `
      <!-- WhatsApp CTA -->
      <div style="background: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
        <h3 style="color: #166534; margin: 0 0 12px; font-size: 16px;">📱 Grupo de WhatsApp</h3>
        <p style="color: #334155; margin: 0 0 16px; font-size: 14px;">
          Toda la coordinación del operativo se realizará a través de este grupo. ¡Únete ahora!
        </p>
        <a href="${operativo.whatsapp_link}" 
           target="_blank"
           style="display: inline-block; background: #22c55e; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Unirme al grupo de WhatsApp
        </a>
      </div>
      ` : ''}
      
      <!-- Próximos pasos -->
      <div style="background: #eff6ff; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h3 style="color: #1d4ed8; margin: 0 0 12px; font-size: 16px;">📋 Próximos pasos</h3>
        <ol style="margin: 0; padding-left: 20px; color: #334155;">
          ${operativo.whatsapp_link ? `
          <li style="margin-bottom: 8px;"><strong>Únete al grupo de WhatsApp</strong> - Es el canal principal de comunicación</li>
          ` : ''}
          <li style="margin-bottom: 8px;">Recibirás instrucciones detalladas de logística</li>
          <li style="margin-bottom: 8px;">Prepara tu documentación personal (cédula, título profesional si aplica)</li>
          <li style="margin-bottom: 0;">Mantente atento a comunicaciones adicionales</li>
        </ol>
      </div>
      
      <p style="margin: 0 0 24px; color: #64748b;">
        Si tienes alguna pregunta o necesitas más información, escríbenos a 
        <a href="mailto:contacto@fundaciontraesol.cl" style="color: #1d4ed8;">contacto@fundaciontraesol.cl</a>
      </p>
    </div>
    
    <!-- Footer -->
    <div style="padding: 24px; background: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; color: #64748b; font-size: 14px;">
        Fundación Traesol
      </p>
      <p style="margin: 8px 0 0; color: #94a3b8; font-size: 12px;">
        Este correo fue enviado porque aceptaste una invitación a un operativo.
      </p>
    </div>
  </div>
</body>
</html>
`;

  try {
    const emailFrom = process.env.EMAIL_FROM || process.env.RESEND_FROM || "Fundación Traesol <notificaciones@mail.traesol.cl>";
    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: voluntario.email,
      subject: `¡Confirmado! ${operativo.titulo} - Fundación Traesol`,
      html,
    });

    if (error) {
      console.error("[invitaciones/emails] Error Resend:", error);
      return { success: false, error: error.message };
    }

    console.log(`[invitaciones/emails] Email aceptada enviado a ${voluntario.email}, id: ${data?.id}`);
    return { success: true, emailId: data?.id };
  } catch (err) {
    console.error("[invitaciones/emails] Error enviando email:", err);
    return { success: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

/**
 * Envía email de agradecimiento cuando un voluntario rechaza una invitación
 */
export async function sendInvitacionRechazadaEmail(
  voluntario: VoluntarioData,
  operativo: OperativoData
): Promise<{ success: boolean; error?: string; emailId?: string }> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[invitaciones/emails] RESEND_API_KEY no configurado");
    return { success: false, error: "Servicio de email no configurado" };
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; padding: 24px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: ${HEADER_GRADIENT}; padding: 32px 24px; text-align: center;">
      <a href="${SITE_URL}" target="_blank" rel="noopener" style="text-decoration: none;">
        <img src="${LOGO_URL}" alt="Traesol" width="120" height="40" style="display: inline-block; max-height: 40px; width: auto; border: 0; margin-bottom: 12px;" />
      </a>
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; line-height: 1.3;">Gracias por tu respuesta</h1>
    </div>
    
    <!-- Contenido -->
    <div style="padding: 32px 24px; color: #334155; font-size: 16px; line-height: 1.6;">
      <p style="margin: 0 0 16px;">
        Hola <strong>${voluntario.nombre} ${voluntario.apellido}</strong>,
      </p>
      
      <p style="margin: 0 0 24px;">
        Hemos recibido tu respuesta indicando que no podrás participar en el operativo 
        <strong>${operativo.titulo}</strong>. Entendemos que no siempre es posible participar 
        y agradecemos que nos hayas informado.
      </p>
      
      <p style="margin: 0 0 24px;">
        Esperamos poder contar contigo en futuras oportunidades. Seguiremos enviándote 
        invitaciones a los próximos operativos que se ajusten a tu perfil.
      </p>
      
      <p style="margin: 0 0 24px; color: #64748b;">
        Si cambiaste de opinión o tienes alguna consulta, escríbenos a 
        <a href="mailto:contacto@fundaciontraesol.cl" style="color: #1d4ed8;">contacto@fundaciontraesol.cl</a>
      </p>
      
      <p style="margin: 0; font-weight: 500;">
        ¡Gracias por ser parte de la comunidad Traesol!
      </p>
    </div>
    
    <!-- Footer -->
    <div style="padding: 24px; background: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0; color: #64748b; font-size: 14px;">
        Fundación Traesol
      </p>
    </div>
  </div>
</body>
</html>
`;

  try {
    const emailFrom = process.env.EMAIL_FROM || process.env.RESEND_FROM || "Fundación Traesol <notificaciones@mail.traesol.cl>";
    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: voluntario.email,
      subject: `Gracias por tu respuesta - Fundación Traesol`,
      html,
    });

    if (error) {
      console.error("[invitaciones/emails] Error Resend:", error);
      return { success: false, error: error.message };
    }

    console.log(`[invitaciones/emails] Email rechazada enviado a ${voluntario.email}, id: ${data?.id}`);
    return { success: true, emailId: data?.id };
  } catch (err) {
    console.error("[invitaciones/emails] Error enviando email:", err);
    return { success: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}
