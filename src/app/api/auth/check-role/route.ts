// src/app/api/auth/check-role/route.ts
// Retorna el rol efectivo del usuario (considera SUPERADMIN_EMAILS)

import { NextResponse } from "next/server";
import { getUnifiedSession } from "@/lib/unifiedAuth";
import { getEffectiveRole } from "@/lib/adminAuth";

export async function GET() {
  try {
    const session = await getUnifiedSession();
    
    if (!session.authenticated || !session.email) {
      return NextResponse.json({ role: "volunteer" });
    }
    
    // Calcular rol efectivo considerando SUPERADMIN_EMAILS
    const effectiveRole = getEffectiveRole(session.role, session.email);
    
    return NextResponse.json({
      role: effectiveRole,
      verified: session.verified,
    });
  } catch (err) {
    console.error("[check-role] Error:", err);
    return NextResponse.json({ role: "volunteer" });
  }
}
