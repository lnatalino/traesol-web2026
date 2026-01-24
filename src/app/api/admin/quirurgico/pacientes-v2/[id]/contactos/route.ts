// src/app/api/admin/quirurgico/pacientes-v2/[id]/contactos/route.ts
// CRUD contactos de emergencia de un paciente (admin)

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import {
  listContactos,
  createContacto,
  updateContacto,
  deleteContacto,
} from "@/lib/quirurgico";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session.allowed) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const contactos = await listContactos(id);

    return NextResponse.json({ contactos });
  } catch (error) {
    console.error("[api/admin/pacientes/[id]/contactos] list error:", error);
    return NextResponse.json(
      { error: "Error al cargar contactos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session.allowed) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { nombre, relacion, telefono, email, es_principal } = body;

    if (!nombre || !telefono) {
      return NextResponse.json(
        { error: "Nombre y teléfono son requeridos" },
        { status: 400 }
      );
    }

    const contacto = await createContacto({
      paciente_id: id,
      nombre,
      relacion: relacion || null,
      telefono,
      email: email || null,
      es_principal: es_principal || false,
    });

    return NextResponse.json({ success: true, contacto });
  } catch (error) {
    console.error("[api/admin/pacientes/[id]/contactos] create error:", error);
    return NextResponse.json(
      { error: "Error al crear contacto" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session.allowed) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: pacienteId } = await params;
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID del contacto requerido" },
        { status: 400 }
      );
    }

    const contacto = await updateContacto(id, pacienteId, data);

    return NextResponse.json({ success: true, contacto });
  } catch (error) {
    console.error("[api/admin/pacientes/[id]/contactos] update error:", error);
    return NextResponse.json(
      { error: "Error al actualizar contacto" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session.allowed) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: pacienteId } = await params;
    const { searchParams } = new URL(request.url);
    const contactoId = searchParams.get("contacto_id");

    if (!contactoId) {
      return NextResponse.json(
        { error: "ID del contacto requerido" },
        { status: 400 }
      );
    }

    await deleteContacto(contactoId, pacienteId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/admin/pacientes/[id]/contactos] delete error:", error);
    return NextResponse.json(
      { error: "Error al eliminar contacto" },
      { status: 500 }
    );
  }
}
