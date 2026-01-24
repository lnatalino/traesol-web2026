// src/app/api/admin/surveys/[id]/questions/[questionId]/route.ts
// API para actualizar o eliminar una pregunta específica

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import * as surveysService from "@/lib/surveys/surveysService";

interface RouteParams {
  params: Promise<{ id: string; questionId: string }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session.allowed) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { questionId } = await params;
    const body = await request.json();
    const { texto, tipo, rating_labels, opciones, requerida, activa } = body;

    const question = await surveysService.updateQuestion(questionId, {
      texto,
      tipo,
      rating_labels,
      opciones,
      requerida,
      activa
    });

    if (!question) {
      return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
    }

    return NextResponse.json({ question });
  } catch (error) {
    console.error("[api/admin/surveys/questions/[questionId]] PUT error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session.allowed) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { questionId } = await params;
    const deleted = await surveysService.deleteQuestion(questionId);

    if (!deleted) {
      return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/admin/surveys/questions/[questionId]] DELETE error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
