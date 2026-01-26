// src/app/api/mi-cuenta/datos/route.ts
// Obtiene datos del voluntario e inscripciones para el panel Mi Cuenta

import { NextResponse } from "next/server";
import { getUnifiedSession } from "@/lib/unifiedAuth";
import { supabaseService } from "@/lib/supabaseService";

export async function GET() {
  try {
    const session = await getUnifiedSession();
    
    if (!session.authenticated || !session.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const email = session.email.toLowerCase().trim();

    // Tipos para los datos
    type VoluntarioRow = {
      id: string;
      nombres: string;
      apellidos: string;
      email: string;
      rut: string | null;
      profesion: string | null;
    };

    type InscripcionRow = {
      id: string;
      estado: string | null;
      created_at: string | null;
      operativo_id: string | null;
    };

    // 1. Buscar voluntario por email
    const { data: voluntarioData, error: volError } = await supabaseService
      .from("voluntarios")
      .select("id, nombres, apellidos, email, rut, profesion")
      .eq("email", email)
      .single();

    if (volError && volError.code !== "PGRST116") {
      console.error("[mi-cuenta/datos] Error buscando voluntario:", volError);
    }

    const voluntario = voluntarioData as VoluntarioRow | null;

    // Si no hay voluntario registrado, retornar datos vacíos
    if (!voluntario) {
      return NextResponse.json({
        voluntario: null,
        inscripciones: [],
      });
    }

    // 2. Buscar inscripciones del voluntario con datos de operativo
    const { data: inscripcionesData, error: inscError } = await supabaseService
      .from("inscripciones_voluntarios")
      .select(`
        id,
        estado,
        created_at,
        operativo_id
      `)
      .eq("voluntario_id", voluntario.id)
      .order("created_at", { ascending: false })
      .limit(50);
    
    const inscripciones = (inscripcionesData || []) as InscripcionRow[];

    if (inscError) {
      console.error("[mi-cuenta/datos] Error buscando inscripciones:", inscError);
      return NextResponse.json({
        voluntario,
        inscripciones: [],
      });
    }

    // 3. Obtener operativos relacionados
    const operativoIds = [...new Set(
      inscripciones
        .map(i => i.operativo_id)
        .filter((id): id is string => Boolean(id))
    )];

    type OperativoRow = {
      id: string;
      titulo: string;
      slug: string;
      fecha_inicio: string | null;
      fecha_fin: string | null;
      lugar: string | null;
      estado: string;
    };

    const operativosMap: Record<string, OperativoRow> = {};

    if (operativoIds.length > 0) {
      const { data: operativosData } = await supabaseService
        .from("operativos")
        .select("id, titulo, slug, fecha_inicio, fecha_fin, lugar, estado")
        .in("id", operativoIds);

      const operativos = (operativosData || []) as OperativoRow[];
      for (const op of operativos) {
        operativosMap[op.id] = op;
      }
    }

    // 4. Combinar inscripciones con operativos
    const inscripcionesConOperativo = inscripciones.map(insc => ({
      id: insc.id,
      estado: insc.estado || "pendiente",
      created_at: insc.created_at,
      operativo: insc.operativo_id ? operativosMap[insc.operativo_id] || null : null,
    }));

    return NextResponse.json({
      voluntario,
      inscripciones: inscripcionesConOperativo,
    });

  } catch (error) {
    console.error("[mi-cuenta/datos] Error:", error);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
