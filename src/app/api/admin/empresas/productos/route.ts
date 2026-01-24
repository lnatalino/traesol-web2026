import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import {
  DEFAULT_EMPRESA_PRODUCTO_DETALLES,
  type EmpresaProductoCategoria,
  type EmpresaProductoDetalles,
  type EmpresaProductoRow,
} from "@/lib/empresas";

type PackItemPayload = {
  producto_id: string;
  cantidad: number;
};

type SavePayload = {
  id?: string;
  data?: Partial<EmpresaProductoRow>;
  packItems?: PackItemPayload[];
};

class AuthError extends Error {}
class ValidationError extends Error {}

async function ensureAdmin() {
  const session = await getAdminSession();
  if (!session.allowed) {
    throw new AuthError("No autorizado");
  }
}

function sanitizeString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function sanitizeDetalles(value: unknown): EmpresaProductoDetalles {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_EMPRESA_PRODUCTO_DETALLES };
  }
  return value as EmpresaProductoDetalles;
}

function normalizePackItems(input: unknown): PackItemPayload[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const productoId = sanitizeString((item as PackItemPayload).producto_id) ?? "";
      if (!productoId) return null;
      const rawCantidad = Number((item as PackItemPayload).cantidad);
      const cantidad = Number.isFinite(rawCantidad) && rawCantidad > 0 ? Math.round(rawCantidad) : 1;
      return { producto_id: productoId, cantidad } satisfies PackItemPayload;
    })
    .filter((item): item is PackItemPayload => Boolean(item));
}

function normalizeProductoPayload(data?: Partial<EmpresaProductoRow>): Partial<EmpresaProductoRow> {
  if (!data) {
    throw new ValidationError("Faltan los datos del producto");
  }

  const nombre = sanitizeString(data.nombre);
  const slug = sanitizeString(data.slug);
  const categoria = data.categoria as EmpresaProductoCategoria | undefined;

  if (!nombre || !slug || !categoria) {
    throw new ValidationError("Nombre, slug y categoría son obligatorios");
  }

  const resumen = sanitizeString(data.resumen_corto);
  const descripcionCorta = sanitizeString(data.descripcion_corta) ?? resumen;
  const descripcionLarga = sanitizeString(data.descripcion_larga);
  const videoUrl = sanitizeString(data.video_url);
  const portadaUrl = data.portada_url ?? null;
  const imagenPrincipalUrl = data.imagen_principal_url ?? portadaUrl;
  const ordenValue = typeof data.orden === "number" && Number.isFinite(data.orden) ? data.orden : null;
  const detalles = sanitizeDetalles(data.detalles_json);

  return {
    nombre,
    slug,
    categoria,
    resumen_corto: resumen,
    descripcion_corta: descripcionCorta,
    descripcion_larga: descripcionLarga,
    detalles_json: detalles,
    orden: ordenValue,
    activo: typeof data.activo === "boolean" ? data.activo : false,
    video_url: videoUrl,
    portada_url: portadaUrl,
    imagen_principal_url: imagenPrincipalUrl,
  } satisfies Partial<EmpresaProductoRow>;
}

async function syncPackItems(productoId: string, categoria: string, packItems: PackItemPayload[]) {
  await supabaseService.from("empresa_pack_items").delete().eq("pack_id", productoId);
  if (categoria !== "pack" || packItems.length === 0) return;

  const payload = packItems.map((item) => ({
    pack_id: productoId,
    producto_id: item.producto_id,
    cantidad: item.cantidad,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabaseService.from("empresa_pack_items").insert(payload as any);
  if (error) throw error;
}

async function parseJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new Error("BODY_INVALIDO");
  }
}

export async function POST(req: Request) {
  try {
    await ensureAdmin();
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 403 });
    }
    throw error;
  }

  let payload: SavePayload;
  try {
    payload = await parseJson<SavePayload>(req);
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: "Body inválido" }, { status: 400 });
  }

  try {
    const record = normalizeProductoPayload(payload.data);
    const packItems = normalizePackItems(payload.packItems);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabaseService
      .from("empresa_productos")
      .insert({ ...record, detalles_json: record.detalles_json ?? {} } as any)
      .select("*")
      .single();

    if (error || !data) throw error;

    const savedData = data as EmpresaProductoRow;
    await syncPackItems(savedData.id, record.categoria as string, packItems);

    return NextResponse.json({ ok: true, data: savedData });
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 403 });
    }
    if (error instanceof ValidationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    const message = error?.message === "BODY_INVALIDO" ? "Body inválido" : error?.message || "No se pudo crear";
    const status = message === "Body inválido" ? 400 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function PUT(req: Request) {
  try {
    await ensureAdmin();
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 403 });
    }
    throw error;
  }

  let payload: SavePayload;
  try {
    payload = await parseJson<SavePayload>(req);
  } catch {
    return NextResponse.json({ ok: false, error: "Body inválido" }, { status: 400 });
  }

  const id = sanitizeString(payload.id) ?? "";
  if (!id) {
    return NextResponse.json({ ok: false, error: "Falta el id" }, { status: 400 });
  }

  try {
    const record = normalizeProductoPayload(payload.data);
    const packItems = normalizePackItems(payload.packItems);

    const updatePayload = { ...record, detalles_json: record.detalles_json ?? {}, updated_at: new Date().toISOString() };
    // Bypass type checking due to Supabase client type inference issues
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = supabaseService as any;
    const { data, error } = await client
      .from("empresa_productos")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) throw error;

    await syncPackItems(id, record.categoria as string, packItems);

    return NextResponse.json({ ok: true, data });
  } catch (error: any) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }
    const message = error?.message || "No se pudo actualizar";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await ensureAdmin();
  } catch (error: any) {
    if (error instanceof AuthError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 403 });
    }
    throw error;
  }

  let payload: { id?: string } = {};
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body inválido" }, { status: 400 });
  }

  const id = typeof payload.id === "string" ? payload.id.trim() : "";

  if (!id) {
    return NextResponse.json({ ok: false, error: "Falta el id" }, { status: 400 });
  }

  try {
    await supabaseService.from("empresa_pack_items").delete().eq("pack_id", id);
    const { error } = await supabaseService.from("empresa_productos").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "No se pudo eliminar" }, { status: 500 });
  }
}
