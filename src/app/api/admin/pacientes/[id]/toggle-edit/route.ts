import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * POST /api/admin/pacientes/[id]/toggle-edit
 * Permite a un admin activar/desactivar el permiso de edición del paciente
 * Body: { patient_can_edit: boolean }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session.allowed) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: pacienteId } = await params;
    if (!pacienteId) {
      return NextResponse.json(
        { error: "ID de paciente requerido" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { patient_can_edit } = body;

    if (typeof patient_can_edit !== "boolean") {
      return NextResponse.json(
        { error: "patient_can_edit debe ser boolean" },
        { status: 400 }
      );
    }

    // Actualizar en la base de datos
    const { data, error } = await supabaseService
      .from("pacientes" as unknown as never)
      .update({ patient_can_edit } as never)
      .eq("id", pacienteId)
      .select("id, patient_can_edit")
      .single() as { data: { id: string; patient_can_edit: boolean } | null; error: Error | null };

    if (error) {
      console.error("[toggle-edit] Error:", error);
      return NextResponse.json(
        { error: "Error al actualizar permisos" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      paciente_id: data.id,
      patient_can_edit: data.patient_can_edit,
      message: patient_can_edit
        ? "Paciente ahora puede editar sus datos"
        : "Edición de datos deshabilitada para el paciente",
    });
  } catch (err) {
    console.error("[toggle-edit] Exception:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/pacientes/[id]/toggle-edit
 * Obtener estado actual de patient_can_edit
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session.allowed) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: pacienteId } = await params;
    if (!pacienteId) {
      return NextResponse.json(
        { error: "ID de paciente requerido" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseService
      .from("pacientes" as unknown as never)
      .select("id, patient_can_edit")
      .eq("id", pacienteId)
      .single() as { data: { id: string; patient_can_edit: boolean | null } | null; error: Error | null };

    if (error || !data) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      paciente_id: data.id,
      patient_can_edit: data.patient_can_edit ?? false,
    });
  } catch (err) {
    console.error("[toggle-edit] Exception:", err);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
