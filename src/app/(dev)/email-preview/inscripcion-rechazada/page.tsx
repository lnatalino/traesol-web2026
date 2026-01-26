// src/app/(dev)/email-preview/inscripcion-rechazada/page.tsx
// Preview del email de inscripción rechazada

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function InscripcionRechazadaPreview() {
  if (process.env.NODE_ENV === "production") {
    redirect("/");
  }

  const HEADER_GRADIENT = "linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)";
  const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL || 
    "https://alohwvivujbhlpqunad.supabase.co/storage/v1/object/public/public/logo-traesol.png";
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fundaciontraesol.cl";
  
  // Mock data
  const voluntario = { nombre: "Laura", apellido: "Soto" };
  const operativo = { nombre: "Operativo Dental Comunitario" };

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
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; line-height: 1.3;">Actualización de tu inscripción</h1>
    </div>
    
    <!-- Contenido -->
    <div style="padding: 32px 24px; color: #334155; font-size: 16px; line-height: 1.6;">
      <p style="margin: 0 0 16px;">
        Hola <strong>${voluntario.nombre} ${voluntario.apellido}</strong>,
      </p>
      
      <p style="margin: 0 0 24px;">
        Lamentamos informarte que en esta ocasión no hemos podido incluirte en el 
        <strong>${operativo.nombre}</strong>.
      </p>
      
      <!-- Info box -->
      <div style="background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 0 8px 8px 0; padding: 16px 20px; margin-bottom: 24px;">
        <p style="color: #991b1b; font-size: 14px; line-height: 1.5; margin: 0;">
          Esto no refleja tu valor como profesional. Simplemente, los cupos disponibles 
          fueron asignados según criterios específicos del operativo.
        </p>
      </div>
      
      <p style="margin: 0 0 16px;">
        Te animamos a seguir postulando a futuros operativos. Tu perfil queda activo 
        en nuestra base de datos y te contactaremos cuando surjan nuevas oportunidades.
      </p>
      
      <!-- Info positiva -->
      <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h3 style="color: #166534; margin: 0 0 12px; font-size: 16px;">💚 Próximas oportunidades</h3>
        <p style="color: #334155; margin: 0;">
          Mantente atento a tu email. Te notificaremos de próximos operativos donde 
          tu especialidad sea requerida.
        </p>
      </div>
      
      <p style="margin: 0 0 24px; color: #64748b;">
        Agradecemos tu interés en participar con Fundación Traesol.
      </p>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin-bottom: 16px;">
        <a href="${SITE_URL}/operativos" 
           style="display: inline-block; background: linear-gradient(135deg, #1d4ed8, #0ea5e9); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Ver operativos disponibles
        </a>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 12px; margin: 0 0 8px; line-height: 1.5;">
        Gracias por tu compromiso con nuestra misión.
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
          <h1 style={{ color: "white", fontSize: "18px", margin: 0 }}>Preview: Inscripción Rechazada</h1>
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
