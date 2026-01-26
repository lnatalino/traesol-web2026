// src/app/(dev)/email-preview/confirmacion-quirurgica/page.tsx
// Preview del email de confirmación quirúrgica

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function ConfirmacionQuirurgicaPreview() {
  if (process.env.NODE_ENV === "production") {
    redirect("/");
  }

  const HEADER_GRADIENT = "linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)";
  const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL || 
    "https://alohwvivujbhlpqunad.supabase.co/storage/v1/object/public/public/logo-traesol.png";
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fundaciontraesol.cl";
  
  // Mock data
  const paciente = {
    nombre: "Roberto",
    apellido: "Fernández"
  };
  const operativo = {
    nombre: "Operativo Quirúrgico Oftalmológico",
    fecha: "2026-03-15",
    hora: "08:00",
    ubicacion: "Hospital Regional de Temuco"
  };
  const instrucciones = `• Presentarse en ayunas (8 horas sin comer ni beber)
• Traer cédula de identidad vigente
• Traer todos sus medicamentos actuales
• Venir acompañado de un adulto responsable
• No usar joyas, maquillaje ni esmalte de uñas
• Usar ropa cómoda y fácil de quitar`;

  const formatDate = (d: string) => new Date(d).toLocaleDateString("es-CL", { 
    weekday: "long", year: "numeric", month: "long", day: "numeric" 
  });

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
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; line-height: 1.3;">🏥 Confirmación de Cirugía</h1>
    </div>
    
    <!-- Contenido -->
    <div style="padding: 32px 24px; color: #334155; font-size: 16px; line-height: 1.6;">
      <p style="margin: 0 0 16px;">
        Estimado/a <strong>${paciente.nombre} ${paciente.apellido}</strong>,
      </p>
      
      <p style="margin: 0 0 24px;">
        Le confirmamos que ha sido programado/a para cirugía en el siguiente operativo:
      </p>
      
      <!-- Info del operativo -->
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h3 style="color: #166534; margin: 0 0 16px; font-size: 18px;">✅ ${operativo.nombre}</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #64748b; padding: 8px 0; width: 100px;">Fecha:</td>
            <td style="color: #334155; font-weight: 600; padding: 8px 0;">${formatDate(operativo.fecha)}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 8px 0;">Hora:</td>
            <td style="color: #334155; font-weight: 600; padding: 8px 0;">${operativo.hora} hrs</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 8px 0;">Lugar:</td>
            <td style="color: #334155; font-weight: 500; padding: 8px 0;">${operativo.ubicacion}</td>
          </tr>
        </table>
      </div>
      
      <!-- Instrucciones -->
      <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h3 style="color: #92400e; margin: 0 0 12px; font-size: 16px;">⚠️ Instrucciones importantes</h3>
        <div style="color: #78350f; font-size: 14px; line-height: 1.8; white-space: pre-wrap;">${instrucciones}</div>
      </div>
      
      <!-- Aviso de contacto -->
      <div style="background: #eff6ff; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px;">
        <p style="color: #1e40af; font-size: 14px; line-height: 1.5; margin: 0;">
          <strong>📞 ¿Tiene dudas o no puede asistir?</strong><br/>
          Contáctenos lo antes posible para reagendar o resolver sus consultas.
        </p>
      </div>
      
      <p style="margin: 0; color: #64748b; font-size: 14px;">
        Le deseamos una pronta recuperación.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 12px; margin: 0 0 8px; line-height: 1.5;">
        Este correo contiene información médica confidencial.
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
          <h1 style={{ color: "white", fontSize: "18px", margin: 0 }}>Preview: Confirmación Quirúrgica</h1>
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
