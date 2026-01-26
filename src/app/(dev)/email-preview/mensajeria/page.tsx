// src/app/(dev)/email-preview/mensajeria/page.tsx
// Preview del email de mensajería masiva

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function MensajeriaPreview() {
  if (process.env.NODE_ENV === "production") {
    redirect("/");
  }

  const HEADER_GRADIENT = "linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)";
  const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL || 
    "https://alohwvivujbhlpqunad.supabase.co/storage/v1/object/public/public/logo-traesol.png";
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fundaciontraesol.cl";
  
  // Mock data
  const asunto = "Importante: Actualización de protocolos 2026";
  const mensaje = `Estimados voluntarios,

Les informamos que hemos actualizado nuestros protocolos de seguridad para el año 2026.

<strong>Principales cambios:</strong>
• Nuevo formulario de registro digital
• Actualización de certificados médicos
• Nuevos requisitos de documentación

Les pedimos revisar el documento adjunto y confirmar su lectura antes del 15 de febrero.

Gracias por su compromiso con Fundación Traesol.`;

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
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; line-height: 1.3;">${asunto}</h1>
    </div>
    
    <!-- Contenido -->
    <div style="padding: 32px 24px; color: #334155; font-size: 16px; line-height: 1.7;">
      ${mensaje.split('\n').map(line => `<p style="margin: 0 0 12px;">${line || '&nbsp;'}</p>`).join('')}
    </div>
    
    <!-- Footer -->
    <div style="background: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 12px; margin: 0 0 8px; line-height: 1.5;">
        Este mensaje fue enviado desde el Panel de Administración de Traesol.
      </p>
      <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px;">
        ¿Dudas? Escríbenos a <a href="mailto:contacto@fundaciontraesol.cl" style="color: #0b4dbf; text-decoration: none;">contacto@fundaciontraesol.cl</a>
      </p>
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
        © ${new Date().getFullYear()} Fundación Traesol. Todos los derechos reservados.
      </p>
    </div>
  </div>
</body>
</html>`;

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "24px", background: "#1e293b", minHeight: "100vh" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h1 style={{ color: "white", fontSize: "18px", margin: 0 }}>Preview: Mensajería Masiva</h1>
          <a href="/email-preview" style={{ color: "#60a5fa", textDecoration: "none", fontSize: "14px" }}>
            ← Volver al listado
          </a>
        </div>
        <div 
          style={{ borderRadius: "8px", overflow: "hidden", boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }}
          dangerouslySetInnerHTML={{ __html: html }} 
        />
      </div>
    </div>
  );
}
