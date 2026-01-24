// src/app/api/admin/surveys/assignments/route.ts
// API para listar asignaciones de encuestas

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import * as surveysService from "@/lib/surveys/surveysService";

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session.allowed) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const template_id = searchParams.get("template_id") || undefined;
    const estado = searchParams.get("estado") || undefined;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined;

    const assignments = await surveysService.getAssignments({
      template_id,
      estado,
      limit
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("[api/admin/surveys/assignments] GET error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
