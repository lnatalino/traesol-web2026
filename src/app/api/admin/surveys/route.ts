// src/app/api/admin/surveys/route.ts
// API para listar y crear templates de encuestas

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import * as surveysService from "@/lib/surveys/surveysService";
import type { SurveyTemplateInsert } from "@/lib/surveys/types";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const templates = await surveysService.getTemplates();
    return NextResponse.json({ templates });
  } catch (error) {
    console.error("[api/admin/surveys] GET error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { nombre, descripcion, tipo, delay_days, activo } = body;

    if (!nombre || !tipo) {
      return NextResponse.json(
        { error: "Nombre y tipo son requeridos" },
        { status: 400 }
      );
    }

    if (!["VOLUNTARIOS_OPERATIVO", "PACIENTES_QUIRURGICO"].includes(tipo)) {
      return NextResponse.json(
        { error: "Tipo de encuesta inválido" },
        { status: 400 }
      );
    }

    const templateData: SurveyTemplateInsert = {
      nombre,
      descripcion: descripcion || null,
      tipo,
      delay_days: delay_days || 1,
      activo: activo !== false,
      created_by: session.email
    };

    const template = await surveysService.createTemplate(templateData);
    if (!template) {
      return NextResponse.json(
        { error: "Error al crear la encuesta" },
        { status: 500 }
      );
    }

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("[api/admin/surveys] POST error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
