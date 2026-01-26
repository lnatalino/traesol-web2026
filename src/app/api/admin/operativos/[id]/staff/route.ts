// src/app/api/admin/operativos/[id]/staff/route.ts
// API CRUD para staff de operativos (admin/superadmin como participantes)
import { NextResponse, type NextRequest } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import { getErrorMessage } from "@/lib/errors";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// =========================================================================
// GET: Lista staff asignado a un operativo
// =========================================================================
export async function GET(req: NextRequest, context: RouteContext) {
  const { id: operativoId } = await context.params;
  
  if (!operativoId?.trim()) {
    return NextResponse.json({ ok: false, error: "ID de operativo inválido" }, { status: 400 });
  }

  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }

  try {
    // Tipo para participantes
    type ParticipantRow = {
      id: string;
      user_id: string;
      kind: string;
      status: string | null;
      notas: string | null;
      created_at: string | null;
    };

    // Obtener participantes tipo staff
    const { data: participants, error } = await supabaseService
      .from("operativo_participantes")
      .select(`
        id,
        user_id,
        kind,
        status,
        notas,
        created_at
      `)
      .eq("operativo_id", operativoId)
      .eq("kind", "staff")
      .order("created_at", { ascending: true });

    if (error) throw error;

    const participantsList = (participants || []) as ParticipantRow[];

    // Obtener datos de usuarios
    const userIds = participantsList.map(p => p.user_id).filter(Boolean);
    
    let usersMap = new Map<string, { email: string; first_name: string | null; last_name: string | null; cargo_interno: string | null }>();
    
    if (userIds.length > 0) {
      type ProfileRow = { id: string; first_name: string | null; last_name: string | null; cargo_interno: string | null };
      
      const { data: profiles } = await supabaseService
        .from("user_profiles")
        .select("id, first_name, last_name, cargo_interno")
        .in("id", userIds);

      const profilesList = (profiles || []) as ProfileRow[];

      // Obtener emails desde auth.users vía service role
      const { data: { users } } = await supabaseService.auth.admin.listUsers();
      const emailMap = new Map(users?.map(u => [u.id, u.email]) || []);

      for (const profile of profilesList) {
        usersMap.set(profile.id, {
          email: emailMap.get(profile.id) || "",
          first_name: profile.first_name,
          last_name: profile.last_name,
          cargo_interno: profile.cargo_interno,
        });
      }
    }

    // Combinar datos
    const staffList = participantsList.map(p => ({
      id: p.id,
      user_id: p.user_id,
      notas: p.notas,
      created_at: p.created_at,
      ...usersMap.get(p.user_id),
    }));

    return NextResponse.json({ ok: true, staff: staffList });
  } catch (err) {
    console.error("[staff/GET] Error:", err);
    return NextResponse.json(
      { ok: false, error: getErrorMessage(err) },
      { status: 500 }
    );
  }
}

// =========================================================================
// POST: Agregar staff a un operativo
// =========================================================================
export async function POST(req: NextRequest, context: RouteContext) {
  const { id: operativoId } = await context.params;
  
  if (!operativoId?.trim()) {
    return NextResponse.json({ ok: false, error: "ID de operativo inválido" }, { status: 400 });
  }

  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }

  // Solo superadmin y admin pueden asignar staff
  if (!["superadmin", "admin"].includes(session.effectiveRole)) {
    return NextResponse.json({ ok: false, error: "Solo admin/superadmin pueden asignar staff" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const userId = (body.user_id || "").trim();
    const notas = (body.notas || "").trim();

    if (!userId) {
      return NextResponse.json({ ok: false, error: "user_id es requerido" }, { status: 400 });
    }

    // Verificar que el usuario existe y tiene rol admin/superadmin
    type UserRoleRow = { role: string | null };
    const { data: userRole } = await supabaseService
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    const userRoleData = userRole as UserRoleRow | null;

    // También verificar SUPERADMIN_EMAILS
    const { data: { user } } = await supabaseService.auth.admin.getUserById(userId);
    const superAdminEmails = (process.env.SUPERADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
    const isSuperAdminByEmail = user?.email && superAdminEmails.includes(user.email.toLowerCase());

    const validRoles = ["admin", "superadmin"];
    const hasValidRole = (userRoleData?.role && validRoles.includes(userRoleData.role)) || isSuperAdminByEmail;

    if (!hasValidRole) {
      return NextResponse.json(
        { ok: false, error: "El usuario no tiene rol de admin/superadmin" },
        { status: 400 }
      );
    }

    // Verificar que el operativo existe
    const { data: operativo } = await supabaseService
      .from("operativos")
      .select("id")
      .eq("id", operativoId)
      .single();

    if (!operativo) {
      return NextResponse.json({ ok: false, error: "Operativo no encontrado" }, { status: 404 });
    }

    // Insertar participante como staff (status 'accepted' por defecto para staff)
    const insertData = {
      operativo_id: operativoId,
      user_id: userId,
      kind: "staff",
      status: "accepted",
      notas: notas || null,
    } as Record<string, unknown>;

    const { data: newStaff, error } = await supabaseService
      .from("operativo_participantes")
      .insert(insertData as never)
      .select()
      .single();

    if (error) {
      // Error de unique constraint = ya está asignado
      if (error.code === "23505") {
        return NextResponse.json(
          { ok: false, error: "Este usuario ya está asignado a este operativo" },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json({ ok: true, staff: newStaff }, { status: 201 });
  } catch (err) {
    console.error("[staff/POST] Error:", err);
    return NextResponse.json(
      { ok: false, error: getErrorMessage(err) },
      { status: 500 }
    );
  }
}

// =========================================================================
// DELETE: Remover staff de un operativo
// =========================================================================
export async function DELETE(req: NextRequest, context: RouteContext) {
  const { id: operativoId } = await context.params;
  
  if (!operativoId?.trim()) {
    return NextResponse.json({ ok: false, error: "ID de operativo inválido" }, { status: 400 });
  }

  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }

  // Solo superadmin y admin pueden remover staff
  if (!["superadmin", "admin"].includes(session.effectiveRole)) {
    return NextResponse.json({ ok: false, error: "Solo admin/superadmin pueden remover staff" }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const participantId = url.searchParams.get("participantId")?.trim();
    const userId = url.searchParams.get("userId")?.trim();

    if (!participantId && !userId) {
      return NextResponse.json(
        { ok: false, error: "Se requiere participantId o userId" },
        { status: 400 }
      );
    }

    let deleteQuery = supabaseService
      .from("operativo_participantes")
      .delete()
      .eq("operativo_id", operativoId)
      .eq("kind", "staff");

    if (participantId) {
      deleteQuery = deleteQuery.eq("id", participantId);
    } else if (userId) {
      deleteQuery = deleteQuery.eq("user_id", userId);
    }

    const { error } = await deleteQuery;

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[staff/DELETE] Error:", err);
    return NextResponse.json(
      { ok: false, error: getErrorMessage(err) },
      { status: 500 }
    );
  }
}
