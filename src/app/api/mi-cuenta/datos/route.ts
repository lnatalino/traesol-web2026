// src/app/api/mi-cuenta/datos/route.ts
// Obtiene datos del voluntario e inscripciones para el panel Mi Cuenta
// FUENTE DE VERDAD: tabla "inscripciones" (no inscripciones_voluntarios)

import { NextResponse } from "next/server";
import { getUnifiedSession } from "@/lib/unifiedAuth";
import { supabaseService } from "@/lib/supabaseService";
import { getNowInChile, toChileDateString } from "@/lib/operativosShared";
import { INSCRIPCION_ESTADO } from "@/lib/inscripciones";

// Estados que representan "participación confirmada"
const CONFIRMED_ESTADOS = [
  INSCRIPCION_ESTADO.APROBADO,
  INSCRIPCION_ESTADO.CONFIRMADO,
  INSCRIPCION_ESTADO.ASISTIO,
];

// Estados "pendiente" de respuesta
const PENDING_ESTADOS = [
  INSCRIPCION_ESTADO.PENDIENTE,
  INSCRIPCION_ESTADO.POSTULADO,
];

export async function GET() {
  try {
    const session = await getUnifiedSession();
    
    if (!session.authenticated || !session.email) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const email = session.email.toLowerCase().trim();
    const hoyStr = toChileDateString(getNowInChile());

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

    type OperativoRow = {
      id: string;
      titulo: string;
      slug: string;
      fecha_inicio: string | null;
      fecha_fin: string | null;
      lugar: string | null;
      ubicacion: string | null;
      estado: string;
      whatsapp_grupo_url: string | null;
    };

    // 1. Buscar voluntario por email
    const { data: voluntarioData, error: volError } = await supabaseService
      .from("voluntarios")
      .select("id, nombres, apellidos, email, rut, profesion")
      .eq("email", email)
      .maybeSingle();

    if (volError && volError.code !== "PGRST116") {
      console.error("[mi-cuenta/datos] Error buscando voluntario:", volError);
    }

    const voluntario = voluntarioData as VoluntarioRow | null;

    // Si no hay voluntario registrado, retornar datos vacíos
    if (!voluntario) {
      return NextResponse.json({
        voluntario: null,
        inscripciones: [],
        porAsistir: [],
        finalizados: [],
        pendientes: [],
      });
    }

    // 2. Buscar inscripciones del voluntario desde la tabla CORRECTA: "inscripciones"
    const { data: inscripcionesData, error: inscError } = await supabaseService
      .from("inscripciones")
      .select("id, estado, created_at, operativo_id")
      .eq("voluntario_id", voluntario.id)
      .order("created_at", { ascending: false })
      .limit(100);
    
    const inscripciones = (inscripcionesData || []) as InscripcionRow[];

    if (inscError) {
      console.error("[mi-cuenta/datos] Error buscando inscripciones:", inscError);
      return NextResponse.json({
        voluntario,
        inscripciones: [],
        porAsistir: [],
        finalizados: [],
        pendientes: [],
      });
    }

    // 3. Obtener operativos relacionados con más campos
    const operativoIds = [...new Set(
      inscripciones
        .map(i => i.operativo_id)
        .filter((id): id is string => Boolean(id))
    )];

    const operativosMap: Record<string, OperativoRow> = {};

    if (operativoIds.length > 0) {
      const { data: operativosData } = await supabaseService
        .from("operativos")
        .select("id, titulo, slug, fecha_inicio, fecha_fin, lugar, ubicacion, estado, whatsapp_grupo_url")
        .in("id", operativoIds);

      const operativos = (operativosData || []) as OperativoRow[];
      for (const op of operativos) {
        operativosMap[op.id] = op;
      }
    }

    // 4. Combinar inscripciones con operativos
    const inscripcionesConOperativo = inscripciones.map(insc => {
      const op = insc.operativo_id ? operativosMap[insc.operativo_id] : null;
      return {
        id: insc.id,
        estado: insc.estado || "pendiente",
        created_at: insc.created_at,
        operativo: op ? {
          id: op.id,
          titulo: op.titulo,
          slug: op.slug,
          fecha_inicio: op.fecha_inicio,
          fecha_fin: op.fecha_fin,
          lugar: op.lugar || op.ubicacion || null,
          estado: op.estado,
          whatsapp_grupo_url: op.whatsapp_grupo_url,
        } : null,
      };
    });

    // 5. Clasificar inscripciones
    // Por asistir: estado confirmado/aprobado + fecha futura (>= hoy)
    const porAsistir = inscripcionesConOperativo.filter(i => {
      if (!i.operativo?.fecha_inicio) return false;
      const estadoNorm = (i.estado || "").toLowerCase();
      if (!CONFIRMED_ESTADOS.includes(estadoNorm as typeof CONFIRMED_ESTADOS[number])) return false;
      // Comparar fechas en formato YYYY-MM-DD para evitar problemas de timezone
      const fechaInicio = i.operativo.fecha_inicio.slice(0, 10);
      return fechaInicio >= hoyStr;
    }).sort((a, b) => {
      // Ordenar por fecha más próxima primero
      const fechaA = a.operativo?.fecha_inicio || "";
      const fechaB = b.operativo?.fecha_inicio || "";
      return fechaA.localeCompare(fechaB);
    });

    // Finalizados: estado confirmado/aprobado/asistio + fecha pasada
    const finalizados = inscripcionesConOperativo.filter(i => {
      if (!i.operativo?.fecha_fin && !i.operativo?.fecha_inicio) return false;
      const estadoNorm = (i.estado || "").toLowerCase();
      if (!CONFIRMED_ESTADOS.includes(estadoNorm as typeof CONFIRMED_ESTADOS[number])) return false;
      // Usar fecha_fin si existe, sino fecha_inicio
      const fechaRef = (i.operativo.fecha_fin || i.operativo.fecha_inicio)?.slice(0, 10) || "";
      return fechaRef < hoyStr;
    }).sort((a, b) => {
      // Ordenar por fecha más reciente primero
      const fechaA = (a.operativo?.fecha_fin || a.operativo?.fecha_inicio) || "";
      const fechaB = (b.operativo?.fecha_fin || b.operativo?.fecha_inicio) || "";
      return fechaB.localeCompare(fechaA);
    });

    // Pendientes: estado postulado/pendiente
    const pendientes = inscripcionesConOperativo.filter(i => {
      const estadoNorm = (i.estado || "").toLowerCase();
      return PENDING_ESTADOS.includes(estadoNorm as typeof PENDING_ESTADOS[number]);
    }).sort((a, b) => {
      // Ordenar por fecha de postulación más reciente
      const fechaA = a.created_at || "";
      const fechaB = b.created_at || "";
      return fechaB.localeCompare(fechaA);
    });

    return NextResponse.json({
      voluntario,
      inscripciones: inscripcionesConOperativo,
      porAsistir,
      finalizados,
      pendientes,
    });

  } catch (error) {
    console.error("[mi-cuenta/datos] Error:", error);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500 }
    );
  }
}
