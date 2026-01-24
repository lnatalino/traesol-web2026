// src/app/api/paciente/contactos/route.ts
// Endpoint para gestionar contactos de emergencia del paciente

import { NextRequest, NextResponse } from "next/server";
import { verifyPortalSessionOrToken } from "@/lib/quirurgico/portalSession";
import { supabaseService } from "@/lib/supabaseService";

// Helper para verificar si el paciente puede editar
async function canPatientEdit(pacienteId: string): Promise<boolean> {
  const { data } = await supabaseService
    .from("pacientes")
    .select("patient_can_edit")
    .eq("id", pacienteId)
    .single<{ patient_can_edit: boolean | null }>();
  return data?.patient_can_edit === true;
}

export async function GET() {
  try {
    const pacienteId = await verifyPortalSessionOrToken();

    if (!pacienteId) {
      return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
    }

    const { data, error } = await supabaseService
      .from("paciente_contactos")
      .select("id, nombre, relacion, telefono, email, es_principal")
      .eq("paciente_id", pacienteId)
      .order("es_principal", { ascending: false });

    if (error) {
      console.error("[api/paciente/contactos] list error:", error);
      return NextResponse.json(
        { error: "Error al cargar contactos" },
        { status: 500 }
      );
    }

    return NextResponse.json({ contactos: data || [] });
  } catch (error) {
    console.error("[api/paciente/contactos] error:", error);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const pacienteId = await verifyPortalSessionOrToken();

    if (!pacienteId) {
      return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
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
    const { nombre, relacion, telefono, email, es_principal } = body;

    if (!nombre || !telefono) {
      return NextResponse.json(
        { error: "Nombre y teléfono son requeridos" },
        { status: 400 }
      );
    }

    // Si es principal, desmarcar otros
    // Cast temporal para tablas no en tipos generados
    if (es_principal) {
      await supabaseService
        .from("paciente_contactos")
        .update({ es_principal: false } as unknown as never)
        .eq("paciente_id", pacienteId);
    }

    const { data, error } = await supabaseService
      .from("paciente_contactos")
      .insert({
        paciente_id: pacienteId,
        nombre,
        relacion: relacion || null,
        telefono,
        email: email || null,
        es_principal: es_principal || false,
      } as unknown as never)
      .select()
      .single();

    if (error) {
      console.error("[api/paciente/contactos] create error:", error);
      return NextResponse.json(
        { error: "Error al crear contacto" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, contacto: data });
  } catch (error) {
    console.error("[api/paciente/contactos] error:", error);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const pacienteId = await verifyPortalSessionOrToken();

    if (!pacienteId) {
      return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
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
    const { id, nombre, relacion, telefono, email, es_principal } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    // Si es principal, desmarcar otros
    if (es_principal) {
      await supabaseService
        .from("paciente_contactos")
        .update({ es_principal: false } as unknown as never)
        .eq("paciente_id", pacienteId)
        .neq("id", id);
    }

    const { data, error } = await supabaseService
      .from("paciente_contactos")
      .update({
        nombre,
        relacion: relacion || null,
        telefono,
        email: email || null,
        es_principal: es_principal || false,
      } as unknown as never)
      .eq("id", id)
      .eq("paciente_id", pacienteId)
      .select()
      .single();

    if (error) {
      console.error("[api/paciente/contactos] update error:", error);
      return NextResponse.json(
        { error: "Error al actualizar contacto" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, contacto: data });
  } catch (error) {
    console.error("[api/paciente/contactos] error:", error);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const pacienteId = await verifyPortalSessionOrToken();

    if (!pacienteId) {
      return NextResponse.json({ error: "Sesión no válida" }, { status: 401 });
    }

    // Verificar si el paciente puede editar
    const canEdit = await canPatientEdit(pacienteId);
    if (!canEdit) {
      return NextResponse.json(
        { error: "No tienes permiso para modificar tus datos. Contacta al equipo de Traesol." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 });
    }

    const { error } = await supabaseService
      .from("paciente_contactos")
      .delete()
      .eq("id", id)
      .eq("paciente_id", pacienteId);

    if (error) {
      console.error("[api/paciente/contactos] delete error:", error);
      return NextResponse.json(
        { error: "Error al eliminar contacto" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/paciente/contactos] error:", error);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
