// src/app/api/admin/usuarios/route.ts
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import { sendMail } from "@/lib/email";
import crypto from "node:crypto";

// Tipos locales para tablas no tipadas
type AdminUser = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  enabled: boolean;
  force_password_change: boolean;
  created_at: string;
};

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://fundaciontraesol.cl").replace(/\/+$/, "");

/**
 * Genera una contraseña temporal segura de 12 caracteres
 */
function generateTempPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const all = upper + lower + digits;
  
  // Asegurar al menos 1 de cada tipo
  let password = "";
  password += upper[Math.floor(Math.random() * upper.length)];
  password += lower[Math.floor(Math.random() * lower.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  
  // Completar hasta 12 caracteres
  for (let i = password.length; i < 12; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }
  
  // Mezclar
  return password.split("").sort(() => Math.random() - 0.5).join("");
}

/**
 * GET /api/admin/usuarios
 * Lista todos los usuarios admin (solo superadmin)
 */
export async function GET() {
  const session = await getAdminSession();
  
  if (!session.allowed || !session.isSuperAdmin) {
    return NextResponse.json(
      { ok: false, error: "No autorizado" },
      { status: 403 }
    );
  }

  const { data, error } = await supabaseService
    .from("admin_users" as any)
    .select("id, email, first_name, last_name, role, enabled, force_password_change, created_at")
    .order("created_at", { ascending: false }) as { data: AdminUser[] | null; error: any };

  if (error) {
    console.error("Error listando usuarios:", error);
    return NextResponse.json(
      { ok: false, error: "Error al obtener usuarios." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, users: data });
}

/**
 * POST /api/admin/usuarios
 * Crear nuevo usuario admin (solo superadmin)
 * Body: { email: string, firstName: string, lastName: string, role: string }
 */
export async function POST(req: Request) {
  const session = await getAdminSession();
  
  if (!session.allowed || !session.isSuperAdmin) {
    return NextResponse.json(
      { ok: false, error: "No autorizado" },
      { status: 403 }
    );
  }

  try {
    const { email, firstName, lastName, role } = await req.json();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const trimmedFirstName = String(firstName || "").trim();
    const trimmedLastName = String(lastName || "").trim();

    // Validaciones
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "Email inválido." },
        { status: 400 }
      );
    }

    if (!trimmedFirstName || !trimmedLastName) {
      return NextResponse.json(
        { ok: false, error: "Nombre y apellido son requeridos." },
        { status: 400 }
      );
    }

    const validRoles = ["admin", "editor", "viewer"];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        { ok: false, error: `Rol inválido. Usar: ${validRoles.join(", ")}` },
        { status: 400 }
      );
    }

    // Verificar que no exista
    const { data: existing } = await supabaseService
      .from("admin_users" as any)
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle() as { data: { id: string } | null };

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Ya existe un usuario con ese email." },
        { status: 409 }
      );
    }

    // Generar contraseña temporal
    const tempPassword = generateTempPassword();
    const passwordHash = crypto.createHash("sha256").update(tempPassword).digest("hex");

    // Crear usuario con contraseña temporal
    const { data: newUser, error: insertError } = await supabaseService
      .from("admin_users" as any)
      .insert({
        email: normalizedEmail,
        first_name: trimmedFirstName,
        last_name: trimmedLastName,
        password_hash: passwordHash,
        role,
        enabled: true,
        force_password_change: true,
      } as any)
      .select("id, email, first_name, last_name, role, enabled, force_password_change, created_at")
      .single() as { data: AdminUser | null; error: any };

    if (insertError) {
      console.error("Error creando usuario:", insertError);
      return NextResponse.json(
        { ok: false, error: "Error al crear usuario." },
        { status: 500 }
      );
    }

    // Enviar email de bienvenida
    try {
      await sendWelcomeEmail({
        to: normalizedEmail,
        firstName: trimmedFirstName,
        tempPassword,
        loginUrl: `${SITE_URL}/login`,
      });
    } catch (emailError) {
      console.error("Error enviando email de bienvenida:", emailError);
      // No fallamos la creación si el email falla, pero lo logueamos
    }

    return NextResponse.json({
      ok: true,
      message: "Usuario creado correctamente.",
      user: newUser,
    });
  } catch (err) {
    console.error("Error en POST /api/admin/usuarios:", err);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

/**
 * Envía email de bienvenida con contraseña temporal
 */
async function sendWelcomeEmail({
  to,
  firstName,
  tempPassword,
  loginUrl,
}: {
  to: string;
  firstName: string;
  tempPassword: string;
  loginUrl: string;
}) {
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
    <div style="background: linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%); padding: 32px 24px; text-align: center;">
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
            <td style="color: #0f172a; font-weight: 600; font-size: 14px;">${to}</td>
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
      <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
        Este es un correo automático de Fundación Traesol.<br>
        Por favor, no respondas a este mensaje.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  await sendMail({
    to,
    subject: "Bienvenido/a al Panel Admin de Traesol - Credenciales de acceso",
    html,
    preheader: `Hola ${firstName}, aquí están tus credenciales de acceso al panel administrativo.`,
  });
}
