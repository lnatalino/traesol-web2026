// src/app/api/paciente/update/route.ts
// Endpoint para que el paciente actualice sus datos desde el portal

import { NextRequest, NextResponse } from "next/server";
import { verifyPortalSession } from "@/lib/quirurgico/portalSession";
import { supabaseService } from "@/lib/supabaseService";

// Campos que el paciente puede actualizar
const ALLOWED_FIELDS = [
  "telefono",
  "email",
  "direccion",
] as const;

type AllowedField = typeof ALLOWED_FIELDS[number];

export async function POST(request: NextRequest) {
  try {
    // Verificar sesión del portal
    const pacienteId = await verifyPortalSession();

    if (!pacienteId) {
      return NextResponse.json(
        { error: "Sesión no válida" },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Filtrar solo campos permitidos
    const updateData: Partial<Record<AllowedField, string | null>> = {};
    
    for (const field of ALLOWED_FIELDS) {
      if (field in body) {
        updateData[field] = body[field] ?? null;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No hay campos válidos para actualizar" },
        { status: 400 }
      );
    }

    // Actualizar - cast temporal para tablas no generadas
    const { error } = await supabaseService
      .from("pacientes")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      } as unknown as never)
      .eq("id", pacienteId);

    if (error) {
      console.error("[api/paciente/update] error:", error);
      return NextResponse.json(
        { error: "No se pudieron guardar los cambios" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/paciente/update] error:", error);
    return NextResponse.json(
      { error: "Error al actualizar" },
      { status: 500 }
    );
  }
}
