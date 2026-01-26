// src/app/api/admin/auth/request-reset/route.ts
import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseService";
import { sendMail } from "@/lib/email";
import crypto from "node:crypto";

const RATE_LIMIT_MINUTES = 2; // mínimo entre solicitudes por email
const CODE_VALIDITY_MINUTES = 15;

// Tipos locales para tablas no tipadas en database.types.ts
type AdminUser = {
  id: string;
  email: string;
  enabled: boolean;
};

type PasswordResetCode = {
  created_at: string;
};

/**
 * POST /api/admin/auth/request-reset
 * Body: { email: string }
 * 
 * Genera código OTP de 6 dígitos, lo almacena hasheado y envía email.
 * Respuesta genérica para evitar enumeración de emails.
 */
export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "Email inválido" },
        { status: 400 }
      );
    }

    // Verificar si el usuario existe y está habilitado
    const { data: user } = await supabaseService
      .from("admin_users" as any)
      .select("id, enabled")
      .eq("email", normalizedEmail)
      .maybeSingle() as { data: AdminUser | null };

    // Si no existe o no está habilitado, responder igual para evitar enumeración
    if (!user || user.enabled === false) {
      // Simular delay para evitar timing attacks
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 500));
      return NextResponse.json({ ok: true, message: "Si el email existe, recibirás un código." });
    }

    // Rate limiting: verificar última solicitud
    const { data: recentCode } = await supabaseService
      .from("password_reset_codes" as any)
      .select("created_at")
      .eq("email", normalizedEmail)
      .is("used_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle() as { data: PasswordResetCode | null };

    if (recentCode) {
      const createdAt = new Date(recentCode.created_at);
      const diffMinutes = (Date.now() - createdAt.getTime()) / 60000;
      if (diffMinutes < RATE_LIMIT_MINUTES) {
        return NextResponse.json(
          { ok: false, error: `Espera ${Math.ceil(RATE_LIMIT_MINUTES - diffMinutes)} minuto(s) antes de solicitar otro código.` },
          { status: 429 }
        );
      }
    }

    // Generar código de 6 dígitos
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = crypto.createHash("sha256").update(code).digest("hex");
    const expiresAt = new Date(Date.now() + CODE_VALIDITY_MINUTES * 60 * 1000);

    // Obtener IP y User-Agent
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.headers.get("x-real-ip") || null;
    const userAgent = req.headers.get("user-agent") || null;

    // Insertar código en DB
    const { error: insertError } = await supabaseService
      .from("password_reset_codes" as any)
      .insert({
        email: normalizedEmail,
        code_hash: codeHash,
        expires_at: expiresAt.toISOString(),
        ip,
        user_agent: userAgent,
      } as any);

    if (insertError) {
      console.error("Error insertando código:", insertError);
      return NextResponse.json(
        { ok: false, error: "Error al procesar solicitud." },
        { status: 500 }
      );
    }

    // Enviar email con el código usando el diseño unificado
    const emailHtml = buildResetCodeEmail(code, CODE_VALIDITY_MINUTES);

    await sendMail({
      to: normalizedEmail,
      subject: `Tu código de recuperación: ${code}`,
      html: emailHtml,
      preheader: `Código: ${code} - Válido por ${CODE_VALIDITY_MINUTES} minutos`,
    });

    return NextResponse.json({ ok: true, message: "Si el email existe, recibirás un código." });
  } catch (err) {
    console.error("Error en request-reset:", err);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

/**
 * Genera el HTML del email de código de recuperación con diseño unificado
 */
function buildResetCodeEmail(code: string, validityMinutes: number): string {
  const HEADER_GRADIENT = "linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)";
  const SUPPORT_EMAIL = "contacto@fundaciontraesol.cl";
  const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL || 
    "https://alohwvivujbhlpqunad.supabase.co/storage/v1/object/public/public/logo-traesol.png";
  const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://fundaciontraesol.cl").replace(/\/+$/, "");
  const year = new Date().getFullYear();

  return `
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
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; line-height: 1.3;">Código de recuperación</h1>
    </div>
    
    <!-- Contenido -->
    <div style="padding: 32px 24px; color: #334155; font-size: 16px; line-height: 1.6;">
      <p style="margin: 0 0 16px;">
        Has solicitado restablecer tu contraseña en el Panel Admin de Traesol.
      </p>
      
      <!-- Código destacado -->
      <div style="background: #f1f5f9; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <p style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 12px;">
          Tu código de verificación
        </p>
        <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #0f172a; font-family: monospace;">${code}</span>
      </div>
      
      <!-- Aviso de expiración -->
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
        <p style="color: #92400e; font-size: 14px; line-height: 1.5; margin: 0;">
          <strong>⏱ Este código expira en ${validityMinutes} minutos.</strong><br/>
          Si no solicitaste este código, ignora este mensaje.
        </p>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 12px; margin: 0 0 8px; line-height: 1.5;">
        Este es un mensaje automático de seguridad.
      </p>
      <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px;">
        ¿Dudas? Escríbenos a <a href="mailto:${SUPPORT_EMAIL}" style="color: #0b4dbf; text-decoration: none;">${SUPPORT_EMAIL}</a>
      </p>
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
        © ${year} Fundación Traesol. Todos los derechos reservados.
      </p>
    </div>
  </div>
</body>
</html>`;
}
