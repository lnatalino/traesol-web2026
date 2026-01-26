// src/app/api/admin/users/[id]/route.ts
// Operaciones sobre un usuario específico (ver, editar, eliminar)

import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";

type RouteParams = { params: Promise<{ id: string }> };

// =========================================================================
// GET - Obtener usuario por ID
// =========================================================================

export async function GET(req: Request, { params }: RouteParams) {
  const session = await getAdminSession();

  if (!session.allowed) {
    return NextResponse.json(
      { success: false, error: "No autorizado" },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    // Obtener usuario de Auth
    const { data: authData, error: authError } = await supabaseService.auth.admin.getUserById(id);

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Obtener perfil (tipo explícito porque user_profiles no está en tipos generados)
    type UserProfile = {
      first_name: string | null;
      last_name: string | null;
      rut: string | null;
      phone: string | null;
      birthdate: string | null;
      verified: boolean;
      enabled: boolean;
    };
    const { data: profile } = await supabaseService
      .from("user_profiles")
      .select("first_name, last_name, rut, phone, birthdate, verified, enabled")
      .eq("id", id)
      .single() as { data: UserProfile | null };

    // Obtener rol
    const { data: roleData } = await supabaseService
      .from("user_roles")
      .select("role")
      .eq("user_id", id)
      .single() as { data: { role: string } | null };

    const userRole = roleData?.role || "volunteer";

    // Admin normal solo puede ver voluntarios
    if (!session.isSuperAdmin && userRole !== "volunteer") {
      return NextResponse.json(
        { success: false, error: "No tienes permiso para ver este usuario" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        first_name: profile?.first_name || "",
        last_name: profile?.last_name || "",
        rut: profile?.rut || null,
        phone: profile?.phone || null,
        birthdate: profile?.birthdate || null,
        role: userRole,
        verified: profile?.verified ?? false,
        enabled: profile?.enabled ?? true,
        created_at: authData.user.created_at,
      },
    });
  } catch (err) {
    console.error("[admin/users/[id] GET] Error:", err);
    return NextResponse.json(
      { success: false, error: "Error al obtener usuario" },
      { status: 500 }
    );
  }
}

// =========================================================================
// PATCH - Actualizar usuario
// =========================================================================

export async function PATCH(req: Request, { params }: RouteParams) {
  const session = await getAdminSession();

  if (!session.allowed) {
    return NextResponse.json(
      { success: false, error: "No autorizado" },
      { status: 403 }
    );
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { firstName, lastName, rut, phone, birthdate, role, enabled } = body;

    // Obtener rol actual del usuario
    const { data: roleData } = await supabaseService
      .from("user_roles")
      .select("role")
      .eq("user_id", id)
      .single() as { data: { role: string } | null };

    const currentRole = roleData?.role || "volunteer";

    // Admin normal solo puede editar voluntarios
    if (!session.isSuperAdmin && currentRole !== "volunteer") {
      return NextResponse.json(
        { success: false, error: "No tienes permiso para editar este usuario" },
        { status: 403 }
      );
    }

    // Solo superadmin puede cambiar roles
    if (role !== undefined && role !== currentRole) {
      if (!session.isSuperAdmin) {
        return NextResponse.json(
          { success: false, error: "Solo superadmin puede cambiar roles" },
          { status: 403 }
        );
      }

      // Validar rol
      if (!["volunteer", "admin", "superadmin"].includes(role)) {
        return NextResponse.json(
          { success: false, error: "Rol inválido" },
          { status: 400 }
        );
      }

      // No permitir que un voluntario se convierta en admin/superadmin
      // sin ser creado explícitamente como admin
      if (currentRole === "volunteer" && (role === "admin" || role === "superadmin")) {
        return NextResponse.json(
          { success: false, error: "No se puede promover un voluntario a administrador. Crea un nuevo usuario admin." },
          { status: 400 }
        );
      }

      // Actualizar rol
      await supabaseService.from("user_roles").upsert({
        user_id: id,
        role,
      } as never);
    }

    // Actualizar perfil
    const profileUpdates: Record<string, unknown> = {};
    if (firstName !== undefined) profileUpdates.first_name = firstName;
    if (lastName !== undefined) profileUpdates.last_name = lastName;
    if (rut !== undefined) profileUpdates.rut = rut;
    if (phone !== undefined) profileUpdates.phone = phone;
    if (birthdate !== undefined) profileUpdates.birthdate = birthdate;
    if (enabled !== undefined) profileUpdates.enabled = enabled;

    if (Object.keys(profileUpdates).length > 0) {
      await supabaseService
        .from("user_profiles")
        .update(profileUpdates as never)
        .eq("id", id);
    }

    return NextResponse.json({
      success: true,
      message: "Usuario actualizado",
    });
  } catch (err) {
    console.error("[admin/users/[id] PATCH] Error:", err);
    return NextResponse.json(
      { success: false, error: "Error al actualizar usuario" },
      { status: 500 }
    );
  }
}

// =========================================================================
// DELETE - Eliminar usuario completamente
// =========================================================================

export async function DELETE(req: Request, { params }: RouteParams) {
  const session = await getAdminSession();

  if (!session.allowed) {
    return NextResponse.json(
      { success: false, error: "No autorizado" },
      { status: 403 }
    );
  }

  const { id } = await params;

  // Verificar parámetro de eliminación permanente
  const url = new URL(req.url);
  const permanent = url.searchParams.get("permanent") === "true";

  try {
    // Obtener rol del usuario a eliminar
    const { data: roleDelData } = await supabaseService
      .from("user_roles")
      .select("role")
      .eq("user_id", id)
      .single() as { data: { role: string } | null };

    const userRole = roleDelData?.role || "volunteer";

    // Admin normal solo puede eliminar voluntarios
    if (!session.isSuperAdmin && userRole !== "volunteer") {
      return NextResponse.json(
        { success: false, error: "No tienes permiso para eliminar este usuario" },
        { status: 403 }
      );
    }

    // No permitir eliminar superadmins si es el último
    if (userRole === "superadmin") {
      // Contar superadmins activos
      const { data: superadminCount } = await supabaseService
        .from("user_roles")
        .select("user_id", { count: "exact" })
        .eq("role", "superadmin");

      if ((superadminCount?.length || 0) <= 1) {
        return NextResponse.json(
          { success: false, error: "No se puede eliminar el único superadmin" },
          { status: 400 }
        );
      }
    }

    // No permitir auto-eliminación si es superadmin
    if (id === session.userId && userRole === "superadmin") {
      return NextResponse.json(
        { success: false, error: "No puedes eliminarte a ti mismo como superadmin" },
        { status: 400 }
      );
    }

    if (permanent) {
      // ELIMINACIÓN PERMANENTE: Eliminar de auth.users (cascade eliminará profile y roles)
      console.log(`[admin/users DELETE] Eliminando usuario permanentemente: ${id}`);
      
      const { error: deleteAuthError } = await supabaseService.auth.admin.deleteUser(id);
      
      if (deleteAuthError) {
        console.error("[admin/users DELETE] Error eliminando de auth:", deleteAuthError);
        return NextResponse.json(
          { success: false, error: "Error al eliminar usuario de auth" },
          { status: 500 }
        );
      }

      // Eliminar datos relacionados que no tengan CASCADE
      await supabaseService.from("user_profiles").delete().eq("id", id);
      await supabaseService.from("user_roles").delete().eq("user_id", id);
      await supabaseService.from("email_otps").delete().eq("user_id", id);

      return NextResponse.json({
        success: true,
        message: "Usuario eliminado permanentemente",
      });
    } else {
      // SOFT-DELETE: Deshabilitar usuario
      await supabaseService
        .from("user_profiles")
        .update({ enabled: false } as never)
        .eq("id", id);

      // También deshabilitar en Auth (ban user)
      await supabaseService.auth.admin.updateUserById(id, {
        ban_duration: "876000h", // ~100 años
      });

      return NextResponse.json({
        success: true,
        message: "Usuario deshabilitado",
      });
    }
  } catch (err) {
    console.error("[admin/users/[id] DELETE] Error:", err);
    return NextResponse.json(
      { success: false, error: "Error al eliminar usuario" },
      { status: 500 }
    );
  }
}
