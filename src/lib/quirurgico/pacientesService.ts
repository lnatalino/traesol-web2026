// src/lib/quirurgico/pacientesService.ts
// Servicio para operaciones CRUD de pacientes

import { supabaseService } from "../supabaseService";
import type {
  Paciente,
  PacienteInsert,
  PacienteUpdate,
  PacienteListItem,
  PacienteAdminDetail,
  PacienteContacto,
  PacienteContactoInsert,
  PacienteRequerimiento,
  PacienteRequerimientoInsert,
  PacienteArchivo,
  OperativoQuirurgicoSummary,
} from "./types";
import { getPortalTokenInfo } from "./portalTokens";

// =====================================================
// PACIENTES
// =====================================================

const PACIENTE_LIST_SELECT = `
  id, nombres, apellidos, rut, email, telefono, ciudad_origen,
  fecha_cirugia, estado, requiere_vuelo, requiere_hospedaje,
  operativo_quirurgico_id
`;

const PACIENTE_DETAIL_SELECT = `*`;

export async function listPacientes(filters?: {
  operativoId?: string;
  estado?: string;
  search?: string;
  limit?: number;
}): Promise<PacienteListItem[]> {
  let query = supabaseService
    .from("pacientes")
    .select(PACIENTE_LIST_SELECT)
    .order("created_at", { ascending: false });

  if (filters?.operativoId) {
    query = query.eq("operativo_quirurgico_id", filters.operativoId);
  }

  if (filters?.estado) {
    query = query.eq("estado", filters.estado);
  }

  if (filters?.search) {
    const pattern = `%${filters.search.replace(/%/g, "")}%`;
    query = query.or(`nombres.ilike.${pattern},apellidos.ilike.${pattern},rut.ilike.${pattern}`);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[pacientesService] list error:", error);
    throw new Error("No se pudieron cargar los pacientes");
  }

  return (data || []) as PacienteListItem[];
}

export async function getPaciente(id: string): Promise<Paciente | null> {
  const { data, error } = await supabaseService
    .from("pacientes")
    .select(PACIENTE_DETAIL_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[pacientesService] get error:", error);
    throw new Error("No se pudo cargar el paciente");
  }

  return data as Paciente | null;
}

export async function getPacienteDetail(id: string): Promise<PacienteAdminDetail | null> {
  // Obtener paciente
  const paciente = await getPaciente(id);
  if (!paciente) return null;

  // Cargar datos relacionados en paralelo
  // Usamos try/catch individual para que falle gracefully
  const [operativoRes, contactosRes, requerimientosRes, archivosRes, tokenInfo] = await Promise.all([
    paciente.operativo_quirurgico_id
      ? supabaseService
          .from("operativos_quirurgicos" as unknown as never)
          .select("id, titulo, slug, ciudad, lugar, fecha_inicio, publicado, estado")
          .eq("id", paciente.operativo_quirurgico_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabaseService
      .from("paciente_contactos" as unknown as never)
      .select("*")
      .eq("paciente_id", id)
      .order("es_principal", { ascending: false }),
    supabaseService
      .from("paciente_requerimientos" as unknown as never)
      .select("*")
      .eq("paciente_id", id)
      .order("created_at", { ascending: true }),
    supabaseService
      .from("paciente_archivos" as unknown as never)
      .select("*")
      .eq("paciente_id", id)
      .order("created_at", { ascending: false }),
    getPortalTokenInfo(id).catch(() => null),
  ]);

  // Log errors pero no fallar
  if (contactosRes.error) {
    console.error("[pacientesService] contactos error:", contactosRes.error);
  }
  if (requerimientosRes.error) {
    console.error("[pacientesService] requerimientos error:", requerimientosRes.error);
  }
  if (archivosRes.error) {
    console.error("[pacientesService] archivos error:", archivosRes.error);
  }

  return {
    ...paciente,
    operativo: operativoRes.data as OperativoQuirurgicoSummary | null,
    contactos: (contactosRes.data || []) as PacienteContacto[],
    requerimientos: (requerimientosRes.data || []) as PacienteRequerimiento[],
    archivos: (archivosRes.data || []) as PacienteArchivo[],
    portal_token: tokenInfo,
  };
}

export async function createPaciente(data: PacienteInsert): Promise<Paciente> {
  const { data: created, error } = await supabaseService
    .from("pacientes" as unknown as never)
    .insert(data as never)
    .select()
    .single();

  if (error) {
    console.error("[pacientesService] create error:", error);
    throw new Error("No se pudo crear el paciente");
  }

  return created as Paciente;
}

export async function updatePaciente(id: string, data: PacienteUpdate): Promise<Paciente> {
  const { data: updated, error } = await supabaseService
    .from("pacientes" as unknown as never)
    .update({ ...data, updated_at: new Date().toISOString() } as never)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[pacientesService] update error:", error);
    throw new Error("No se pudo actualizar el paciente");
  }

  return updated as Paciente;
}

export async function deletePaciente(id: string): Promise<void> {
  const { error } = await supabaseService
    .from("pacientes" as unknown as never)
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[pacientesService] delete error:", error);
    throw new Error("No se pudo eliminar el paciente");
  }
}

// =====================================================
// CONTACTOS DE EMERGENCIA
// =====================================================

export async function listContactos(pacienteId: string): Promise<PacienteContacto[]> {
  const { data, error } = await supabaseService
    .from("paciente_contactos")
    .select("*")
    .eq("paciente_id", pacienteId)
    .order("es_principal", { ascending: false });

  if (error) {
    console.error("[pacientesService] list contactos error:", error);
    throw new Error("No se pudieron cargar los contactos");
  }

  return (data || []) as PacienteContacto[];
}

export async function createContacto(data: PacienteContactoInsert): Promise<PacienteContacto> {
  // Si es principal, desmarcar otros
  if (data.es_principal) {
    await supabaseService
      .from("paciente_contactos" as unknown as never)
      .update({ es_principal: false } as never)
      .eq("paciente_id", data.paciente_id);
  }

  const { data: created, error } = await supabaseService
    .from("paciente_contactos" as unknown as never)
    .insert(data as never)
    .select()
    .single();

  if (error) {
    console.error("[pacientesService] create contacto error:", error);
    throw new Error("No se pudo crear el contacto");
  }

  return created as PacienteContacto;
}

export async function updateContacto(
  id: string,
  pacienteId: string,
  data: Partial<PacienteContacto>
): Promise<PacienteContacto> {
  // Si se marca como principal, desmarcar otros
  if (data.es_principal) {
    await supabaseService
      .from("paciente_contactos" as unknown as never)
      .update({ es_principal: false } as never)
      .eq("paciente_id", pacienteId)
      .neq("id", id);
  }

  const { data: updated, error } = await supabaseService
    .from("paciente_contactos" as unknown as never)
    .update(data as never)
    .eq("id", id)
    .eq("paciente_id", pacienteId)
    .select()
    .single();

  if (error) {
    console.error("[pacientesService] update contacto error:", error);
    throw new Error("No se pudo actualizar el contacto");
  }

  return updated as PacienteContacto;
}

export async function deleteContacto(id: string, pacienteId: string): Promise<void> {
  const { error } = await supabaseService
    .from("paciente_contactos" as unknown as never)
    .delete()
    .eq("id", id)
    .eq("paciente_id", pacienteId);

  if (error) {
    console.error("[pacientesService] delete contacto error:", error);
    throw new Error("No se pudo eliminar el contacto");
  }
}

// =====================================================
// REQUERIMIENTOS
// =====================================================

export async function listRequerimientos(pacienteId: string): Promise<PacienteRequerimiento[]> {
  const { data, error } = await supabaseService
    .from("paciente_requerimientos")
    .select("*")
    .eq("paciente_id", pacienteId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[pacientesService] list requerimientos error:", error);
    throw new Error("No se pudieron cargar los requerimientos");
  }

  return (data || []) as PacienteRequerimiento[];
}

export async function createRequerimiento(data: PacienteRequerimientoInsert): Promise<PacienteRequerimiento> {
  const { data: created, error } = await supabaseService
    .from("paciente_requerimientos" as unknown as never)
    .insert(data as never)
    .select()
    .single();

  if (error) {
    console.error("[pacientesService] create requerimiento error:", error);
    throw new Error("No se pudo crear el requerimiento");
  }

  return created as PacienteRequerimiento;
}

export async function updateRequerimiento(
  id: string,
  pacienteId: string,
  data: Partial<PacienteRequerimiento>
): Promise<PacienteRequerimiento> {
  const { data: updated, error } = await supabaseService
    .from("paciente_requerimientos" as unknown as never)
    .update({ ...data, updated_at: new Date().toISOString() } as never)
    .eq("id", id)
    .eq("paciente_id", pacienteId)
    .select()
    .single();

  if (error) {
    console.error("[pacientesService] update requerimiento error:", error);
    throw new Error("No se pudo actualizar el requerimiento");
  }

  return updated as PacienteRequerimiento;
}

export async function deleteRequerimiento(id: string, pacienteId: string): Promise<void> {
  const { error } = await supabaseService
    .from("paciente_requerimientos" as unknown as never)
    .delete()
    .eq("id", id)
    .eq("paciente_id", pacienteId);

  if (error) {
    console.error("[pacientesService] delete requerimiento error:", error);
    throw new Error("No se pudo eliminar el requerimiento");
  }
}

// =====================================================
// ARCHIVOS
// =====================================================

export async function listArchivos(pacienteId: string): Promise<PacienteArchivo[]> {
  const { data, error } = await supabaseService
    .from("paciente_archivos")
    .select("*")
    .eq("paciente_id", pacienteId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[pacientesService] list archivos error:", error);
    throw new Error("No se pudieron cargar los archivos");
  }

  return (data || []) as PacienteArchivo[];
}

export async function createArchivoRecord(data: {
  paciente_id: string;
  requerimiento_id?: string | null;
  storage_path: string;
  filename: string;
  mimetype?: string;
  size_bytes?: number;
  uploaded_by: "paciente" | "admin";
  notas?: string;
}): Promise<PacienteArchivo> {
  const { data: created, error } = await supabaseService
    .from("paciente_archivos" as unknown as never)
    .insert(data as never)
    .select()
    .single();

  if (error) {
    console.error("[pacientesService] create archivo error:", error);
    throw new Error("No se pudo registrar el archivo");
  }

  return created as PacienteArchivo;
}

export async function deleteArchivo(id: string, pacienteId: string): Promise<{ storagePath: string }> {
  // Primero obtener el path para eliminarlo del storage
  const { data: archivo } = await supabaseService
    .from("paciente_archivos")
    .select("storage_path")
    .eq("id", id)
    .eq("paciente_id", pacienteId)
    .single();

  if (!archivo) {
    throw new Error("Archivo no encontrado");
  }

  const { error } = await supabaseService
    .from("paciente_archivos" as unknown as never)
    .delete()
    .eq("id", id)
    .eq("paciente_id", pacienteId);

  if (error) {
    console.error("[pacientesService] delete archivo error:", error);
    throw new Error("No se pudo eliminar el archivo");
  }

  return { storagePath: (archivo as { storage_path: string }).storage_path };
}
