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
} from "@/lib/storage";

type OperativoInsert = {
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

type OperativoImageInsert = {
  operativo_id: string;
  url: string;
  path: string;
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

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }

  const form = await req.formData();

  const titulo = parseFormValue(form.get("titulo"));
  const estado = parseFormValue(form.get("estado")) || "borrador";
  const slugRaw = parseFormValue(form.get("slug"));
  const slug = (slugRaw ? toSlug(slugRaw) : toSlug(titulo)) || toSlug(`${Date.now()}`);

  if (!titulo) {
    const url = new URL("/admin/operativos/nuevo", req.url);
    url.searchParams.set("error", "Debes indicar un título.");
    return NextResponse.redirect(url, 303);
  }

  const payload: OperativoInsert = {
    titulo,
    slug,
    descripcion: parseFormValue(form.get("descripcion")) || null,
    fecha_inicio: parseFormValue(form.get("fecha_inicio")) || null,
    fecha_fin: parseFormValue(form.get("fecha_fin")) || null,
    lugar: parseFormValue(form.get("lugar")) || null,
    direccion: parseFormValue(form.get("direccion")) || null,
    cupos_total: parseNumber(form.get("cupos_total")),
    estado,
    imagen_cabecera_url: null,
    instagram_url: parseFormValue(form.get("instagram_url")) || null,
    whatsapp_grupo_url: parseFormValue(form.get("whatsapp_grupo_url")) || null,
    lanyard_type_id: parseFormValue(form.get("lanyard_type_id")) || null,
  };

  const galleryFiles = form.getAll("operativo_galeria_files");
  const portadaEntry = form.get("imagen_cabecera_file");
  const portadaFile = portadaEntry instanceof File && portadaEntry.size > 0 ? portadaEntry : null;
  let portadaUpload: UploadedImage | null = null;

  try {
    if (portadaFile) {
      portadaUpload = await uploadImageFile(portadaFile, OPERATIVOS_COVER_FOLDER, portadaFile.name || "cabecera");
      payload.imagen_cabecera_url = portadaUpload.url;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabaseService as any)
      .from("operativos")
      .insert(payload)
      .select("id")
      .single();

    if (error) throw error;

    const uploaded = await uploadGalleryImages(galleryFiles);
    if (uploaded.length && data?.id) {
      const rows: OperativoImageInsert[] = uploaded.map((item) => ({
        operativo_id: data.id,
        url: item.url,
        path: item.path,
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: galleryError } = await (supabaseService as any)
        .from("operativo_imagenes")
        .insert(rows);
      if (galleryError) throw galleryError;
    }

    const redirectTo = parseFormValue(form.get("redirectTo")) || `/admin/operativos/${data?.id ?? ""}`;
    const target = redirectTo || "/admin/operativos";
    return NextResponse.redirect(new URL(target, req.url), 303);
  } catch (error: unknown) {
    if (portadaUpload) {
      await supabaseService.storage.from(STORAGE_BUCKET).remove([portadaUpload.path]);
    }
    const debug = getErrorMessage(error);
    console.error("[Admin/Operativos] Error creando operativo", debug, error);
    const url = new URL("/admin/operativos/nuevo", req.url);
    url.searchParams.set("error", "No se pudo crear el operativo. Intenta nuevamente.");
    return NextResponse.redirect(url, 303);
  }
}
