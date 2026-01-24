import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseService";
import { getAdminSession } from "@/lib/adminSession";
import { toSlug } from "@/lib/slug";
import { getErrorMessage } from "@/lib/errors";
import {
  assertValidImageFile,
  createStoragePath,
  fileToBuffer,
  PUBLIC_STORAGE_BUCKET,
  storagePathFromPublicUrl,
} from "@/lib/storage";

type OperativoUpdate = {
  titulo: string;
  slug: string;
  descripcion: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  lugar: string | null;
  direccion: string | null;
  cupos_total: number | null;
  estado: string;
  imagen_cabecera_url: string | null;
  instagram_url: string | null;
  whatsapp_grupo_url: string | null;
  lanyard_type_id: string | null;
};

const STORAGE_BUCKET = PUBLIC_STORAGE_BUCKET;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const OPERATIVOS_COVER_FOLDER = "operativos/portadas";
const OPERATIVOS_GALLERY_FOLDER = "operativos/galeria";

type UploadedImage = {
  path: string;
  url: string;
};

function parseFormValue(value: FormDataEntryValue | null): string {
  return value === null ? "" : String(value).trim();
}

function parseNumber(value: FormDataEntryValue | null): number | null {
  const v = parseFormValue(value);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseBoolean(value: FormDataEntryValue | null): boolean {
  const normalized = parseFormValue(value).toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "on" || normalized === "yes";
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

  if (uploadError) throw uploadError;

  const publicResult = supabaseService.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return { path, url: publicResult.data.publicUrl };
}

async function uploadGalleryImages(entries: FormDataEntryValue[]): Promise<UploadedImage[]> {
  const uploads: UploadedImage[] = [];
  for (const entry of entries) {
    if (!(entry instanceof File)) continue;
    if (entry.size === 0) continue;
    const uploaded = await uploadImageFile(entry, OPERATIVOS_GALLERY_FOLDER, entry.name || "galeria");
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
    const url = new URL("/admin/operativos", req.url);
    url.searchParams.set("error", "Operativo inválido");
    return NextResponse.redirect(url, 303);
  }

  const titulo = parseFormValue(form.get("titulo"));
  if (!titulo) {
    const url = new URL(`/admin/operativos/${id}/editar`, req.url);
    url.searchParams.set("error", "Debes indicar un título.");
    return NextResponse.redirect(url, 303);
  }

  const estado = parseFormValue(form.get("estado")) || "borrador";
  const slugRaw = parseFormValue(form.get("slug"));
  const slug = (slugRaw ? toSlug(slugRaw) : toSlug(titulo)) || toSlug(id);

  const galleryFiles = form.getAll("operativo_galeria_files");
  const keepIds = parseIds(parseFormValue(form.get("operativo_galeria_keep")));
  const portadaEntry = form.get("imagen_cabecera_file");
  const portadaFile = portadaEntry instanceof File && portadaEntry.size > 0 ? portadaEntry : null;
  const eliminarPortada = parseBoolean(form.get("imagen_cabecera_eliminar"));
  let portadaUpload: UploadedImage | null = null;
  let previousPortadaUrl: string | null = null;
  const portadaPathsToDelete: string[] = [];

  try {
    const { data: currentRow, error: fetchCurrent } = await supabaseService
      .from("operativos")
      .select("imagen_cabecera_url")
      .eq("id", id)
      .maybeSingle<{ imagen_cabecera_url: string | null }>();

    if (fetchCurrent) throw fetchCurrent;

    previousPortadaUrl = currentRow?.imagen_cabecera_url ?? null;

    if (portadaFile) {
      portadaUpload = await uploadImageFile(portadaFile, OPERATIVOS_COVER_FOLDER, portadaFile.name || "cabecera");
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

    const payload: OperativoUpdate = {
      titulo,
      slug,
      descripcion: parseFormValue(form.get("descripcion")) || null,
      fecha_inicio: parseFormValue(form.get("fecha_inicio")) || null,
      fecha_fin: parseFormValue(form.get("fecha_fin")) || null,
      lugar: parseFormValue(form.get("lugar")) || null,
      direccion: parseFormValue(form.get("direccion")) || null,
      cupos_total: parseNumber(form.get("cupos_total")),
      estado,
      imagen_cabecera_url: nextPortadaUrl,
      instagram_url: parseFormValue(form.get("instagram_url")) || null,
      whatsapp_grupo_url: parseFormValue(form.get("whatsapp_grupo_url")) || null,
      lanyard_type_id: parseFormValue(form.get("lanyard_type_id")) || null,
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseService as any)
      .from("operativos")
      .update(payload)
      .eq("id", id);

    if (error) throw error;

    const { data: existingRows, error: fetchError } = await supabaseService
      .from("operativo_imagenes")
      .select("id,path")
      .eq("operativo_id", id);

    if (fetchError) throw fetchError;

    const existing = (existingRows ?? []) as Array<{ id: string; path: string }>;
    const keepSet = new Set(keepIds);
    const toRemove = existing.filter((img) => !keepSet.has(img.id));
    const removeIds = toRemove.map((img) => img.id);
    const removePaths = toRemove.map((img) => img.path).filter(Boolean);

    if (removeIds.length) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: deleteError } = await (supabaseService as any)
        .from("operativo_imagenes")
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
        operativo_id: id,
        url: item.url,
        path: item.path,
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: insertError } = await (supabaseService as any)
        .from("operativo_imagenes")
        .insert(rows);
      if (insertError) throw insertError;
    }

    if (portadaPathsToDelete.length) {
      await removeStorageFiles(portadaPathsToDelete);
    }

    const redirectTo = parseFormValue(form.get("redirectTo")) || `/admin/operativos/${id}`;
    return NextResponse.redirect(new URL(redirectTo, req.url), 303);
  } catch (error: unknown) {
    if (portadaUpload) {
      await supabaseService.storage.from(STORAGE_BUCKET).remove([portadaUpload.path]);
    }
    const debug = getErrorMessage(error);
    console.error("[Admin/Operativos] Error actualizando operativo", id, debug, error);
    const url = new URL(`/admin/operativos/${id}/editar`, req.url);
    url.searchParams.set("error", "No se pudo actualizar el operativo. Intenta nuevamente.");
    return NextResponse.redirect(url, 303);
  }
}
