import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import {
  assertValidImageFile,
  createStoragePath,
  fileToBuffer,
  PUBLIC_STORAGE_BUCKET,
  storagePathFromPublicUrl,
} from "@/lib/storage";

const MAX_PORTADA_SIZE = 10 * 1024 * 1024; // 10 MB
const PORTADAS_FOLDER = "inventario/items/portadas";

async function uploadPortada(file: File) {
  assertValidImageFile(file, MAX_PORTADA_SIZE, file.name || "portada");
  const path = createStoragePath(PORTADAS_FOLDER, file.name || "portada");
  const buffer = await fileToBuffer(file);
  const contentType = file.type || "image/jpeg";

  const { error: uploadError } = await supabaseService.storage
    .from(PUBLIC_STORAGE_BUCKET)
    .upload(path, buffer, {
      cacheControl: "3600",
      upsert: false,
      contentType,
    });

  if (uploadError) {
    throw uploadError;
  }

  const publicResult = supabaseService.storage.from(PUBLIC_STORAGE_BUCKET).getPublicUrl(path);
  return { path, url: publicResult.data.publicUrl };
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Formato inválido" }, { status: 400 });
  }

  const fileEntry = form.get("file");
  const file = fileEntry instanceof File && fileEntry.size > 0 ? fileEntry : null;
  if (!file) {
    return NextResponse.json({ ok: false, error: "Adjunta una imagen válida" }, { status: 400 });
  }

  try {
    const uploaded = await uploadPortada(file);
    return NextResponse.json({ ok: true, url: uploaded.url, path: uploaded.path });
  } catch (error: any) {
    const message = error?.message || "No se pudo subir la imagen";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }

  let payload: { url?: string } = {};
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body inválido" }, { status: 400 });
  }

  const url = typeof payload.url === "string" ? payload.url.trim() : "";
  const path = storagePathFromPublicUrl(url);
  if (!path) {
    return NextResponse.json({ ok: false, error: "URL inválida" }, { status: 400 });
  }

  const { error } = await supabaseService.storage.from(PUBLIC_STORAGE_BUCKET).remove([path]);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
