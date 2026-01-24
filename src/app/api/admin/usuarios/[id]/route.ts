// src/app/api/admin/usuarios/[id]/route.ts
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import crypto from "node:crypto";

type RouteParams = { params: Promise<{ id: string }> };

// Tipos locales
type AdminUser = {
  id: string;
  email: string;
  role: string;
  enabled: boolean;
  force_password_change: boolean;
  created_at: string;
};

/**
 * PATCH /api/admin/usuarios/[id]
 * Actualizar usuario (role, enabled, reset password)
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await getAdminSession();
  
  if (!session.allowed || !session.isSuperAdmin) {
    return NextResponse.json(
      { ok: false, error: "No autorizado" },
      { status: 403 }
    );
  }

  const { id } = await params;
  
  try {
    const body = await req.json();
    const updateData: Record<string, any> = {};

    // Actualizar rol
    if (body.role !== undefined) {
      const validRoles = ["admin", "editor", "viewer"];
      if (!validRoles.includes(body.role)) {
        return NextResponse.json(
          { ok: false, error: `Rol inválido. Usar: ${validRoles.join(", ")}` },
          { status: 400 }
        );
      }
      updateData.role = body.role;
    }

    // Habilitar/deshabilitar
    if (body.enabled !== undefined) {
      updateData.enabled = Boolean(body.enabled);
    }

    // Reset password
    if (body.newPassword) {
      if (body.newPassword.length < 6) {
        return NextResponse.json(
          { ok: false, error: "Contraseña debe tener al menos 6 caracteres." },
          { status: 400 }
        );
      }
      updateData.password_hash = crypto.createHash("sha256").update(body.newPassword).digest("hex");
      updateData.force_password_change = true;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { ok: false, error: "No hay campos para actualizar." },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error: updateError } = await (supabaseService as any)
      .from("admin_users")
      .update(updateData)
      .eq("id", id)
      .select("id, email, role, enabled, force_password_change, created_at")
      .single() as { data: AdminUser | null; error: any };

    if (updateError) {
      console.error("Error actualizando usuario:", updateError);
      return NextResponse.json(
        { ok: false, error: "Error al actualizar usuario." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Usuario actualizado correctamente.",
      user: updated,
    });
  } catch (err) {
    console.error("Error en PATCH /api/admin/usuarios/[id]:", err);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/usuarios/[id]
 * Eliminar usuario (no se puede auto-eliminar)
 */
export async function DELETE(req: Request, { params }: RouteParams) {
  const session = await getAdminSession();
  
  if (!session.allowed || !session.isSuperAdmin) {
    return NextResponse.json(
      { ok: false, error: "No autorizado" },
      { status: 403 }
    );
  }

  const { id } = await params;

  // Verificar que no se está auto-eliminando
  const { data: targetUser } = await supabaseService
    .from("admin_users" as any)
    .select("email")
    .eq("id", id)
    .maybeSingle() as { data: { email: string } | null };

  if (targetUser?.email === session.email) {
    return NextResponse.json(
      { ok: false, error: "No puedes eliminar tu propio usuario." },
      { status: 400 }
    );
  }

  const { error: deleteError } = await supabaseService
    .from("admin_users" as any)
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("Error eliminando usuario:", deleteError);
    return NextResponse.json(
      { ok: false, error: "Error al eliminar usuario." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "Usuario eliminado correctamente.",
  });
}
