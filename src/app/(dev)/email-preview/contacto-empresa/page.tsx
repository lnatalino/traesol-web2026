// src/app/(dev)/email-preview/contacto-empresa/page.tsx
// Preview del email de contacto desde empresa

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function ContactoEmpresaPreview() {
  if (process.env.NODE_ENV === "production") {
    redirect("/");
  }

  const HEADER_GRADIENT = "linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)";
  const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL || 
    "https://alohwvivujbhlpqunad.supabase.co/storage/v1/object/public/public/logo-traesol.png";
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fundaciontraesol.cl";
  
  // Mock data
  const empresa = "Laboratorio Dental ProDent SpA";
  const contacto = "Felipe Morales";
  const email = "felipe.morales@prodent.cl";
  const telefono = "+56 9 8765 4321";
  const mensaje = `Estimados,

Somos un laboratorio dental con más de 15 años de experiencia en el mercado chileno. Nos interesa conocer más sobre las oportunidades de colaboración con Fundación Traesol.

Específicamente, nos gustaría explorar:
- Donación de insumos dentales
- Participación en operativos con nuestro equipo técnico
- Posibles alianzas estratégicas

Quedamos atentos a su respuesta para coordinar una reunión.

Saludos cordiales.`;

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
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; line-height: 1.3;">🏢 Nuevo contacto de empresa</h1>
    </div>
    
    <!-- Contenido -->
    <div style="padding: 32px 24px; color: #334155; font-size: 16px; line-height: 1.6;">
      <p style="margin: 0 0 24px; color: #64748b;">
        Se ha recibido un nuevo mensaje de contacto desde el formulario de empresas.
      </p>
      
      <!-- Info del contacto -->
      <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h3 style="color: #0f172a; margin: 0 0 16px; font-size: 18px;">📋 Datos del contacto</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #64748b; padding: 8px 0; width: 100px; vertical-align: top;">Empresa:</td>
            <td style="color: #334155; font-weight: 600; padding: 8px 0;">${empresa}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 8px 0; vertical-align: top;">Contacto:</td>
            <td style="color: #334155; font-weight: 500; padding: 8px 0;">${contacto}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 8px 0; vertical-align: top;">Email:</td>
            <td style="padding: 8px 0;">
              <a href="mailto:${email}" style="color: #1d4ed8; text-decoration: none;">${email}</a>
            </td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 8px 0; vertical-align: top;">Teléfono:</td>
            <td style="color: #334155; padding: 8px 0;">${telefono}</td>
          </tr>
        </table>
      </div>
      
      <!-- Mensaje -->
      <div style="background: #fffbeb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h3 style="color: #92400e; margin: 0 0 12px; font-size: 16px;">💬 Mensaje</h3>
        <div style="color: #334155; white-space: pre-wrap; font-size: 14px; line-height: 1.6;">${mensaje}</div>
      </div>
      
      <!-- CTA -->
      <div style="text-align: center; margin-bottom: 16px;">
        <a href="mailto:${email}?subject=Re: Contacto desde Fundación Traesol" 
           style="display: inline-block; background: linear-gradient(135deg, #1d4ed8, #0ea5e9); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Responder al contacto
        </a>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 12px; margin: 0 0 8px; line-height: 1.5;">
        Este mensaje fue generado automáticamente desde el formulario de contacto de empresas.
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
          <h1 style={{ color: "white", fontSize: "18px", margin: 0 }}>Preview: Contacto Empresa</h1>
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
