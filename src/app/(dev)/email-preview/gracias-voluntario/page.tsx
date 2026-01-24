// src/app/(dev)/email-preview/gracias-voluntario/page.tsx
// Preview del email de agradecimiento a voluntario

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function GraciasVoluntarioPreview() {
  if (process.env.NODE_ENV === "production") {
    redirect("/");
  }

  const HEADER_GRADIENT = "linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)";
  const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL || 
    "https://alohwvivujbhlpqunad.supabase.co/storage/v1/object/public/public/logo-traesol.png";
  const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://fundaciontraesol.cl";
  
  // Mock data
  const nombre = "Carlos";
  const apellido = "Mendoza";

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
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; line-height: 1.3;">¡Gracias por postular!</h1>
    </div>
    
    <!-- Contenido -->
    <div style="padding: 32px 24px; color: #334155; font-size: 16px; line-height: 1.6;">
      <p style="margin: 0 0 16px;">
        Hola <strong>${nombre} ${apellido}</strong>,
      </p>
      
      <p style="margin: 0 0 16px;">
        Hemos recibido correctamente tu postulación como voluntario en Fundación Traesol.
        Tu interés en ayudar significa mucho para nosotros y para las comunidades que apoyamos.
      </p>
      
      <!-- Info box -->
      <div style="background: #eff6ff; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h3 style="color: #1d4ed8; margin: 0 0 12px; font-size: 16px;">📋 ¿Qué sigue?</h3>
        <ul style="margin: 0; padding-left: 20px; color: #334155;">
          <li style="margin-bottom: 8px;">Revisaremos tu perfil y experiencia</li>
          <li style="margin-bottom: 8px;">Te contactaremos cuando haya un operativo compatible</li>
          <li style="margin-bottom: 0;">Recibirás una invitación con todos los detalles</li>
        </ul>
      </div>
      
      <p style="margin: 0 0 24px;">
        Mientras tanto, te invitamos a seguirnos en redes sociales para estar al tanto de nuestras actividades.
      </p>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin-bottom: 16px;">
        <a href="${SITE_URL}/novedades" 
           style="display: inline-block; background: linear-gradient(135deg, #1d4ed8, #0ea5e9); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Ver novedades
        </a>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 12px; margin: 0 0 8px; line-height: 1.5;">
        Este correo fue enviado porque te registraste como voluntario en nuestra plataforma.
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
          <h1 style={{ color: "white", fontSize: "18px", margin: 0 }}>Preview: Gracias Voluntario</h1>
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
