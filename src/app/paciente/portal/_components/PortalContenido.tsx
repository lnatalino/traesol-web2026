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
      requiere_vuelo: boolean;
      requiere_hospedaje: boolean;
      operativo_quirurgico_id: string | null;
    };
    type RequerimientoRow = { id: string; titulo: string; descripcion: string | null; estado: string };
    type ContactoRow = { id: string; nombre: string; relacion: string | null; telefono: string; es_principal: boolean };
    type ArchivoRow = { id: string; filename: string; created_at: string; requerimiento_id: string | null };
    
    // Obtener datos del paciente (incluyendo datos personales)
    const { data: paciente, error: pacienteError } = await supabaseService
      .from("pacientes")
      .select(`
        id, nombres, apellidos,
        rut, fecha_nacimiento, genero,
        telefono, email, direccion, ciudad_origen,
        diagnostico, cirugia_planificada, fecha_cirugia, hora_cirugia,
        fecha_llegada_ciudad, fecha_regreso_ciudad,
        requiere_vuelo, requiere_hospedaje,
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

    // Obtener todos los contactos de emergencia
    const { data: contactos } = await supabaseService
      .from("paciente_contactos")
      .select("id, nombre, relacion, telefono, es_principal")
      .eq("paciente_id", pacienteId)
      .order("es_principal", { ascending: false })
      .order("created_at", { ascending: true }) as { data: ContactoRow[] | null; error: unknown };

    const contactosEmergencia = contactos || [];
    const contactoPrincipal = contactosEmergencia.find(c => c.es_principal) || contactosEmergencia[0] || null;

    // Obtener archivos subidos por el paciente
    const { data: archivos } = await supabaseService
      .from("paciente_archivos")
      .select("id, filename, created_at, requerimiento_id")
      .eq("paciente_id", pacienteId)
      .order("created_at", { ascending: false }) as { data: ArchivoRow[] | null; error: unknown };

    return {
      id: paciente.id,
      nombres: paciente.nombres,
      apellidos: paciente.apellidos,
      nombre_completo: `${paciente.nombres} ${paciente.apellidos}`.trim(),
      
      // Datos personales
      rut: paciente.rut,
      fecha_nacimiento: paciente.fecha_nacimiento,
      genero: paciente.genero,
      telefono: paciente.telefono,
      email: paciente.email,
      direccion: paciente.direccion,
      ciudad_origen: paciente.ciudad_origen,
      
      operativo,
      equipo_medico: null, // TODO: Implementar cuando exista la tabla
      
      diagnostico: paciente.diagnostico,
      cirugia_planificada: paciente.cirugia_planificada,
      fecha_cirugia: paciente.fecha_cirugia,
      hora_cirugia: paciente.hora_cirugia,
      
      requiere_vuelo: paciente.requiere_vuelo,
      requiere_hospedaje: paciente.requiere_hospedaje,
      fecha_llegada_ciudad: paciente.fecha_llegada_ciudad,
      fecha_regreso_ciudad: paciente.fecha_regreso_ciudad,
      
      requerimientos_pendientes: pendientes,
      requerimientos: requerimientosConArchivos,
      
      contactos_emergencia: contactosEmergencia,
      contacto_emergencia: contactoPrincipal ? {
        nombre: contactoPrincipal.nombre,
        telefono: contactoPrincipal.telefono,
      } : null,
      
      archivos: archivos || [],
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
