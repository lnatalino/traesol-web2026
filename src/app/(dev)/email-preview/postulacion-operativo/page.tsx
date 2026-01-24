// src/app/(dev)/email-preview/postulacion-operativo/page.tsx
// Preview del email de postulación a operativo

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function PostulacionOperativoPreview() {
  if (process.env.NODE_ENV === "production") {
    redirect("/");
  }

  const HEADER_GRADIENT = "linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)";
  const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL || 
    "https://alohwvivujbhlpqunad.supabase.co/storage/v1/object/public/public/logo-traesol.png";
  const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://fundaciontraesol.cl";
  
  // Mock data
  const voluntario = { nombre: "Catalina", apellido: "Vega" };
  const operativo = {
    nombre: "Operativo Dental Rural",
    ubicacion: "Localidad de Melipeuco, Región de La Araucanía",
    fecha_inicio: "2026-04-10",
    fecha_fin: "2026-04-12"
  };

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
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; line-height: 1.3;">📩 Postulación recibida</h1>
    </div>
    
    <!-- Contenido -->
    <div style="padding: 32px 24px; color: #334155; font-size: 16px; line-height: 1.6;">
      <p style="margin: 0 0 16px;">
        Hola <strong>${voluntario.nombre} ${voluntario.apellido}</strong>,
      </p>
      
      <p style="margin: 0 0 24px;">
        Hemos recibido tu postulación para participar como voluntario/a en el siguiente operativo:
      </p>
      
      <!-- Info del operativo -->
      <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h3 style="color: #0f172a; margin: 0 0 16px; font-size: 18px;">📍 ${operativo.nombre}</h3>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #64748b; padding: 6px 0; width: 100px;">Ubicación:</td>
            <td style="color: #334155; font-weight: 500; padding: 6px 0;">${operativo.ubicacion}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 6px 0;">Inicio:</td>
            <td style="color: #334155; font-weight: 500; padding: 6px 0;">${formatDate(operativo.fecha_inicio)}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 6px 0;">Término:</td>
            <td style="color: #334155; font-weight: 500; padding: 6px 0;">${formatDate(operativo.fecha_fin)}</td>
          </tr>
        </table>
      </div>
      
      <!-- Estado de la postulación -->
      <div style="background: #eff6ff; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; margin-bottom: 12px;">
          <span style="display: inline-block; width: 12px; height: 12px; background: #f59e0b; border-radius: 50%; margin-right: 10px;"></span>
          <span style="color: #1e40af; font-weight: 600;">Estado: En revisión</span>
        </div>
        <p style="color: #334155; font-size: 14px; margin: 0; line-height: 1.5;">
          Tu postulación está siendo evaluada por nuestro equipo. 
          Te notificaremos por email cuando tengamos una respuesta.
        </p>
      </div>
      
      <p style="margin: 0 0 24px; color: #64748b; font-size: 14px;">
        Agradecemos tu interés en participar con Fundación Traesol. 
        Si tienes alguna consulta, no dudes en contactarnos.
      </p>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin-bottom: 16px;">
        <a href="${SITE_URL}/operativos" 
           style="display: inline-block; background: linear-gradient(135deg, #1d4ed8, #0ea5e9); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Ver más operativos
        </a>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 12px; margin: 0 0 8px; line-height: 1.5;">
        Este correo fue enviado porque postulaste a un operativo en nuestra plataforma.
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
          <h1 style={{ color: "white", fontSize: "18px", margin: 0 }}>Preview: Postulación a Operativo</h1>
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
