import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import { toSlug } from "@/lib/slug";
import {
  assertValidImageFile,
  createStoragePath,
  fileToBuffer,
  PUBLIC_STORAGE_BUCKET,
  storagePathFromPublicUrl,
} from "@/lib/storage";

type NovedadUpdate = {
  titulo: string;
  slug: string;
  bajada: string | null;
  cuerpo: string | null;
  imagen_portada_url: string | null;
  link_externo: string | null;
  fecha_publicacion: string | null;
  publicado: boolean;
  en_carrusel: boolean;
  updated_at: string;
};

const STORAGE_BUCKET = PUBLIC_STORAGE_BUCKET;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
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

function parseIds(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
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

async function removeStorageFiles(paths: string[]) {
  if (!paths.length) return;
  const { error } = await supabaseService.storage.from(STORAGE_BUCKET).remove(paths);
  if (error) throw error;
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }

  const form = await req.formData();
  const id = parseFormValue(form.get("id"));
  if (!id) {
    const url = new URL("/admin/novedades", req.url);
    url.searchParams.set("error", "Novedad inválida.");
    return NextResponse.redirect(url, 303);
  }

  const titulo = parseFormValue(form.get("titulo"));
  if (!titulo) {
    const url = new URL(`/admin/novedades/${id}/editar`, req.url);
    url.searchParams.set("error", "Debes indicar un título.");
    return NextResponse.redirect(url, 303);
  }

  const slugInput = parseFormValue(form.get("slug"));
  const slug = (slugInput ? toSlug(slugInput) : toSlug(titulo)) || toSlug(id);

  const fechaRaw = parseFormValue(form.get("fecha_publicacion"));
  let fecha_publicacion: string | null = null;
  if (fechaRaw) {
    const parsed = parseDateTime(fechaRaw);
    if (!parsed) {
      const url = new URL(`/admin/novedades/${id}/editar`, req.url);
      url.searchParams.set("error", "Fecha de publicación inválida.");
      return NextResponse.redirect(url, 303);
    }
    fecha_publicacion = parsed;
  }

  const galleryFiles = form.getAll("novedad_galeria_files");
  const keepIds = parseIds(parseFormValue(form.get("novedad_galeria_keep")));
  const portadaEntry = form.get("imagen_portada_file");
  const portadaFile = portadaEntry instanceof File && portadaEntry.size > 0 ? portadaEntry : null;
  const eliminarPortada = parseBoolean(form.get("imagen_portada_eliminar"));
  let portadaUpload: UploadedImage | null = null;
  let previousPortadaUrl: string | null = null;
  let portadaPathsToDelete: string[] = [];

  try {
    const { data: currentRow, error: fetchCurrent } = await supabaseService
      .from("novedades")
      .select("imagen_portada_url")
      .eq("id", id)
      .maybeSingle<{ imagen_portada_url: string | null }>();

    if (fetchCurrent) throw fetchCurrent;

    previousPortadaUrl = currentRow?.imagen_portada_url ?? null;

    if (portadaFile) {
      portadaUpload = await uploadImageFile(portadaFile, NOVEDADES_COVER_FOLDER, portadaFile.name || "portada");
    }

    const nextPortadaUrl = portadaUpload
      ? portadaUpload.url
      : eliminarPortada
        ? null
        : previousPortadaUrl;

    if (portadaUpload && previousPortadaUrl) {
      const previousPath = storagePathFromPublicUrl(previousPortadaUrl);
      if (previousPath) {
        portadaPathsToDelete.push(previousPath);
      }
    } else if (!portadaUpload && eliminarPortada && previousPortadaUrl) {
      const previousPath = storagePathFromPublicUrl(previousPortadaUrl);
      if (previousPath) {
        portadaPathsToDelete.push(previousPath);
      }
    }

    const payload: NovedadUpdate = {
      titulo,
      slug,
      bajada: parseFormValue(form.get("bajada")) || null,
      cuerpo: parseFormValue(form.get("cuerpo")) || null,
      imagen_portada_url: nextPortadaUrl,
      link_externo: parseFormValue(form.get("link_externo")) || null,
      fecha_publicacion,
      publicado: parseBoolean(form.get("publicado")),
      en_carrusel: parseBoolean(form.get("en_carrusel")),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseService
      .from("novedades")
      .update(payload)
      .eq("id", id);

    if (error) throw error;

    const { data: existingRows, error: fetchError } = await supabaseService
      .from("novedad_imagenes")
      .select("id,path")
      .eq("novedad_id", id);

    if (fetchError) throw fetchError;

    const existing = (existingRows ?? []) as Array<{ id: string; path: string }>;
    const keepSet = new Set(keepIds);
    const toRemove = existing.filter((img) => !keepSet.has(img.id));
    const removeIds = toRemove.map((img) => img.id);
    const removePaths = toRemove.map((img) => img.path).filter(Boolean);

    if (removeIds.length) {
      const { error: deleteError } = await supabaseService
        .from("novedad_imagenes")
        .delete()
        .in("id", removeIds);
      if (deleteError) throw deleteError;
    }

    if (removePaths.length) {
      await removeStorageFiles(removePaths);
    }

    const uploaded = await uploadGalleryImages(galleryFiles);
    if (uploaded.length) {
      const rows = uploaded.map((item) => ({
        novedad_id: id,
        url: item.url,
        path: item.path,
      }));
      const { error: insertError } = await supabaseService
        .from("novedad_imagenes")
        .insert(rows);
      if (insertError) throw insertError;
    }

    if (portadaPathsToDelete.length) {
      await removeStorageFiles(portadaPathsToDelete);
    }

    const redirectTo = parseFormValue(form.get("redirectTo")) || `/admin/novedades/${id}/editar?success=Datos+actualizados`;
    return NextResponse.redirect(new URL(redirectTo, req.url), 303);
  } catch (err: any) {
    if (portadaUpload) {
      await supabaseService.storage.from(STORAGE_BUCKET).remove([portadaUpload.path]);
    }
    const message = err?.message ? String(err.message) : "No se pudo actualizar la novedad.";
    const url = new URL(`/admin/novedades/${id}/editar`, req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url, 303);
  }
}
