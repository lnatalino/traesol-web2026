// src/app/api/admin/surveys/[id]/stats/route.ts
// API para obtener estadísticas de una encuesta

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import * as surveysService from "@/lib/surveys/surveysService";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const stats = await surveysService.getTemplateStats(id);
    
    if (!stats) {
      return NextResponse.json({ error: "Encuesta no encontrada" }, { status: 404 });
    }

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("[api/admin/surveys/[id]/stats] GET error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
