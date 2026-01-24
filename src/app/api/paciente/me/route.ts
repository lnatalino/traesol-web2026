// src/app/api/paciente/me/route.ts
// Endpoint para obtener datos del paciente autenticado via portal

import { NextResponse } from "next/server";
import { verifyPortalSession, refreshPortalSessionIfNeeded } from "@/lib/quirurgico/portalSession";
import { supabaseService } from "@/lib/supabaseService";
import type { PortalPacienteData } from "@/lib/quirurgico/types";

export async function GET() {
  try {
    // Verificar sesión del portal
    const pacienteId = await verifyPortalSession();

    if (!pacienteId) {
      return NextResponse.json(
        { error: "Sesión no válida. Por favor accede nuevamente desde el enlace." },
        { status: 401 }
      );
    }

    // Renovar sesión si está por expirar
    await refreshPortalSessionIfNeeded();

    // Obtener datos del paciente
    // Cast temporal para tablas no en tipos generados
    type PacienteRow = {
      id: string;
      nombres: string;
      apellidos: string;
      diagnostico: string | null;
      cirugia_planificada: string | null;
      fecha_cirugia: string | null;
      hora_cirugia: string | null;
      fecha_llegada_ciudad: string | null;
      fecha_regreso_ciudad: string | null;
      operativo_quirurgico_id: string | null;
    };
    
    const { data: paciente, error: pacienteError } = await supabaseService
      .from("pacientes")
      .select(`
        id, nombres, apellidos,
        diagnostico, cirugia_planificada, fecha_cirugia, hora_cirugia,
        fecha_llegada_ciudad, fecha_regreso_ciudad,
        operativo_quirurgico_id
      `)
      .eq("id", pacienteId)
      .single() as { data: PacienteRow | null; error: unknown };

    if (pacienteError || !paciente) {
      console.error("[api/paciente/me] paciente error:", pacienteError);
      return NextResponse.json(
        { error: "No se encontró el paciente" },
        { status: 404 }
      );
    }

    // Obtener operativo si existe
    let operativo = null;
    if (paciente.operativo_quirurgico_id) {
      const { data: op } = await supabaseService
        .from("operativos_quirurgicos")
        .select("titulo, ciudad, lugar")
        .eq("id", paciente.operativo_quirurgico_id)
        .single();
      operativo = op;
    }

    // Obtener requerimientos con conteo de archivos
    type RequerimientoRow = { id: string; titulo: string; descripcion: string | null; estado: string };
    const { data: requerimientos } = await supabaseService
      .from("paciente_requerimientos")
      .select("id, titulo, descripcion, estado")
      .eq("paciente_id", pacienteId)
      .order("created_at", { ascending: true }) as { data: RequerimientoRow[] | null; error: unknown };

    // Contar archivos por requerimiento
    const requerimientosConArchivos = await Promise.all(
      (requerimientos || []).map(async (req) => {
        const { count } = await supabaseService
          .from("paciente_archivos")
          .select("id", { count: "exact", head: true })
          .eq("requerimiento_id", req.id) as { count: number | null; error: unknown };

        return {
          ...req,
          archivos_count: count || 0,
        };
      })
    );

    // Contar requerimientos pendientes
    const pendientes = requerimientosConArchivos.filter(
      (r) => r.estado === "pendiente"
    ).length;

    // Obtener contacto de emergencia principal
    const { data: contactos } = await supabaseService
      .from("paciente_contactos")
      .select("nombre, telefono")
      .eq("paciente_id", pacienteId)
      .eq("es_principal", true)
      .limit(1);

    const contactoEmergencia = contactos?.[0] || null;

    const response: PortalPacienteData = {
      id: paciente.id,
      nombres: paciente.nombres,
      apellidos: paciente.apellidos,
      nombre_completo: `${paciente.nombres} ${paciente.apellidos}`.trim(),
      operativo: operativo,
      diagnostico: paciente.diagnostico,
      cirugia_planificada: paciente.cirugia_planificada,
      fecha_cirugia: paciente.fecha_cirugia,
      hora_cirugia: paciente.hora_cirugia,
      fecha_llegada_ciudad: paciente.fecha_llegada_ciudad,
      fecha_regreso_ciudad: paciente.fecha_regreso_ciudad,
      requerimientos_pendientes: pendientes,
      requerimientos: requerimientosConArchivos,
      contacto_emergencia: contactoEmergencia,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[api/paciente/me] error:", error);
    return NextResponse.json(
      { error: "Error al obtener los datos" },
      { status: 500 }
    );
  }
}
