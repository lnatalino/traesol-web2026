// src/lib/quirurgico/casosService.ts
// Servicio para gestionar casos quirúrgicos (participación paciente-operativo)
// NOTA: Requiere ejecutar la migración 20260124_casos_quirurgicos_y_encuestas.sql

import { supabaseService } from "@/lib/supabaseService";
import type { 
  CasoQuirurgico, 
  CasoQuirurgicoInsert, 
  CasoQuirurgicoUpdate,
  CasoQuirurgicoWithPaciente,
  CasoQuirurgicoAdminDetail 
} from "./casoTypes";

// Tipo helper para hacer cast de las respuestas de Supabase
// mientras la migración no está en producción
type SupabaseAny = unknown;

// =====================================================
// CRUD BÁSICO
// =====================================================

export async function getCasoById(id: string): Promise<CasoQuirurgico | null> {
  const { data, error } = await supabaseService
    .from("casos_quirurgicos")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("[casosService] getCasoById error:", error);
    return null;
  }

  return data as SupabaseAny as CasoQuirurgico;
}

export async function getCasoWithPaciente(id: string): Promise<CasoQuirurgicoWithPaciente | null> {
  const { data, error } = await supabaseService
    .from("casos_quirurgicos")
    .select(`
      *,
      paciente:pacientes(
        id, nombres, apellidos, rut, fecha_nacimiento, genero,
        telefono, email, direccion, ciudad_origen
      ),
      operativo:operativos_quirurgicos(
        id, titulo, slug, fecha_inicio, fecha_fin, ciudad, lugar, estado
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("[casosService] getCasoWithPaciente error:", error);
    return null;
  }

  return data as unknown as CasoQuirurgicoWithPaciente;
}

export async function getCasoAdminDetail(id: string): Promise<CasoQuirurgicoAdminDetail | null> {
  const { data, error } = await supabaseService
    .from("casos_quirurgicos")
    .select(`
      *,
      paciente:pacientes(
        id, nombres, apellidos, rut, fecha_nacimiento, genero,
        telefono, email, direccion, ciudad_origen
      ),
      operativo:operativos_quirurgicos(
        id, titulo, slug, fecha_inicio, fecha_fin, ciudad, lugar, estado
      )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("[casosService] getCasoAdminDetail error:", error);
    return null;
  }

  // Parsear data con tipos seguros
  const casoData = data as SupabaseAny as {
    id: string;
    paciente_id: string;
    operativo_quirurgico_id: string;
    estado: string;
    created_at: string;
    updated_at: string;
    paciente: unknown;
    operativo: unknown;
  };

  // Obtener datos relacionados
  const [contactos, requerimientos, archivos, portalToken] = await Promise.all([
    supabaseService
      .from("paciente_contactos")
      .select("*")
      .eq("caso_id", id)
      .order("es_principal", { ascending: false }),
    supabaseService
      .from("paciente_requerimientos")
      .select("*")
      .eq("caso_id", id)
      .order("created_at", { ascending: false }),
    supabaseService
      .from("paciente_archivos")
      .select("*")
      .eq("caso_id", id)
      .order("created_at", { ascending: false }),
    supabaseService
      .from("paciente_portal_tokens")
      .select("id, expires_at, last_used_at, revoked_at, created_at")
      .eq("caso_id", id)
      .is("revoked_at", null)
      .maybeSingle()
  ]);

  const tokenData = portalToken.data as SupabaseAny as {
    id: string;
    expires_at: string;
    last_used_at: string | null;
    revoked_at: string | null;
    created_at: string;
  } | null;

  return {
    ...casoData,
    paciente: casoData.paciente,
    operativo: casoData.operativo,
    contactos: (contactos.data || []) as SupabaseAny,
    requerimientos: (requerimientos.data || []) as SupabaseAny,
    archivos: (archivos.data || []) as SupabaseAny,
    portal_token: tokenData ? {
      ...tokenData,
      is_active: !tokenData.revoked_at && new Date(tokenData.expires_at) > new Date(),
      is_expired: new Date(tokenData.expires_at) <= new Date()
    } : null
  } as CasoQuirurgicoAdminDetail;
}

// =====================================================
// LISTADOS
// =====================================================

export async function getCasosByOperativo(operativoId: string): Promise<CasoQuirurgicoWithPaciente[]> {
  const { data, error } = await supabaseService
    .from("casos_quirurgicos")
    .select(`
      *,
      paciente:pacientes(
        id, nombres, apellidos, rut, email, telefono, ciudad_origen
      )
    `)
    .eq("operativo_quirurgico_id", operativoId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[casosService] getCasosByOperativo error:", error);
    return [];
  }

  return data as unknown as CasoQuirurgicoWithPaciente[];
}

export async function getCasosByPaciente(pacienteId: string): Promise<CasoQuirurgicoWithPaciente[]> {
  const { data, error } = await supabaseService
    .from("casos_quirurgicos")
    .select(`
      *,
      operativo:operativos_quirurgicos(
        id, titulo, slug, fecha_inicio, fecha_fin, ciudad, estado
      )
    `)
    .eq("paciente_id", pacienteId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[casosService] getCasosByPaciente error:", error);
    return [];
  }

  return data as unknown as CasoQuirurgicoWithPaciente[];
}

// =====================================================
// CREAR / ACTUALIZAR / ELIMINAR
// =====================================================

export async function createCaso(data: CasoQuirurgicoInsert): Promise<CasoQuirurgico | null> {
  const { data: created, error } = await supabaseService
    .from("casos_quirurgicos")
    // @ts-expect-error - tabla casos_quirurgicos será creada por migración SQL
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error("[casosService] createCaso error:", error);
    return null;
  }

  return created as CasoQuirurgico;
}

export async function updateCaso(id: string, data: CasoQuirurgicoUpdate): Promise<CasoQuirurgico | null> {
  const { data: updated, error } = await supabaseService
    .from("casos_quirurgicos")
    // @ts-expect-error - tabla casos_quirurgicos será creada por migración SQL
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[casosService] updateCaso error:", error);
    return null;
  }

  return updated as CasoQuirurgico;
}

export async function deleteCaso(id: string): Promise<boolean> {
  const { error } = await supabaseService
    .from("casos_quirurgicos")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[casosService] deleteCaso error:", error);
    return false;
  }

  return true;
}

// =====================================================
// BÚSQUEDA DE PACIENTE EXISTENTE
// =====================================================

interface PacienteExistente {
  id: string;
  nombres: string;
  apellidos: string;
  rut: string | null;
  email: string | null;
  telefono: string | null;
  ciudad_origen: string | null;
  casos_count: number;
}

export async function buscarPacientePorRut(rut: string): Promise<PacienteExistente | null> {
  // Normalizar RUT (quitar puntos, guiones, etc.)
  const rutNormalizado = rut.replace(/[^0-9kK]/g, "").toUpperCase();
  
  const { data, error } = await supabaseService
    .from("pacientes")
    .select(`
      id, nombres, apellidos, rut, email, telefono, ciudad_origen,
      casos_quirurgicos(count)
    `)
    .or(`rut.eq.${rutNormalizado},rut.ilike.%${rutNormalizado}%`)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  // Tipar data con cast seguro
  const pacienteData = data as SupabaseAny as {
    id: string;
    nombres: string;
    apellidos: string;
    rut: string;
    email: string | null;
    telefono: string | null;
    ciudad_origen: string | null;
    casos_quirurgicos: Array<{ count: number }>;
  };

  return {
    ...pacienteData,
    casos_count: pacienteData.casos_quirurgicos?.[0]?.count || 0
  } as PacienteExistente;
}

// =====================================================
// COPIAR DATOS DEL ÚLTIMO CASO
// =====================================================

interface DatosUltimoCaso {
  diagnostico: string | null;
  cirugia_planificada: string | null;
  requiere_vuelo: boolean;
  requiere_hospedaje: boolean;
  contactos: Array<{
    nombre: string;
    relacion: string | null;
    telefono: string;
    email: string | null;
    es_principal: boolean;
  }>;
}

export async function obtenerDatosUltimoCaso(pacienteId: string): Promise<DatosUltimoCaso | null> {
  // Obtener el último caso del paciente
  const { data: ultimoCasoData, error } = await supabaseService
    .from("casos_quirurgicos")
    .select(`
      diagnostico,
      cirugia_planificada,
      requiere_vuelo,
      requiere_hospedaje
    `)
    .eq("paciente_id", pacienteId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !ultimoCasoData) {
    return null;
  }

  const ultimoCaso = ultimoCasoData as SupabaseAny as {
    diagnostico: string | null;
    cirugia_planificada: string | null;
    requiere_vuelo: boolean;
    requiere_hospedaje: boolean;
  };

  // Obtener contactos del último caso
  const { data: contactosData } = await supabaseService
    .from("paciente_contactos")
    .select("nombre, relacion, telefono, email, es_principal")
    .eq("paciente_id", pacienteId)
    .order("es_principal", { ascending: false });

  const contactos = (contactosData || []) as SupabaseAny as Array<{
    nombre: string;
    relacion: string | null;
    telefono: string;
    email: string | null;
    es_principal: boolean;
  }>;

  return {
    ...ultimoCaso,
    contactos
  } as DatosUltimoCaso;
}

// =====================================================
// CREAR CASO PARA PACIENTE EXISTENTE O NUEVO
// =====================================================

interface CrearCasoParams {
  operativo_quirurgico_id: string;
  paciente_id?: string; // Si existe
  paciente_nuevo?: {
    nombres: string;
    apellidos: string;
    rut?: string;
    fecha_nacimiento?: string;
    genero?: string;
    telefono?: string;
    email?: string;
    direccion?: string;
    ciudad_origen?: string;
  };
  caso_data?: Partial<CasoQuirurgicoInsert>;
  copiar_contactos?: boolean;
}

export async function crearCasoCompleto(params: CrearCasoParams): Promise<{
  caso: CasoQuirurgico;
  paciente_id: string;
  es_paciente_nuevo: boolean;
} | null> {
  let pacienteId = params.paciente_id;
  let esPacienteNuevo = false;

  // Si no hay paciente_id, crear uno nuevo
  if (!pacienteId && params.paciente_nuevo) {
    const { data: nuevoPaciente, error } = await supabaseService
      .from("pacientes")
      // @ts-expect-error - tabla pacientes puede tener schema diferente
      .insert(params.paciente_nuevo)
      .select("id")
      .single();

    if (error || !nuevoPaciente) {
      console.error("[casosService] Error creando paciente:", error);
      return null;
    }

    pacienteId = (nuevoPaciente as SupabaseAny as { id: string }).id;
    esPacienteNuevo = true;
  }

  if (!pacienteId) {
    console.error("[casosService] No se pudo determinar paciente_id");
    return null;
  }

  // Crear el caso
  const casoData = {
    paciente_id: pacienteId,
    operativo_quirurgico_id: params.operativo_quirurgico_id,
    estado: "activo",
    ...(params.caso_data || {})
  } as CasoQuirurgicoInsert;

  const caso = await createCaso(casoData);
  if (!caso) {
    return null;
  }

  // Copiar contactos del último caso si se solicitó
  if (params.copiar_contactos && !esPacienteNuevo) {
    const datosAnteriores = await obtenerDatosUltimoCaso(pacienteId);
    if (datosAnteriores?.contactos?.length) {
      const contactosParaCopiar = datosAnteriores.contactos.map(c => ({
        ...c,
        paciente_id: pacienteId!,
        caso_id: caso.id
      }));

      await supabaseService
        .from("paciente_contactos")
        // @ts-expect-error - inserts con schema flexible
        .insert(contactosParaCopiar);
    }
  }

  return {
    caso,
    paciente_id: pacienteId,
    es_paciente_nuevo: esPacienteNuevo
  };
}
