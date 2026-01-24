// src/app/api/admin/quirurgico/operativos/[id]/route.ts
// GET, PUT, DELETE para un operativo quirúrgico específico

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import {
  getOperativoQuirurgico,
  updateOperativoQuirurgico,
  deleteOperativoQuirurgico,
  getOperativoStats,
} from "@/lib/quirurgico";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session.allowed) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const operativo = await getOperativoQuirurgico(id);

    if (!operativo) {
      return NextResponse.json(
        { error: "Operativo no encontrado" },
        { status: 404 }
      );
    }

    // Obtener estadísticas
    const stats = await getOperativoStats(id);

    return NextResponse.json({ operativo, stats });
  } catch (error) {
    console.error("[api/admin/quirurgico/operativos/[id]] get error:", error);
    return NextResponse.json(
      { error: "Error al cargar operativo" },
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

    const {
      titulo,
      descripcion,
      fecha_inicio,
      fecha_fin,
      ciudad,
      lugar,
      imagen_cabecera_url,
      publicado,
      estado,
    } = body;

    const operativo = await updateOperativoQuirurgico(id, {
      titulo,
      descripcion,
      fecha_inicio,
      fecha_fin,
      ciudad,
      lugar,
      imagen_cabecera_url,
      publicado,
      estado,
    });

    return NextResponse.json({ success: true, operativo });
  } catch (error) {
    console.error("[api/admin/quirurgico/operativos/[id]] update error:", error);
    return NextResponse.json(
      { error: "Error al actualizar operativo" },
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

    await deleteOperativoQuirurgico(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al eliminar";
    console.error("[api/admin/quirurgico/operativos/[id]] delete error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
