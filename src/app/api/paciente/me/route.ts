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
      rut: string | null;
      fecha_nacimiento: string | null;
      genero: string | null;
      telefono: string | null;
      email: string | null;
      direccion: string | null;
      ciudad_origen: string | null;
      diagnostico: string | null;
      cirugia_planificada: string | null;
      fecha_cirugia: string | null;
      hora_cirugia: string | null;
      fecha_llegada_ciudad: string | null;
      fecha_regreso_ciudad: string | null;
      operativo_quirurgico_id: string | null;
      requiere_vuelo: boolean | null;
      requiere_hospedaje: boolean | null;
    };
    
    const { data: paciente, error: pacienteError } = await supabaseService
      .from("pacientes")
      .select(`
        id, nombres, apellidos, rut, fecha_nacimiento, genero,
        telefono, email, direccion, ciudad_origen,
        diagnostico, cirugia_planificada, fecha_cirugia, hora_cirugia,
        fecha_llegada_ciudad, fecha_regreso_ciudad,
        operativo_quirurgico_id, requiere_vuelo, requiere_hospedaje
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

    // Obtener contactos de emergencia
    type ContactoRow = { id: string; nombre: string; telefono: string; relacion: string | null; es_principal: boolean };
    const { data: contactos } = await supabaseService
      .from("paciente_contactos")
      .select("id, nombre, telefono, relacion, es_principal")
      .eq("paciente_id", pacienteId)
      .order("es_principal", { ascending: false }) as { data: ContactoRow[] | null; error: unknown };

    const contactoEmergencia = contactos?.[0] || null;

    // Obtener archivos del paciente (para la lista general)
    type ArchivoRow = { id: string; nombre_archivo: string; requerimiento_id: string | null; created_at: string };
    const { data: archivos } = await supabaseService
      .from("paciente_archivos")
      .select("id, nombre_archivo, requerimiento_id, created_at")
      .eq("paciente_id", pacienteId)
      .order("created_at", { ascending: false }) as { data: ArchivoRow[] | null; error: unknown };

    const response: PortalPacienteData = {
      id: paciente.id,
      nombres: paciente.nombres,
      apellidos: paciente.apellidos,
      nombre_completo: `${paciente.nombres} ${paciente.apellidos}`.trim(),
      rut: paciente.rut,
      fecha_nacimiento: paciente.fecha_nacimiento,
      genero: paciente.genero,
      telefono: paciente.telefono,
      email: paciente.email,
      direccion: paciente.direccion,
      ciudad_origen: paciente.ciudad_origen,
      operativo: operativo,
      diagnostico: paciente.diagnostico,
      cirugia_planificada: paciente.cirugia_planificada,
      fecha_cirugia: paciente.fecha_cirugia,
      hora_cirugia: paciente.hora_cirugia,
      fecha_llegada_ciudad: paciente.fecha_llegada_ciudad,
      fecha_regreso_ciudad: paciente.fecha_regreso_ciudad,
      requiere_vuelo: paciente.requiere_vuelo || false,
      requiere_hospedaje: paciente.requiere_hospedaje || false,
      requerimientos_pendientes: pendientes,
      requerimientos: requerimientosConArchivos,
      contacto_emergencia: contactoEmergencia,
      contactos_emergencia: (contactos || []).map(c => ({
        id: c.id,
        nombre: c.nombre,
        telefono: c.telefono,
        relacion: c.relacion,
        es_principal: c.es_principal,
      })),
      archivos: (archivos || []).map(a => ({
        id: a.id,
        filename: a.nombre_archivo,
        created_at: a.created_at,
        requerimiento_id: a.requerimiento_id,
      })),
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
