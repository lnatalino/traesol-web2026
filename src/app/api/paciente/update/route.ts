// src/app/api/paciente/update/route.ts
// Endpoint para que el paciente actualice sus datos desde el portal

import { NextRequest, NextResponse } from "next/server";
import { verifyPortalSessionOrToken } from "@/lib/quirurgico/portalSession";
import { supabaseService } from "@/lib/supabaseService";

// Campos que el paciente puede actualizar
const ALLOWED_FIELDS = [
  "nombres",
  "apellidos",
  "rut",
  "fecha_nacimiento",
  "genero",
  "telefono",
  "email",
  "ciudad_origen",
  "direccion",
] as const;

type AllowedField = typeof ALLOWED_FIELDS[number];

// Helper para verificar si el paciente puede editar
async function canPatientEdit(pacienteId: string): Promise<boolean> {
  const { data } = await supabaseService
    .from("pacientes")
    .select("patient_can_edit")
    .eq("id", pacienteId)
    .single<{ patient_can_edit: boolean | null }>();
  return data?.patient_can_edit === true;
}

export async function POST(request: NextRequest) {
  try {
    // Verificar sesión del portal (cookie o token)
    const pacienteId = await verifyPortalSessionOrToken();

    if (!pacienteId) {
      return NextResponse.json(
        { error: "Sesión no válida" },
        { status: 401 }
      );
    }

    // Verificar si el paciente puede editar
    const canEdit = await canPatientEdit(pacienteId);
    if (!canEdit) {
      return NextResponse.json(
        { error: "No tienes permiso para modificar tus datos. Contacta al equipo de Traesol." },
        { status: 403 }
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
