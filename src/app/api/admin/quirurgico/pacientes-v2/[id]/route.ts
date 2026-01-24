// src/app/api/admin/quirurgico/pacientes-v2/[id]/route.ts
// GET, PUT, DELETE para un paciente específico (nuevo modelo)

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import {
  getPacienteDetail,
  updatePaciente,
  deletePaciente,
} from "@/lib/quirurgico";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session.allowed) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const detail = await getPacienteDetail(id);

    if (!detail) {
      return NextResponse.json(
        { error: "Paciente no encontrado" },
        { status: 404 }
      );
    }

    // Desestructurar para devolver en el formato esperado por el cliente
    const { contactos, requerimientos, archivos, portal_token, operativo, ...paciente } = detail;

    return NextResponse.json({
      paciente,
      contactos,
      requerimientos,
      archivos,
      portalToken: portal_token,
    });
  } catch (error) {
    console.error("[api/admin/quirurgico/pacientes-v2/[id]] get error:", error);
    return NextResponse.json(
      { error: "Error al cargar paciente" },
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

    const { id } = await params;
    const body = await request.json();

    const paciente = await updatePaciente(id, body);

    return NextResponse.json({ success: true, paciente });
  } catch (error) {
    console.error("[api/admin/quirurgico/pacientes-v2/[id]] update error:", error);
    return NextResponse.json(
      { error: "Error al actualizar paciente" },
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

    const { id } = await params;
    await deletePaciente(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al eliminar";
    console.error("[api/admin/quirurgico/pacientes-v2/[id]] delete error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
