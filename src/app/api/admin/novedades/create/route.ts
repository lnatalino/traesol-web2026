import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import { toSlug } from "@/lib/slug";
import {
  assertValidImageFile,
  createStoragePath,
  fileToBuffer,
  PUBLIC_STORAGE_BUCKET,
} from "@/lib/storage";

type NovedadInsert = {
  titulo: string;
  slug: string;
  bajada: string | null;
  cuerpo: string | null;
  imagen_portada_url: string | null;
  link_externo: string | null;
  fecha_publicacion: string;
  publicado: boolean;
  en_carrusel: boolean;
  created_at?: string;
  updated_at?: string;
};

const STORAGE_BUCKET = PUBLIC_STORAGE_BUCKET;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const NOVEDADES_COVER_FOLDER = "novedades/portadas";
const NOVEDADES_GALLERY_FOLDER = "novedades/galeria";

type UploadedImage = {
  path: string;
  url: string;
};

function parseFormValue(value: FormDataEntryValue | null): string {
  return value === null ? "" : String(value).trim();
}

function parseBoolean(value: FormDataEntryValue | null): boolean {
  const normalized = parseFormValue(value).toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "on" || normalized === "yes";
}

function parseDateTime(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

async function uploadImageFile(file: File, folder: string, contextLabel: string): Promise<UploadedImage> {
  assertValidImageFile(file, MAX_IMAGE_SIZE, contextLabel);

  const path = createStoragePath(folder, file.name || contextLabel);
  const buffer = await fileToBuffer(file);
  const contentType = file.type || "image/jpeg";

  const { error: uploadError } = await supabaseService.storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, {
      cacheControl: "3600",
      upsert: false,
      contentType,
    });

  if (uploadError) {
    throw uploadError;
  }

  const publicResult = supabaseService.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return { path, url: publicResult.data.publicUrl };
}

async function uploadGalleryImages(entries: FormDataEntryValue[]): Promise<UploadedImage[]> {
  const uploads: UploadedImage[] = [];
  for (const entry of entries) {
    if (!(entry instanceof File)) continue;
    if (entry.size === 0) continue;
    const uploaded = await uploadImageFile(entry, NOVEDADES_GALLERY_FOLDER, entry.name || "galeria");
    uploads.push(uploaded);
  }

  return uploads;
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }

  const form = await req.formData();

  const titulo = parseFormValue(form.get("titulo"));
  if (!titulo) {
    const url = new URL("/admin/novedades/nueva", req.url);
    url.searchParams.set("error", "Debes indicar un título.");
    return NextResponse.redirect(url, 303);
  }

  const slugInput = parseFormValue(form.get("slug"));
  const slug = (slugInput ? toSlug(slugInput) : toSlug(titulo)) || toSlug(`${Date.now()}`);

  const fechaRaw = parseFormValue(form.get("fecha_publicacion"));
  const parsedFecha = parseDateTime(fechaRaw);
  if (fechaRaw && !parsedFecha) {
    const url = new URL("/admin/novedades/nueva", req.url);
    url.searchParams.set("error", "Fecha de publicación inválida.");
    return NextResponse.redirect(url, 303);
  }
  const nowIso = new Date().toISOString();
  const fecha_publicacion = parsedFecha ?? nowIso;

  const payload: NovedadInsert = {
    titulo,
    slug,
    bajada: parseFormValue(form.get("bajada")) || null,
    cuerpo: parseFormValue(form.get("cuerpo")) || null,
    imagen_portada_url: null,
    link_externo: parseFormValue(form.get("link_externo")) || null,
    fecha_publicacion,
    publicado: parseBoolean(form.get("publicado")),
    en_carrusel: parseBoolean(form.get("en_carrusel")),
    created_at: nowIso,
    updated_at: nowIso,
  };

  const galleryFiles = form.getAll("novedad_galeria_files");
  const portadaEntry = form.get("imagen_portada_file");
  const portadaFile = portadaEntry instanceof File && portadaEntry.size > 0 ? portadaEntry : null;
  let portadaUpload: UploadedImage | null = null;

  try {
    if (portadaFile) {
      portadaUpload = await uploadImageFile(portadaFile, NOVEDADES_COVER_FOLDER, portadaFile.name || "portada");
      payload.imagen_portada_url = portadaUpload.url;
    }

    const { data, error } = await supabaseService
      .from("novedades")
      .insert(payload)
      .select("id")
      .single();

    if (error) throw error;

    const uploaded = await uploadGalleryImages(galleryFiles);
    if (uploaded.length && data?.id) {
      const rows = uploaded.map((item) => ({
        novedad_id: data.id,
        url: item.url,
        path: item.path,
      }));
      const { error: galleryError } = await supabaseService
        .from("novedad_imagenes")
        .insert(rows);
      if (galleryError) throw galleryError;
    }

    const redirectTo = parseFormValue(form.get("redirectTo")) ||
      (data?.id ? `/admin/novedades/${data.id}/editar?success=Novedad+creada` : "/admin/novedades");

    return NextResponse.redirect(new URL(redirectTo, req.url), 303);
  } catch (err: any) {
    if (portadaUpload) {
      await supabaseService.storage.from(STORAGE_BUCKET).remove([portadaUpload.path]);
    }
    const message = err?.message ? String(err.message) : "No se pudo crear la novedad.";
    const url = new URL("/admin/novedades/nueva", req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url, 303);
  }
}
