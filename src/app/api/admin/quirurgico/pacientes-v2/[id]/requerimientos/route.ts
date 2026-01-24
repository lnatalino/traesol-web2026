// src/app/api/admin/quirurgico/pacientes-v2/[id]/requerimientos/route.ts
// CRUD requerimientos (exámenes, documentos) de un paciente (admin)

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import {
  listRequerimientos,
  createRequerimiento,
  updateRequerimiento,
  deleteRequerimiento,
} from "@/lib/quirurgico";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session.allowed) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const requerimientos = await listRequerimientos(id);

    return NextResponse.json({ requerimientos });
  } catch (error) {
    console.error("[api/admin/pacientes/[id]/requerimientos] list error:", error);
    return NextResponse.json(
      { error: "Error al cargar requerimientos" },
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
    const { titulo, descripcion, tipo, estado, fecha_limite, notas_admin } = body;

    if (!titulo) {
      return NextResponse.json(
        { error: "El título es requerido" },
        { status: 400 }
      );
    }

    const requerimiento = await createRequerimiento({
      paciente_id: id,
      titulo,
      descripcion: descripcion || null,
      tipo: tipo || "examen",
      estado: estado || "pendiente",
      fecha_limite: fecha_limite || null,
      notas_admin: notas_admin || null,
    });

    return NextResponse.json({ success: true, requerimiento });
  } catch (error) {
    console.error("[api/admin/pacientes/[id]/requerimientos] create error:", error);
    return NextResponse.json(
      { error: "Error al crear requerimiento" },
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
        { error: "ID del requerimiento requerido" },
        { status: 400 }
      );
    }

    const requerimiento = await updateRequerimiento(id, pacienteId, data);

    return NextResponse.json({ success: true, requerimiento });
  } catch (error) {
    console.error("[api/admin/pacientes/[id]/requerimientos] update error:", error);
    return NextResponse.json(
      { error: "Error al actualizar requerimiento" },
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
    const requerimientoId = searchParams.get("requerimiento_id");

    if (!requerimientoId) {
      return NextResponse.json(
        { error: "ID del requerimiento requerido" },
        { status: 400 }
      );
    }

    await deleteRequerimiento(requerimientoId, pacienteId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/admin/pacientes/[id]/requerimientos] delete error:", error);
    return NextResponse.json(
      { error: "Error al eliminar requerimiento" },
      { status: 500 }
    );
  }
}
