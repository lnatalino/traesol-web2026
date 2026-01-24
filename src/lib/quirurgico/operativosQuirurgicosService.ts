// src/lib/quirurgico/operativosQuirurgicosService.ts
// Servicio para operaciones CRUD de operativos quirúrgicos

import { supabaseService } from "../supabaseService";
import { toSlug } from "../slug";
import type {
  OperativoQuirurgico,
  OperativoQuirurgicoInsert,
  OperativoQuirurgicoUpdate,
  OperativoQuirurgicoSummary,
  OperativoQuirurgicoPublic,
  PostulacionEquipoQuirurgico,
  PostulacionEquipoInsert,
  PostulacionEquipoListItem,
} from "./types";

// =====================================================
// OPERATIVOS QUIRÚRGICOS
// =====================================================

const OPERATIVO_LIST_SELECT = `
  id, titulo, slug, ciudad, lugar, fecha_inicio, fecha_fin,
  publicado, estado, created_at
`;

const OPERATIVO_DETAIL_SELECT = `*`;

const OPERATIVO_PUBLIC_SELECT = `
  id, slug, titulo, descripcion, fecha_inicio, fecha_fin,
  ciudad, lugar, imagen_cabecera_url
`;

export async function listOperativosQuirurgicos(filters?: {
  publicado?: boolean;
  estado?: string;
  limit?: number;
}): Promise<OperativoQuirurgicoSummary[]> {
  let query = supabaseService
    .from("operativos_quirurgicos")
    .select(OPERATIVO_LIST_SELECT)
    .order("fecha_inicio", { ascending: false });

  if (filters?.publicado !== undefined) {
    query = query.eq("publicado", filters.publicado);
  }

  if (filters?.estado) {
    query = query.eq("estado", filters.estado);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[operativosQuirurgicosService] list error:", error);
    throw new Error("No se pudieron cargar los operativos quirúrgicos");
  }

  return (data || []) as OperativoQuirurgicoSummary[];
}

export async function listOperativosQuirurgicosPublic(): Promise<OperativoQuirurgicoPublic[]> {
  const today = new Date().toISOString().split("T")[0];
  
  const { data, error } = await supabaseService
    .from("operativos_quirurgicos")
    .select(OPERATIVO_PUBLIC_SELECT)
    .eq("publicado", true)
    .gte("fecha_inicio", today)
    .order("fecha_inicio", { ascending: true });

  if (error) {
    console.error("[operativosQuirurgicosService] listPublic error:", error);
    return [];
  }

  return (data || []) as OperativoQuirurgicoPublic[];
}

export async function getOperativoQuirurgico(id: string): Promise<OperativoQuirurgico | null> {
  const { data, error } = await supabaseService
    .from("operativos_quirurgicos")
    .select(OPERATIVO_DETAIL_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[operativosQuirurgicosService] get error:", error);
    throw new Error("No se pudo cargar el operativo quirúrgico");
  }

  return data as OperativoQuirurgico | null;
}

export async function getOperativoQuirurgicoBySlug(slug: string): Promise<OperativoQuirurgico | null> {
  const { data, error } = await supabaseService
    .from("operativos_quirurgicos")
    .select(OPERATIVO_DETAIL_SELECT)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[operativosQuirurgicosService] getBySlug error:", error);
    throw new Error("No se pudo cargar el operativo quirúrgico");
  }

  return data as OperativoQuirurgico | null;
}

export async function getOperativoQuirurgicoPublicBySlug(slug: string): Promise<OperativoQuirurgicoPublic | null> {
  const { data, error } = await supabaseService
    .from("operativos_quirurgicos")
    .select(OPERATIVO_PUBLIC_SELECT)
    .eq("slug", slug)
    .eq("publicado", true)
    .maybeSingle();

  if (error) {
    console.error("[operativosQuirurgicosService] getPublicBySlug error:", error);
    return null;
  }

  return data as OperativoQuirurgicoPublic | null;
}

export async function createOperativoQuirurgico(
  data: Omit<OperativoQuirurgicoInsert, "slug">
): Promise<OperativoQuirurgico> {
  const slug = await generateUniqueSlug(data.titulo);

  const { data: created, error } = await supabaseService
    .from("operativos_quirurgicos" as unknown as never)
    .insert({ ...data, slug } as never)
    .select()
    .single();

  if (error) {
    console.error("[operativosQuirurgicosService] create error:", error);
    throw new Error("No se pudo crear el operativo quirúrgico");
  }

  return created as OperativoQuirurgico;
}

export async function updateOperativoQuirurgico(
  id: string,
  data: OperativoQuirurgicoUpdate
): Promise<OperativoQuirurgico> {
  const updateData: OperativoQuirurgicoUpdate = {
    ...data,
    updated_at: new Date().toISOString(),
  };

  // Si cambia el título, regenerar el slug
  if (data.titulo) {
    const existing = await getOperativoQuirurgico(id);
    if (existing && existing.titulo !== data.titulo) {
      updateData.slug = await generateUniqueSlug(data.titulo, id);
    }
  }

  const { data: updated, error } = await supabaseService
    .from("operativos_quirurgicos" as unknown as never)
    .update(updateData as never)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[operativosQuirurgicosService] update error:", error);
    throw new Error("No se pudo actualizar el operativo quirúrgico");
  }

  return updated as OperativoQuirurgico;
}

export async function deleteOperativoQuirurgico(id: string): Promise<void> {
  // Verificar que no tenga pacientes asociados
  const { count } = await supabaseService
    .from("pacientes" as unknown as never)
    .select("id", { count: "exact", head: true })
    .eq("operativo_quirurgico_id", id);

  if (count && count > 0) {
    throw new Error("No se puede eliminar un operativo con pacientes asociados");
  }

  const { error } = await supabaseService
    .from("operativos_quirurgicos" as unknown as never)
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[operativosQuirurgicosService] delete error:", error);
    throw new Error("No se pudo eliminar el operativo quirúrgico");
  }
}

async function generateUniqueSlug(titulo: string, excludeId?: string): Promise<string> {
  const baseSlug = toSlug(titulo);
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    let query = supabaseService
      .from("operativos_quirurgicos")
      .select("id")
      .eq("slug", slug);

    if (excludeId) {
      query = query.neq("id", excludeId);
    }

    const { data } = await query.maybeSingle();

    if (!data) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;

    if (counter > 100) {
      throw new Error("No se pudo generar un slug único");
    }
  }
}

// =====================================================
// POSTULACIONES EQUIPO CLÍNICO
// =====================================================

export async function listPostulacionesEquipo(
  operativoId: string,
  filters?: { estado?: string }
): Promise<PostulacionEquipoListItem[]> {
  let query = supabaseService
    .from("postulaciones_equipo_quirurgico")
    .select("id, nombres, apellidos, email, profesion, especialidad, estado, created_at")
    .eq("operativo_quirurgico_id", operativoId)
    .order("created_at", { ascending: false });

  if (filters?.estado) {
    query = query.eq("estado", filters.estado);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[operativosQuirurgicosService] listPostulaciones error:", error);
    throw new Error("No se pudieron cargar las postulaciones");
  }

  return (data || []) as PostulacionEquipoListItem[];
}

export async function getPostulacionEquipo(id: string): Promise<PostulacionEquipoQuirurgico | null> {
  const { data, error } = await supabaseService
    .from("postulaciones_equipo_quirurgico")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[operativosQuirurgicosService] getPostulacion error:", error);
    throw new Error("No se pudo cargar la postulación");
  }

  return data as PostulacionEquipoQuirurgico | null;
}

export async function createPostulacionEquipo(data: PostulacionEquipoInsert): Promise<PostulacionEquipoQuirurgico> {
  const { data: created, error } = await supabaseService
    .from("postulaciones_equipo_quirurgico" as unknown as never)
    .insert(data as never)
    .select()
    .single();

  if (error) {
    console.error("[operativosQuirurgicosService] createPostulacion error:", error);
    throw new Error("No se pudo registrar la postulación");
  }

  return created as PostulacionEquipoQuirurgico;
}

export async function updatePostulacionEquipoEstado(
  id: string,
  estado: string,
  notas?: string
): Promise<PostulacionEquipoQuirurgico> {
  const updateData: Partial<PostulacionEquipoQuirurgico> = {
    estado,
    updated_at: new Date().toISOString(),
  };

  if (notas !== undefined) {
    updateData.notas_admin = notas;
  }

  const { data: updated, error } = await supabaseService
    .from("postulaciones_equipo_quirurgico" as unknown as never)
    .update(updateData as never)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[operativosQuirurgicosService] updatePostulacion error:", error);
    throw new Error("No se pudo actualizar la postulación");
  }

  return updated as PostulacionEquipoQuirurgico;
}

// =====================================================
// ESTADÍSTICAS
// =====================================================

export async function getOperativoStats(operativoId: string): Promise<{
  pacientes_total: number;
  pacientes_activos: number;
  pacientes_operados: number;
  postulaciones_total: number;
  postulaciones_pendientes: number;
  postulaciones_aprobadas: number;
}> {
  const [pacientesRes, postulacionesRes] = await Promise.all([
    supabaseService
      .from("pacientes" as unknown as never)
      .select("estado", { count: "exact" })
      .eq("operativo_quirurgico_id", operativoId),
    supabaseService
      .from("postulaciones_equipo_quirurgico" as unknown as never)
      .select("estado", { count: "exact" })
      .eq("operativo_quirurgico_id", operativoId),
  ]);

  const pacientes = (pacientesRes.data || []) as { estado: string }[];
  const postulaciones = (postulacionesRes.data || []) as { estado: string }[];

  return {
    pacientes_total: pacientes.length,
    pacientes_activos: pacientes.filter((p) => p.estado === "activo").length,
    pacientes_operados: pacientes.filter((p) => p.estado === "operado").length,
    postulaciones_total: postulaciones.length,
    postulaciones_pendientes: postulaciones.filter((p) => p.estado === "pendiente").length,
    postulaciones_aprobadas: postulaciones.filter((p) => p.estado === "aprobado" || p.estado === "confirmado").length,
  };
}
