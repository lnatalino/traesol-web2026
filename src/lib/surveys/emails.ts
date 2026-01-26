// src/lib/surveys/emails.ts
// Emails para el sistema de encuestas de satisfacción

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || process.env.RESEND_FROM || "Fundación Traesol <notificaciones@mail.traesol.cl>";
const REPLY_TO = "contacto@fundaciontraesol.cl";
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fundaciontraesol.cl";

interface SendSurveyEmailParams {
  to: string;
  nombreDestinatario: string;
  operativoNombre: string;
  operativoFecha: string | null;
  surveyToken: string;
  tipoEncuesta: "VOLUNTARIOS_OPERATIVO" | "PACIENTES_QUIRURGICO";
}

export async function sendSurveyEmail(params: SendSurveyEmailParams): Promise<{
  success: boolean;
  error?: string;
}> {
  const { to, nombreDestinatario, operativoNombre, operativoFecha, surveyToken, tipoEncuesta } = params;

  const surveyUrl = `${BASE_URL}/encuesta?token=${surveyToken}`;
  
  const esVoluntario = tipoEncuesta === "VOLUNTARIOS_OPERATIVO";
  const subject = esVoluntario 
    ? `Tu opinión es importante - ${operativoNombre}`
    : `Cuéntanos tu experiencia - ${operativoNombre}`;

  const fechaFormateada = operativoFecha 
    ? new Date(operativoFecha).toLocaleDateString("es-CL", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    : null;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">
                ${esVoluntario ? "¡Gracias por ser parte!" : "¡Gracias por confiar en nosotros!"}
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                Fundación Traesol
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hola <strong>${nombreDestinatario}</strong>,
              </p>
              
              ${esVoluntario ? `
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Queremos agradecerte por tu participación como voluntario/a en <strong>${operativoNombre}</strong>${fechaFormateada ? ` (${fechaFormateada})` : ""}.
              </p>
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Tu trabajo y dedicación hacen posible que podamos llevar atención de salud a quienes más lo necesitan.
              </p>
              ` : `
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Esperamos que tu experiencia en <strong>${operativoNombre}</strong>${fechaFormateada ? ` (${fechaFormateada})` : ""} haya sido positiva y que te encuentres bien en tu proceso de recuperación.
              </p>
              `}
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                <strong>Tu opinión es muy valiosa para nosotros.</strong> Nos ayuda a mejorar y seguir creciendo. 
                Te invitamos a completar una breve encuesta que tomará solo unos minutos.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${surveyUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);">
                      Completar Encuesta
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0; text-align: center;">
                O copia y pega este enlace en tu navegador:<br>
                <a href="${surveyUrl}" style="color: #3b82f6; word-break: break-all;">${surveyUrl}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                      ¿Tienes alguna pregunta?
                    </p>
                    <p style="color: #374151; font-size: 14px; margin: 0;">
                      Escríbenos a <a href="mailto:contacto@fundaciontraesol.cl" style="color: #3b82f6;">contacto@fundaciontraesol.cl</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="text-align: center; padding-top: 20px;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                      © ${new Date().getFullYear()} Fundación Traesol. Todos los derechos reservados.
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 5px 0 0 0;">
                      Este enlace es personal y expira en 30 días.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      replyTo: REPLY_TO,
      subject,
      html: htmlContent
    });

    if (error) {
      console.error("[surveys/emails] Error enviando email:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[surveys/emails] Error inesperado:", err);
    return { success: false, error: String(err) };
  }
}
