// src/app/api/admin/auth/confirm-reset/route.ts
import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseService";
import crypto from "node:crypto";

const MIN_PASSWORD_LENGTH = 8;

// Tipos locales para tablas no tipadas en database.types.ts
type ResetCode = {
  id: string;
  email: string;
};

/**
 * POST /api/admin/auth/confirm-reset
 * Body: { email: string, code: string, newPassword: string }
 * 
 * Valida el código OTP y actualiza la contraseña del usuario.
 */
export async function POST(req: Request) {
  try {
    const { email, code, newPassword } = await req.json();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedCode = String(code || "").trim();

    // Validaciones básicas
    if (!normalizedEmail || !normalizedCode || !newPassword) {
      return NextResponse.json(
        { ok: false, error: "Faltan campos requeridos." },
        { status: 400 }
      );
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { ok: false, error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` },
        { status: 400 }
      );
    }

    // Hashear el código ingresado para comparar
    const codeHash = crypto.createHash("sha256").update(normalizedCode).digest("hex");

    // Buscar código válido (no usado, no expirado)
    const now = new Date().toISOString();
    const { data: resetCode, error: fetchError } = await supabaseService
      .from("password_reset_codes" as any)
      .select("id, email")
      .eq("email", normalizedEmail)
      .eq("code_hash", codeHash)
      .is("used_at", null)
      .gte("expires_at", now)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle() as { data: ResetCode | null; error: any };

    if (fetchError) {
      console.error("Error buscando código:", fetchError);
      return NextResponse.json(
        { ok: false, error: "Error al validar código." },
        { status: 500 }
      );
    }

    if (!resetCode) {
      return NextResponse.json(
        { ok: false, error: "Código inválido o expirado." },
        { status: 400 }
      );
    }

    // Hashear nueva contraseña (SHA-256, igual que en simple-login)
    const newPasswordHash = crypto.createHash("sha256").update(newPassword).digest("hex");

    // Actualizar contraseña del usuario y quitar force_password_change
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabaseService as any)
      .from("admin_users")
      .update({ 
        password_hash: newPasswordHash,
        force_password_change: false,
      })
      .eq("email", normalizedEmail);

    if (updateError) {
      console.error("Error actualizando contraseña:", updateError);
      return NextResponse.json(
        { ok: false, error: "Error al actualizar contraseña." },
        { status: 500 }
      );
    }

    // Marcar código como usado
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseService as any)
      .from("password_reset_codes")
      .update({ used_at: now })
      .eq("id", resetCode.id);

    // Invalidar todos los códigos anteriores del mismo email
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabaseService as any)
      .from("password_reset_codes")
      .update({ used_at: now })
      .eq("email", normalizedEmail)
      .is("used_at", null);

    return NextResponse.json({ 
      ok: true, 
      message: "Contraseña actualizada correctamente." 
    });
  } catch (err) {
    console.error("Error en confirm-reset:", err);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
