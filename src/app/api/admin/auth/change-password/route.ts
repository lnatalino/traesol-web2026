// src/app/api/admin/auth/change-password/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseService } from "@/lib/supabaseService";
import crypto from "node:crypto";

const MIN_PASSWORD_LENGTH = 8;

// Tipos locales para tablas no tipadas en database.types.ts
type AdminUser = {
  id: string;
  role: string;
  enabled: boolean;
  force_password_change: boolean;
};

/**
 * POST /api/admin/auth/change-password
 * Body: { currentPassword: string, newPassword: string }
 * 
 * Permite cambiar la contraseña cuando force_password_change está activo.
 * Usa la cookie traesol-pending-email para identificar al usuario.
 */
export async function POST(req: Request) {
  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
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

    // Obtener email de la cookie temporal
    const cookieStore = await cookies();
    const email = cookieStore.get("traesol-pending-email")?.value;

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Sesión expirada. Vuelve a iniciar sesión." },
        { status: 401 }
      );
    }

    // Verificar contraseña actual
    const currentHash = crypto.createHash("sha256").update(currentPassword).digest("hex");
    
    const { data: user, error: fetchError } = await supabaseService
      .from("admin_users" as any)
      .select("id, role, enabled, force_password_change")
      .eq("email", email)
      .eq("password_hash", currentHash)
      .maybeSingle() as { data: AdminUser | null; error: any };

    if (fetchError) {
      console.error("Error verificando usuario:", fetchError);
      return NextResponse.json(
        { ok: false, error: "Error al verificar credenciales." },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Contraseña actual incorrecta." },
        { status: 400 }
      );
    }

    if (!user.enabled) {
      return NextResponse.json(
        { ok: false, error: "Usuario deshabilitado." },
        { status: 403 }
      );
    }

    // Actualizar contraseña
    const newPasswordHash = crypto.createHash("sha256").update(newPassword).digest("hex");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabaseService as any)
      .from("admin_users")
      .update({
        password_hash: newPasswordHash,
        force_password_change: false,
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error actualizando contraseña:", updateError);
      return NextResponse.json(
        { ok: false, error: "Error al actualizar contraseña." },
        { status: 500 }
      );
    }

    // Eliminar cookie temporal y establecer cookies de sesión
    cookieStore.delete({ name: "traesol-pending-email", path: "/" });
    
    cookieStore.set("traesol-role", String(user.role || "viewer"), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 horas
    });
    cookieStore.set("traesol-email", email, {
      httpOnly: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return NextResponse.json({
      ok: true,
      message: "Contraseña actualizada correctamente.",
    });
  } catch (err) {
    console.error("Error en change-password:", err);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}
