import { createSupabaseServer } from "@/lib/supabaseServer";

export type NovedadImage = {
  id: string;
  url: string;
  path: string | null;
};

export type CarruselNovedad = {
  id: string;
  slug: string | null;
  titulo: string | null;
  imagen_portada_url: string | null;
  link_externo: string | null;
  fecha_publicacion: string | null;
  imagenes: NovedadImage[];
};

export type PublicNovedadListItem = {
  id: string;
  slug: string;
  titulo: string | null;
  bajada: string | null;
  imagen_portada_url: string | null;
  link_externo: string | null;
  fecha_publicacion: string | null;
  imagenes: NovedadImage[];
};

export type PublicNovedadDetail = {
  id: string;
  slug: string;
  titulo: string | null;
  bajada: string | null;
  cuerpo: string | null;
  imagen_portada_url: string | null;
  link_externo: string | null;
  fecha_publicacion: string | null;
  imagenes: NovedadImage[];
};

function createClient() {
  return createSupabaseServer();
}

function normalizeImagenes(
  raw: Array<{ id?: string; url?: string | null; path?: string | null }> | null | undefined,
): NovedadImage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((img) => typeof img?.url === "string" && !!img.url)
    .map((img, index) => ({
      id: String(img.id ?? index),
      url: String(img.url),
      path: img.path ?? null,
    }));
}

export async function getCarruselNovedades(limit = 8): Promise<CarruselNovedad[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("novedades")
      .select("id,slug,titulo,imagen_portada_url,link_externo,fecha_publicacion,novedad_imagenes(id,url,path)")
      .eq("publicado", true)
      .eq("en_carrusel", true)
      .order("fecha_publicacion", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []).map((item: any) => ({
      id: item.id,
      slug: item.slug ?? null,
      titulo: item.titulo ?? null,
      imagen_portada_url: item.imagen_portada_url ?? null,
      link_externo: item.link_externo ?? null,
      fecha_publicacion: item.fecha_publicacion ?? null,
      imagenes: normalizeImagenes(item.novedad_imagenes ?? []),
    })) as CarruselNovedad[];
  } catch (err) {
    console.error("getCarruselNovedades", err);
    return [];
  }
}

export async function getUltimasNovedades(limit = 6): Promise<PublicNovedadListItem[]> {
  try {
    const supabase = createClient();
    const query = supabase
      .from("novedades")
      .select("id,slug,titulo,bajada,imagen_portada_url,link_externo,fecha_publicacion,novedad_imagenes(id,url,path)")
      .eq("publicado", true)
      .eq("en_novedades", true)
      .order("fecha_publicacion", { ascending: false });

    if (typeof limit === "number") {
      query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((item: any) => ({
      id: item.id,
      slug: item.slug,
      titulo: item.titulo ?? null,
      bajada: item.bajada ?? null,
      imagen_portada_url: item.imagen_portada_url ?? null,
      link_externo: item.link_externo ?? null,
      fecha_publicacion: item.fecha_publicacion ?? null,
      imagenes: normalizeImagenes(item.novedad_imagenes ?? []),
    })) as PublicNovedadListItem[];
  } catch (err) {
    console.error("getUltimasNovedades", err);
    return [];
  }
}

export async function getPublicNovedades(limit?: number): Promise<PublicNovedadListItem[]> {
  try {
    const supabase = createClient();
    const query = supabase
      .from("novedades")
      .select("id,slug,titulo,bajada,imagen_portada_url,link_externo,fecha_publicacion,novedad_imagenes(id,url,path)")
      .eq("publicado", true)
      .eq("en_novedades", true)
      .order("fecha_publicacion", { ascending: false });

    if (typeof limit === "number") {
      query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((item: any) => ({
      id: item.id,
      slug: item.slug,
      titulo: item.titulo ?? null,
      bajada: item.bajada ?? null,
      imagen_portada_url: item.imagen_portada_url ?? null,
      link_externo: item.link_externo ?? null,
      fecha_publicacion: item.fecha_publicacion ?? null,
      imagenes: normalizeImagenes(item.novedad_imagenes ?? []),
    })) as PublicNovedadListItem[];
  } catch (err) {
    console.error("getPublicNovedades", err);
    return [];
  }
}

export async function getPublicNovedadBySlug(slug: string): Promise<PublicNovedadDetail | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("novedades")
      .select(
        "id,slug,titulo,bajada,cuerpo,imagen_portada_url,link_externo,fecha_publicacion,novedad_imagenes(id,url,path)"
      )
      .eq("slug", slug)
      .eq("publicado", true)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const raw = data as (Omit<PublicNovedadDetail, "imagenes"> & {
      novedad_imagenes?: Array<{ id: string; url: string | null; path: string | null }>;
    }) | null;

    if (!raw) return null;

    const { novedad_imagenes, ...rest } = raw;
    return {
      ...rest,
      imagenes: normalizeImagenes(novedad_imagenes ?? []),
    };
  } catch (err) {
    console.error("getPublicNovedadBySlug", err);
    return null;
  }
}
