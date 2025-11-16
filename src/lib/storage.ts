import { randomUUID } from "crypto";

export const PUBLIC_STORAGE_BUCKET = "imagenes_publicas";

const PUBLIC_PREFIX = `/storage/v1/object/public/${PUBLIC_STORAGE_BUCKET}/`;
const IMAGE_MIME_PREFIX = "image/";

export function createStoragePath(folder: string, originalName: string): string {
  const extension = (originalName.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const safeExt = extension ? `.${extension}` : ".jpg";
  const normalizedFolder = folder.replace(/\/+/g, "/").replace(/^\//, "").replace(/\/$/, "");
  return `${normalizedFolder}/${randomUUID()}${safeExt}`;
}

export function storagePathFromPublicUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const rawPath = decodeURIComponent(parsed.pathname);
    const index = rawPath.indexOf(PUBLIC_PREFIX);
    if (index === -1) return null;
    const relative = rawPath.slice(index + PUBLIC_PREFIX.length);
    return relative.split("?")[0];
  } catch {
    return null;
  }
}

export function isImageFile(file: File): boolean {
  return Boolean(file?.type?.startsWith(IMAGE_MIME_PREFIX));
}

export function assertValidImageFile(file: File, maxBytes: number, contextLabel: string): void {
  if (!isImageFile(file)) {
    throw new Error(`El archivo ${file.name || contextLabel} no es una imagen válida.`);
  }
  if (file.size > maxBytes) {
    throw new Error(`La imagen ${file.name || contextLabel} supera el máximo permitido de ${Math.floor(maxBytes / (1024 * 1024))} MB.`);
  }
}

export async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
