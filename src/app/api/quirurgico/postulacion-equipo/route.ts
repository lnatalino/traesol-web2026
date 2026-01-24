// src/app/api/quirurgico/postulacion-equipo/route.ts
// Endpoint público para postulaciones de equipo clínico

import { NextRequest, NextResponse } from "next/server";
import { createPostulacionEquipo, getOperativoQuirurgicoPublicBySlug } from "@/lib/quirurgico";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      operativo_slug,
      operativo_quirurgico_id,
      nombres,
      apellidos,
      rut,
      email,
      telefono,
      profesion,
      especialidad,
      registro_superint,
      anos_experiencia,
      experiencia_pabellon,
      certificaciones,
      disponibilidad_completa,
      notas_disponibilidad,
    } = body;

    // Validaciones básicas
    if (!nombres || !apellidos || !email || !profesion) {
      return NextResponse.json(
        { error: "Nombres, apellidos, email y profesión son requeridos" },
        { status: 400 }
      );
    }

    // Determinar el ID del operativo
    let opId = operativo_quirurgico_id;
    
    if (!opId && operativo_slug) {
      const operativo = await getOperativoQuirurgicoPublicBySlug(operativo_slug);
      if (!operativo) {
        return NextResponse.json(
          { error: "Operativo no encontrado" },
          { status: 404 }
        );
      }
      opId = operativo.id;
    }

    if (!opId) {
      return NextResponse.json(
        { error: "Debe indicar el operativo" },
        { status: 400 }
      );
    }

    // Crear postulación
    const postulacion = await createPostulacionEquipo({
      operativo_quirurgico_id: opId,
      nombres,
      apellidos,
      rut: rut || null,
      email,
      telefono: telefono || null,
      profesion,
      especialidad: especialidad || null,
      registro_superint: registro_superint || null,
      anos_experiencia: anos_experiencia ? parseInt(anos_experiencia) : null,
      experiencia_pabellon: experiencia_pabellon || null,
      certificaciones: certificaciones || null,
      disponibilidad_completa: disponibilidad_completa !== false,
      notas_disponibilidad: notas_disponibilidad || null,
    });

    return NextResponse.json({
      success: true,
      message: "Postulación recibida correctamente. Te contactaremos pronto.",
      id: postulacion.id,
    });
  } catch (error) {
    console.error("[api/quirurgico/postulacion-equipo] error:", error);
    return NextResponse.json(
      { error: "Error al procesar la postulación" },
      { status: 500 }
    );
  }
}
