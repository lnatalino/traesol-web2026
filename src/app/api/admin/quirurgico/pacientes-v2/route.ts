// src/app/api/admin/quirurgico/pacientes-v2/route.ts
// CRUD para pacientes con nuevo modelo (admin)

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { listPacientes, createPaciente } from "@/lib/quirurgico";

export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session.allowed) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const operativoId = searchParams.get("operativo_id");
    const estado = searchParams.get("estado");
    const search = searchParams.get("q");
    const limit = searchParams.get("limit");

    const pacientes = await listPacientes({
      operativoId: operativoId || undefined,
      estado: estado || undefined,
      search: search || undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json({ pacientes });
  } catch (error) {
    console.error("[api/admin/quirurgico/pacientes-v2] list error:", error);
    return NextResponse.json(
      { error: "Error al cargar pacientes" },
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
      operativo_quirurgico_id,
      nombres,
      apellidos,
      rut,
      fecha_nacimiento,
      genero,
      telefono,
      email,
      direccion,
      ciudad_origen,
      diagnostico,
      cirugia_planificada,
      fecha_cirugia,
      hora_cirugia,
      alta_hospitalaria_estimada,
      requiere_vuelo,
      requiere_hospedaje,
      fecha_llegada_ciudad,
      fecha_regreso_ciudad,
      notes_admin,
      estado,
    } = body;

    if (!nombres || !apellidos) {
      return NextResponse.json(
        { error: "Nombres y apellidos son requeridos" },
        { status: 400 }
      );
    }

    const paciente = await createPaciente({
      operativo_quirurgico_id: operativo_quirurgico_id || null,
      nombres,
      apellidos,
      rut: rut || null,
      fecha_nacimiento: fecha_nacimiento || null,
      genero: genero || null,
      telefono: telefono || null,
      email: email || null,
      direccion: direccion || null,
      ciudad_origen: ciudad_origen || null,
      diagnostico: diagnostico || null,
      cirugia_planificada: cirugia_planificada || null,
      fecha_cirugia: fecha_cirugia || null,
      hora_cirugia: hora_cirugia || null,
      alta_hospitalaria_estimada: alta_hospitalaria_estimada || null,
      requiere_vuelo: requiere_vuelo || false,
      requiere_hospedaje: requiere_hospedaje || false,
      fecha_llegada_ciudad: fecha_llegada_ciudad || null,
      fecha_regreso_ciudad: fecha_regreso_ciudad || null,
      notes_admin: notes_admin || null,
      estado: estado || "activo",
    });

    return NextResponse.json({ success: true, paciente });
  } catch (error) {
    console.error("[api/admin/quirurgico/pacientes-v2] create error:", error);
    return NextResponse.json(
      { error: "Error al crear paciente" },
      { status: 500 }
    );
  }
}
