// src/app/api/admin/quirurgico/operativos/route.ts
// CRUD para operativos quirúrgicos (admin)

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import {
  listOperativosQuirurgicos,
  createOperativoQuirurgico,
} from "@/lib/quirurgico";

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session.allowed) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const publicado = searchParams.get("publicado");
    const estado = searchParams.get("estado");
    const limit = searchParams.get("limit");

    const operativos = await listOperativosQuirurgicos({
      publicado: publicado === "true" ? true : publicado === "false" ? false : undefined,
      estado: estado || undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json({ operativos });
  } catch (error) {
    console.error("[api/admin/quirurgico/operativos] list error:", error);
    return NextResponse.json(
      { error: "Error al cargar operativos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session.allowed) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

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

    if (!titulo) {
      return NextResponse.json(
        { error: "El título es requerido" },
        { status: 400 }
      );
    }

    const operativo = await createOperativoQuirurgico({
      titulo,
      descripcion: descripcion || null,
      fecha_inicio: fecha_inicio || null,
      fecha_fin: fecha_fin || null,
      ciudad: ciudad || null,
      lugar: lugar || null,
      imagen_cabecera_url: imagen_cabecera_url || null,
      publicado: publicado || false,
      estado: estado || "draft",
    });

    return NextResponse.json({ success: true, operativo });
  } catch (error) {
    console.error("[api/admin/quirurgico/operativos] create error:", error);
    return NextResponse.json(
      { error: "Error al crear operativo" },
      { status: 500 }
    );
  }
}
