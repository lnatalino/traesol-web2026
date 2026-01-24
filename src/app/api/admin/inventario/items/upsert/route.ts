import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import { toSlug } from "@/lib/slug";
import { INVENTARIO_TIPO_REGLA, type InventarioItem } from "@/lib/inventario/types";

const TABLE = "inventario_items";
const SELECT_COLUMNS = [
  "id",
  "categoria_id",
  "nombre",
  "slug",
  "descripcion",
  "foto_url",
  "cantidad_actual",
  "unidad",
  "valor_unitario",
  "uso",
  "tipo_regla",
  "activo",
  "created_at",
].join(",");
const LOG_PREFIX = "[api:inventario-items]";
const IS_DEV = process.env.NODE_ENV !== "production";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const AVAILABLE_RULES = new Set(Object.values(INVENTARIO_TIPO_REGLA));

type UpsertBody = {
  id?: string | null;
  nombre?: string;
  slug?: string;
  categoria_id?: string | null;
  tipo_regla?: string | null;
  uso?: string | null;
  descripcion?: string | null;
  unidad?: string | null;
  cantidad_actual?: number | string | null;
  valor_unitario?: number | string | null;
  foto_url?: string | null;
  activo?: boolean;
};

type JsonErrorCode =
  | "unauthorized"
  | "invalid_payload"
  | "missing_name"
  | "missing_category"
  | "invalid_category"
  | "missing_tipo_regla"
  | "invalid_slug"
  | "slug_exists"
  | "not_found"
  | "unknown";

function logInfo(message: string, context?: Record<string, unknown>) {
  if (context) {
    console.log(`${LOG_PREFIX} ${message}`, context);
  } else {
    console.log(`${LOG_PREFIX} ${message}`);
  }
}

function logError(message: string, error: unknown, context?: Record<string, unknown>) {
  console.error(`${LOG_PREFIX} ${message}`, { error, ...(context ?? {}) });
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNullableText(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized.length ? normalized : null;
}

function normalizeUuid(value: unknown): string | null {
  const normalized = normalizeText(value);
  if (!normalized) return null;
  return UUID_REGEX.test(normalized) ? normalized : null;
}

function parseNonNegativeInt(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return Math.max(0, Math.floor(parsed));
    }
  }
  return fallback;
}

function parseMoneyValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value < 0 ? null : Math.floor(value);
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed >= 0) {
      return Math.floor(parsed);
    }
  }
  return null;
}

function normalizeBoolean(value: unknown, fallback = true): boolean {
  if (typeof value === "boolean") return value;
  return fallback;
}

function normalizeTipoRegla(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const upper = value.trim().toUpperCase();
  return AVAILABLE_RULES.has(upper as typeof INVENTARIO_TIPO_REGLA[keyof typeof INVENTARIO_TIPO_REGLA]) ? upper : null;
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message;
  }
  if (typeof error === "string") {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

function jsonError(status: number, message: string, code: JsonErrorCode = "unknown", debug?: string) {
  const payload: Record<string, unknown> = { ok: false, error: message, code };
  if (debug && IS_DEV) {
    payload.debug = debug;
  }
  return NextResponse.json(payload, { status });
}

async function ensureSlugAvailability(slug: string, currentId: string | null) {
  let query = supabaseService.from(TABLE).select("id").eq("slug", slug).limit(1);
  if (currentId) {
    query = query.neq("id", currentId);
  }
  const { data, error } = await query.maybeSingle<Pick<InventarioItem, "id">>();
  if (error && error.code !== "PGRST116") {
    throw error;
  }
  return data ?? null;
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session.allowed) {
    return jsonError(403, "No autorizado", "unauthorized");
  }

  let body: UpsertBody;
  try {
    body = await req.json();
  } catch (error) {
    return jsonError(400, "Información inválida", "invalid_payload", getErrorMessage(error));
  }

  const id = normalizeText(body.id);
  const nombre = normalizeText(body.nombre);
  const slugInput = normalizeText(body.slug);
  const slug = (slugInput ? toSlug(slugInput) : toSlug(nombre)) || "";
  const categoriaId = normalizeUuid(body.categoria_id);
  const tipoRegla = normalizeTipoRegla(body.tipo_regla);
  const uso = normalizeNullableText(body.uso);
  const descripcion = normalizeNullableText(body.descripcion);
  const unidad = normalizeText(body.unidad) || "unidad";
  const cantidadActual = parseNonNegativeInt(body.cantidad_actual, 0);
  const valorUnitario = parseMoneyValue(body.valor_unitario);
  const fotoUrl = normalizeNullableText(body.foto_url);
  const activo = normalizeBoolean(body.activo, true);

  if (!nombre) {
    return jsonError(400, "Debes ingresar un nombre", "missing_name");
  }

  if (!slug) {
    return jsonError(400, "No pudimos generar un slug válido", "invalid_slug");
  }

  if (!categoriaId) {
    const code = body.categoria_id ? "invalid_category" : "missing_category";
    const message = code === "missing_category" ? "Selecciona una categoría" : "Categoría inválida";
    return jsonError(400, message, code);
  }

  if (!tipoRegla) {
    return jsonError(400, "Selecciona un tipo de regla", "missing_tipo_regla");
  }

  try {
    const conflict = await ensureSlugAvailability(slug, id || null);
    if (conflict) {
      logInfo("Slug conflict", { slug, existingId: conflict.id, attemptingId: id });
      return jsonError(409, "Ya existe un ítem con ese slug", "slug_exists");
    }

    const payload = {
      nombre,
      slug,
      categoria_id: categoriaId,
      tipo_regla: tipoRegla,
      uso,
      descripcion,
      unidad,
      cantidad_actual: cantidadActual,
      valor_unitario: valorUnitario,
      foto_url: fotoUrl,
      activo,
    } as const;

    if (id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabaseService as any)
        .from(TABLE)
        .update(payload)
        .eq("id", id)
        .select(SELECT_COLUMNS)
        .maybeSingle();

      if (error?.code === "PGRST116") {
        return jsonError(404, "Ítem no encontrado", "not_found", getErrorMessage(error));
      }

      if (error) {
        throw error;
      }

      const updated = (data as InventarioItem | null) ?? null;
      if (!updated) {
        return jsonError(500, "No se pudieron guardar los cambios", "unknown");
      }

      logInfo("Item updated", { id: updated.id, slug });
      return NextResponse.json({ ok: true, data: updated });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabaseService as any)
      .from(TABLE)
      .insert(payload)
      .select(SELECT_COLUMNS)
      .single();

    if (error?.code === "23505") {
      logInfo("Unique constraint violation", { slug });
      return jsonError(409, "Ya existe un ítem con ese slug", "slug_exists", getErrorMessage(error));
    }

    if (error) {
      throw error;
    }

    const created = data as InventarioItem;
    logInfo("Item created", { id: created.id, slug });
    return NextResponse.json({ ok: true, data: created }, { status: 201 });
  } catch (error) {
    const debug = getErrorMessage(error);
    logError("Unexpected error while saving inventory item", error, { id, slug });
    return jsonError(500, "No se pudo guardar el ítem", "unknown", debug);
  }
}
