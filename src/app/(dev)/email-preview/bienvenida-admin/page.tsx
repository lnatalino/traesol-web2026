// src/app/(dev)/email-preview/bienvenida-admin/page.tsx
// Preview del email de bienvenida admin

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function BienvenidaAdminPreview() {
  if (process.env.NODE_ENV === "production") {
    redirect("/");
  }

  const HEADER_GRADIENT = "linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)";
  const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL || 
    "https://alohwvivujbhlpqunad.supabase.co/storage/v1/object/public/public/logo-traesol.png";
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://fundaciontraesol.cl";
  
  // Mock data
  const firstName = "María";
  const email = "maria@ejemplo.cl";
  const tempPassword = "Tr43s0l2026!";
  const loginUrl = `${SITE_URL}/login`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: ${HEADER_GRADIENT}; padding: 32px 24px; text-align: center;">
      <img src="${LOGO_URL}" alt="Traesol" width="120" height="40" style="display: inline-block; max-height: 40px; width: auto; border: 0; margin-bottom: 12px;" />
      <h1 style="color: white; margin: 0; font-size: 24px;">¡Bienvenido/a a Traesol!</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 32px 24px;">
      <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
        Hola <strong>${firstName}</strong>,
      </p>
      
      <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        Se ha creado tu cuenta de administrador en el panel de Fundación Traesol.
      </p>
      
      <!-- Credentials box -->
      <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px;">
          Tus credenciales de acceso
        </p>
        <table style="width: 100%;">
          <tr>
            <td style="color: #64748b; padding: 4px 0; font-size: 14px;">Usuario:</td>
            <td style="color: #0f172a; font-weight: 600; font-size: 14px;">${email}</td>
          </tr>
          <tr>
            <td style="color: #64748b; padding: 4px 0; font-size: 14px;">Contraseña temporal:</td>
            <td style="color: #0f172a; font-weight: 600; font-size: 14px; font-family: monospace; letter-spacing: 0.1em;">${tempPassword}</td>
          </tr>
        </table>
      </div>
      
      <!-- Warning -->
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
        <p style="color: #92400e; font-size: 14px; line-height: 1.5; margin: 0;">
          <strong>Importante:</strong> Al ingresar por primera vez, se te pedirá cambiar tu contraseña por una personal y segura.
        </p>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${loginUrl}" style="display: inline-block; background: #1d4ed8; color: white; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
          Ingresar al Panel Admin
        </a>
      </div>
      
      <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin: 0;">
        Si tienes problemas para acceder, contacta al administrador del sistema.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 12px; margin: 0 0 8px; line-height: 1.5;">
        Este es un correo automático de Fundación Traesol.
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
          <h1 style={{ color: "white", fontSize: "18px", margin: 0 }}>Preview: Bienvenida Admin</h1>
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
