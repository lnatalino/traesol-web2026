import { redirect } from "next/navigation";
import { AdminPageHeader, StatTile, StatTileGrid } from "@/components/admin/ui";
import { getAdminSession } from "@/lib/adminSession";
import { getErrorMessage } from "@/lib/errors";
import { supabaseService } from "@/lib/supabaseService";
import { isOperativoParaInvitaciones, getNowInChile } from "@/lib/operativosShared";
import { Calendar, Users } from "lucide-react";
import InviteManager from "./InviteManager";
import type { InviteOperativo, InviteVolunteer } from "./InviteManager";
import type { InvitacionHistorialRow } from "./InvitacionesHistorial";

export const dynamic = "force-dynamic";

async function fetchVolunteers(): Promise<InviteVolunteer[]> {
  const { data, error } = await supabaseService
    .from("voluntarios")
    .select("id,nombres,apellidos,email,profesion,especialidad")
    .order("nombres", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as InviteVolunteer[];
}

async function fetchOperativos(): Promise<InviteOperativo[]> {
  const { data, error } = await supabaseService
    .from("operativos")
    .select("id,titulo,fecha_inicio,fecha_fin,lugar,estado")
    .eq("estado", "publicado")
    .order("fecha_inicio", { ascending: true });

  if (error) {
    throw error;
  }

  // Usar hora de Chile para consistencia con timezone
  const referenceDate = getNowInChile();
  
  // Filtrar: publicados Y vigentes (no finalizados)
  // isOperativoParaInvitaciones incluye futuros Y en curso
  return ((data ?? []) as InviteOperativo[]).filter((item) => isOperativoParaInvitaciones(item, referenceDate));
}

type InscripcionRow = {
  id: string;
  created_at: string | null;
  operativo_id: string;
  estado: string | null;
  voluntario_id: string | null;
};

type VoluntarioSimple = {
  id: string;
  nombres: string | null;
  apellidos: string | null;
  email: string | null;
};

async function fetchInvitacionesHistorial(operativoIds: string[]): Promise<Map<string, InvitacionHistorialRow[]>> {
  if (operativoIds.length === 0) {
    return new Map();
  }

  // Query 1: Obtener inscripciones con origen "invitacion"
  const { data: inscData, error: inscError } = await supabaseService
    .from("inscripciones")
    .select("id,created_at,operativo_id,estado,voluntario_id")
    .in("operativo_id", operativoIds)
    .eq("origen", "invitacion")
    .order("created_at", { ascending: false });

  if (inscError) {
    console.error("[invitaciones] Error fetching inscripciones:", {
      code: inscError.code,
      message: inscError.message,
      details: inscError.details,
      hint: inscError.hint,
    });
    // Retornar vacío en lugar de crashear
    return new Map();
  }

  const inscripciones = (inscData ?? []) as InscripcionRow[];
  
  if (inscripciones.length === 0) {
    return new Map();
  }

  // Extraer voluntario IDs únicos
  const voluntarioIds = Array.from(
    new Set(
      inscripciones
        .map((row) => row.voluntario_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  // Query 2: Obtener datos de voluntarios (si hay IDs)
  let voluntarioMap = new Map<string, VoluntarioSimple>();
  
  if (voluntarioIds.length > 0) {
    const { data: volData, error: volError } = await supabaseService
      .from("voluntarios")
      .select("id,nombres,apellidos,email")
      .in("id", voluntarioIds);

    if (volError) {
      console.error("[invitaciones] Error fetching voluntarios:", {
        code: volError.code,
        message: volError.message,
        details: volError.details,
        hint: volError.hint,
      });
      // Continuar sin datos de voluntarios (mostrarán "Voluntario eliminado")
    } else {
      const voluntarios = (volData ?? []) as VoluntarioSimple[];
      voluntarioMap = new Map(voluntarios.map((v) => [v.id, v]));
    }
  }

  // Debug logging (solo en desarrollo)
  if (process.env.NODE_ENV !== "production") {
    console.log("[invitaciones] Query results:", {
      operativoIds,
      totalInscripciones: inscripciones.length,
      uniqueVoluntarios: voluntarioIds.length,
      voluntariosFound: voluntarioMap.size,
    });
  }

  // Agrupar por operativo
  const result = new Map<string, InvitacionHistorialRow[]>();

  for (const row of inscripciones) {
    const operativoId = row.operativo_id;
    if (!result.has(operativoId)) {
      result.set(operativoId, []);
    }

    const voluntario = row.voluntario_id ? voluntarioMap.get(row.voluntario_id) : null;
    
    result.get(operativoId)!.push({
      id: row.id,
      created_at: row.created_at,
      estado: row.estado,
      voluntario: voluntario ? {
        id: voluntario.id,
        nombres: voluntario.nombres,
        apellidos: voluntario.apellidos,
        email: voluntario.email,
      } : null,
    });
  }

  return result;
}

export default async function AdminInvitacionesPage() {
  const session = await getAdminSession();

  if (!session.allowed) {
    redirect("/login?next=/admin/invitaciones");
  }

  let volunteers: InviteVolunteer[] = [];
  let operativos: InviteOperativo[] = [];
  let invitacionesPorOperativo = new Map<string, InvitacionHistorialRow[]>();
  let errorMessage = "";

  try {
    [volunteers, operativos] = await Promise.all([fetchVolunteers(), fetchOperativos()]);
    
    // Fetch invitaciones historial for all operativos
    const operativoIds = operativos.map((op) => op.id);
    invitacionesPorOperativo = await fetchInvitacionesHistorial(operativoIds);
  } catch (error: unknown) {
    errorMessage = getErrorMessage(error, "No se pudieron cargar los datos iniciales.");
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        backHref="/admin"
        eyebrow="Invitaciones"
        title="Enviar invitaciones"
        description="Selecciona un operativo y envía convocatorias a voluntarios filtrados por profesión o especialidad."
        errorMessage={errorMessage}
      />

      {/* Stats globales */}
      <StatTileGrid>
        <StatTile 
          icon={<Users className="h-4 w-4" />}
          label="Voluntarios disponibles"
          value={volunteers.length}
        />
        <StatTile 
          icon={<Calendar className="h-4 w-4" />}
          label="Operativos abiertos"
          value={operativos.length}
          highlight={operativos.length > 0}
          highlightVariant={operativos.length > 0 ? "blue" : "amber"}
        />
      </StatTileGrid>

      <InviteManager 
        volunteers={volunteers} 
        operativos={operativos} 
        invitacionesPorOperativo={invitacionesPorOperativo}
        errorMessage={errorMessage} 
      />
    </div>
  );
}
