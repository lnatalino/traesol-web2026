// src/app/api/admin/session/route.ts
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";

/**
 * GET /api/admin/session
 * Retorna información de la sesión actual (rol efectivo, email, isSuperAdmin)
 * 
 * El rol efectivo considera:
 * 1. Override por SUPERADMIN_EMAILS (si el email está en la lista, es superadmin)
 * 2. Rol guardado en la cookie de sesión
 */
export async function GET() {
  const session = await getAdminSession();

  if (!session.allowed) {
    return NextResponse.json({ role: null, email: null, isSuperAdmin: false });
  }

  return NextResponse.json({
    role: session.effectiveRole,
    email: session.email,
    isSuperAdmin: session.isSuperAdmin,
  });
}
