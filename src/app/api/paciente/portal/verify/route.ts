// src/app/api/paciente/portal/verify/route.ts
// Endpoint para verificar token del portal y crear sesión

import { NextRequest, NextResponse } from "next/server";
import { verifyPortalToken, recordTokenUsage } from "@/lib/quirurgico";
import { createPortalSession } from "@/lib/quirurgico/portalSession";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { success: false, error: "Token requerido" },
        { status: 400 }
      );
    }

    // Verificar el token
    const result = await verifyPortalToken(token);

    if (!result.valid || !result.pacienteId) {
      return NextResponse.json(
        { success: false, error: result.error || "Token inválido" },
        { status: 401 }
      );
    }

    // Registrar uso del token
    await recordTokenUsage(result.pacienteId);

    // Crear sesión segura con cookie httpOnly
    await createPortalSession(result.pacienteId);

    return NextResponse.json({
      success: true,
      patient_id: result.pacienteId,
    });
  } catch (error) {
    console.error("[api/paciente/portal/verify] error:", error);
    return NextResponse.json(
      { success: false, error: "Error al verificar el acceso" },
      { status: 500 }
    );
  }
}
