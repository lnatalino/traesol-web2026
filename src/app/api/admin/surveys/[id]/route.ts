// src/app/api/admin/surveys/[id]/route.ts
// API para obtener, actualizar y eliminar un template de encuesta

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import * as surveysService from "@/lib/surveys/surveysService";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session.allowed) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const template = await surveysService.getTemplateWithQuestions(id);
    
    if (!template) {
      return NextResponse.json({ error: "Encuesta no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("[api/admin/surveys/[id]] GET error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
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
    const { nombre, descripcion, tipo, delay_days, activo } = body;

    const template = await surveysService.updateTemplate(id, {
      nombre,
      descripcion,
      tipo,
      delay_days,
      activo
    });

    if (!template) {
      return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error("[api/admin/surveys/[id]] PUT error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session.allowed) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await surveysService.deleteTemplate(id);

    if (!deleted) {
      return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/admin/surveys/[id]] DELETE error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
