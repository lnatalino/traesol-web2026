// src/app/api/admin/surveys/[id]/questions/route.ts
// API para gestionar preguntas de una encuesta

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import * as surveysService from "@/lib/surveys/surveysService";
import type { SurveyQuestionInsert } from "@/lib/surveys/types";

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
    const questions = await surveysService.getQuestionsByTemplate(id);

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("[api/admin/surveys/[id]/questions] GET error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
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
    const { texto, tipo, rating_labels, opciones, requerida, orden, activa } = body;

    if (!texto || !tipo) {
      return NextResponse.json(
        { error: "Texto y tipo son requeridos" },
        { status: 400 }
      );
    }

    if (!["rating", "texto_libre", "opcion_multiple"].includes(tipo)) {
      return NextResponse.json(
        { error: "Tipo de pregunta inválido" },
        { status: 400 }
      );
    }

    const questionData: SurveyQuestionInsert = {
      template_id: id,
      texto,
      tipo,
      rating_labels: rating_labels || null,
      opciones: opciones || null,
      requerida: requerida !== false,
      orden: orden ?? undefined,
      activa: activa !== false
    };

    const question = await surveysService.createQuestion(questionData);
    if (!question) {
      return NextResponse.json(
        { error: "Error al crear la pregunta" },
        { status: 500 }
      );
    }

    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error("[api/admin/surveys/[id]/questions] POST error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// Reordenar preguntas
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session.allowed) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { questionIds } = body;

    if (!Array.isArray(questionIds)) {
      return NextResponse.json(
        { error: "questionIds debe ser un array" },
        { status: 400 }
      );
    }

    const success = await surveysService.reorderQuestions(id, questionIds);
    if (!success) {
      return NextResponse.json(
        { error: "Error al reordenar preguntas" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/admin/surveys/[id]/questions] PATCH error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
