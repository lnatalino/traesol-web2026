// src/app/api/encuesta/route.ts
// API pública para obtener datos de encuesta y enviar respuestas

import { NextRequest, NextResponse } from "next/server";
import * as surveysService from "@/lib/surveys/surveysService";
import type { SurveySubmission } from "@/lib/surveys/types";

// GET: Obtener datos de encuesta por token
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    
    if (!token) {
      return NextResponse.json(
        { error: "Token requerido" },
        { status: 400 }
      );
    }

    const surveyData = await surveysService.getSurveyPublicData(token);
    
    if (!surveyData) {
      return NextResponse.json(
        { error: "Encuesta no encontrada o token inválido" },
        { status: 404 }
      );
    }

    if (surveyData.expirada) {
      return NextResponse.json(
        { error: "Esta encuesta ha expirado", expirada: true },
        { status: 410 }
      );
    }

    return NextResponse.json({ survey: surveyData });
  } catch (error) {
    console.error("[api/encuesta] GET error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// POST: Enviar respuestas
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, responses } = body;

    if (!token || !responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { error: "Token y respuestas son requeridos" },
        { status: 400 }
      );
    }

    // Verificar token
    const assignment = await surveysService.getAssignmentByToken(token);
    if (!assignment) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 404 }
      );
    }

    if (assignment.estado === "completado") {
      return NextResponse.json(
        { error: "Esta encuesta ya fue completada" },
        { status: 400 }
      );
    }

    if (assignment.expires_at && new Date(assignment.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Esta encuesta ha expirado" },
        { status: 410 }
      );
    }

    // Guardar respuestas
    const submission: SurveySubmission = {
      assignment_id: assignment.id,
      responses
    };

    const success = await surveysService.submitSurveyResponses(submission);
    
    if (!success) {
      return NextResponse.json(
        { error: "Error al guardar las respuestas" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "¡Gracias por completar la encuesta!"
    });
  } catch (error) {
    console.error("[api/encuesta] POST error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
