// src/app/api/admin/staff/available/route.ts
// API para listar usuarios admin/superadmin disponibles para asignar como staff
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import { getErrorMessage } from "@/lib/errors";

// Lista de emails que siempre son superadmin
const SUPERADMIN_EMAILS = (process.env.SUPERADMIN_EMAILS || "")
  .split(",")
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

export async function GET() {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }

  try {
    // Tipo para user_roles
    type UserRoleRow = { user_id: string; role: string };

    // Obtener usuarios con rol admin o superadmin
    const { data: rolesData } = await supabaseService
      .from("user_roles")
      .select("user_id, role")
      .in("role", ["admin", "superadmin"]);

    const rolesList = (rolesData || []) as UserRoleRow[];
    const userIdsFromRoles = rolesList.map(r => r.user_id);

    // Obtener todos los usuarios de auth para encontrar también los superadmin por email
    const { data: { users } } = await supabaseService.auth.admin.listUsers();
    
    // Filtrar usuarios que son admin por rol o por SUPERADMIN_EMAILS
    const adminUserIds = new Set<string>();
    const emailToUserId = new Map<string, string>();
    
    for (const user of users || []) {
      emailToUserId.set(user.email || "", user.id);
      
      // Si está en user_roles como admin/superadmin
      if (userIdsFromRoles.includes(user.id)) {
        adminUserIds.add(user.id);
      }
      // Si está en SUPERADMIN_EMAILS
      if (user.email && SUPERADMIN_EMAILS.includes(user.email.toLowerCase())) {
        adminUserIds.add(user.id);
      }
    }

    // Obtener perfiles de estos usuarios
    const adminIds = Array.from(adminUserIds);
    
    if (adminIds.length === 0) {
      return NextResponse.json({ ok: true, users: [] });
    }

    type ProfileRow = { id: string; first_name: string | null; last_name: string | null; cargo_interno: string | null };

    const { data: profiles } = await supabaseService
      .from("user_profiles")
      .select("id, first_name, last_name, cargo_interno")
      .in("id", adminIds);

    const profilesList = (profiles || []) as ProfileRow[];

    // Combinar datos
    const availableStaff = adminIds.map(userId => {
      const profile = profilesList.find(p => p.id === userId);
      const user = users?.find(u => u.id === userId);
      const role = rolesList.find(r => r.user_id === userId);
      
      return {
        id: userId,
        email: user?.email || "",
        first_name: profile?.first_name || null,
        last_name: profile?.last_name || null,
        cargo_interno: profile?.cargo_interno || null,
        role: role?.role || (SUPERADMIN_EMAILS.includes(user?.email?.toLowerCase() || "") ? "superadmin" : "admin"),
      };
    }).sort((a, b) => {
      const nameA = `${a.first_name || ""} ${a.last_name || ""}`.toLowerCase();
      const nameB = `${b.first_name || ""} ${b.last_name || ""}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return NextResponse.json({ ok: true, users: availableStaff });
  } catch (err) {
    console.error("[staff/available] Error:", err);
    return NextResponse.json(
      { ok: false, error: getErrorMessage(err) },
      { status: 500 }
    );
  }
}
