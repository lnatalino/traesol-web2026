// src/app/paciente/portal/_components/PortalContenido.tsx
// Contenido principal del portal del paciente (server component wrapper)

import { Suspense } from "react";
import { supabaseService } from "@/lib/supabaseService";
import { PortalCliente } from "./PortalCliente";
import type { PortalPacienteData } from "@/lib/quirurgico/types";

interface PortalContenidoProps {
  pacienteId: string;
}

async function fetchPortalData(pacienteId: string): Promise<PortalPacienteData | null> {
  try {
    // Tipos temporales para tablas no generadas
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
    type RequerimientoRow = { id: string; titulo: string; descripcion: string | null; estado: string };
    type ContactoRow = { nombre: string; telefono: string };
    
    // Obtener datos del paciente
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
      console.error("[PortalContenido] paciente error:", pacienteError);
      return null;
    }

    // Obtener operativo si existe
    let operativo = null;
    if (paciente.operativo_quirurgico_id) {
      const { data: op } = await supabaseService
        .from("operativos_quirurgicos")
        .select("titulo, ciudad, lugar")
        .eq("id", paciente.operativo_quirurgico_id)
        .single() as { data: { titulo: string; ciudad: string | null; lugar: string | null } | null; error: unknown };
      operativo = op;
    }

    // Obtener requerimientos con conteo de archivos
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
      .limit(1) as { data: ContactoRow[] | null; error: unknown };

    const contactoEmergencia = contactos?.[0] || null;

    return {
      id: paciente.id,
      nombres: paciente.nombres,
      apellidos: paciente.apellidos,
      nombre_completo: `${paciente.nombres} ${paciente.apellidos}`.trim(),
      operativo,
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
  } catch (error) {
    console.error("[PortalContenido] fetch error:", error);
    return null;
  }
}

export async function PortalContenido({ pacienteId }: PortalContenidoProps) {
  const data = await fetchPortalData(pacienteId);

  if (!data) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
          <p className="text-slate-600">No se pudo cargar la información. Por favor intenta nuevamente.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50 to-white">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Suspense fallback={<PortalSkeleton />}>
          <PortalCliente initialData={data} />
        </Suspense>
      </div>
    </main>
  );
}

function PortalSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-slate-200 rounded w-48 mx-auto"></div>
      <div className="h-4 bg-slate-200 rounded w-64 mx-auto"></div>
      <div className="rounded-3xl bg-slate-100 h-48"></div>
      <div className="rounded-3xl bg-slate-100 h-32"></div>
    </div>
  );
}
