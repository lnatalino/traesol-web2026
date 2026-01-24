import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import { toSlug } from "@/lib/slug";
import type { InventarioCategoria } from "@/lib/inventario/types";

const TABLE = "inventario_categorias";
const SELECT_COLUMNS = "id,nombre,slug,descripcion,created_at";
const LOG_PREFIX = "[api:inventario-categorias]";
const IS_DEV = process.env.NODE_ENV !== "production";

type UpsertBody = {
  id?: string | null;
  nombre?: string;
  slug?: string;
  descripcion?: string | null;
};

type DeleteBody = { id?: string | null };

type JsonErrorCode =
  | "unauthorized"
  | "invalid_payload"
  | "missing_name"
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

function normalizeId(value: unknown): string | null {
  const normalized = normalizeText(value);
  return normalized.length ? normalized : null;
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
  const { data, error } = await query.maybeSingle<Pick<InventarioCategoria, "id">>();
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
    logError("JSON parse error", error);
    return jsonError(400, "Información inválida", "invalid_payload", getErrorMessage(error));
  }

  const id = normalizeId(body.id);
  const nombre = normalizeText(body.nombre);
  const slugInput = normalizeText(body.slug);
  const slug = (slugInput ? toSlug(slugInput) : toSlug(nombre)) || "";
  const descripcion = normalizeNullableText(body.descripcion);

  if (!nombre) {
    return jsonError(400, "Debes ingresar un nombre", "missing_name");
  }

  if (!slug) {
    return jsonError(400, "No pudimos generar un slug válido", "invalid_slug");
  }

  try {
    const conflict = await ensureSlugAvailability(slug, id);
    if (conflict) {
      logInfo("Slug conflict", { slug, existingId: conflict.id, attemptingId: id });
      return jsonError(409, "Ya existe una categoría con ese slug", "slug_exists");
    }

    const payload = { nombre, slug, descripcion } as const;

    if (id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabaseService as any)
        .from(TABLE)
        .update(payload)
        .eq("id", id)
        .select(SELECT_COLUMNS)
        .maybeSingle();

      if (error?.code === "PGRST116") {
        return jsonError(404, "Categoría no encontrada", "not_found", getErrorMessage(error));
      }

      if (error) {
        throw error;
      }

      const updated = (data as InventarioCategoria | null) ?? null;
      if (!updated) {
        return jsonError(500, "No se pudieron guardar los cambios", "unknown");
      }

      logInfo("Category updated", { id: updated.id, slug });
      return NextResponse.json({ ok: true, data: updated });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabaseService as any)
      .from(TABLE)
      .insert(payload)
      .select(SELECT_COLUMNS)
      .single();

    if (error?.code === "23505") {
      const debug = getErrorMessage(error);
      logInfo("Unique constraint violation", { slug });
      return jsonError(409, "Ya existe una categoría con ese slug", "slug_exists", debug);
    }

    if (error) {
      throw error;
    }

    const created = data as InventarioCategoria;
    logInfo("Category created", { id: created.id, slug });
    return NextResponse.json({ ok: true, data: created }, { status: 201 });
  } catch (error) {
    const debug = getErrorMessage(error);
    logError("Unexpected error while saving category", error, { id, slug });
    return jsonError(500, "No se pudo guardar la categoría", "unknown", debug);
  }
}

export async function DELETE(req: Request) {
  const session = await getAdminSession();
  if (!session.allowed) {
    return jsonError(403, "No autorizado", "unauthorized");
  }

  let body: DeleteBody;
  try {
    body = await req.json();
  } catch (error) {
    logError("JSON parse error (delete)", error);
    return jsonError(400, "Información inválida", "invalid_payload", getErrorMessage(error));
  }

  const id = normalizeId(body.id);
  if (!id) {
    return jsonError(400, "Categoría inválida", "invalid_payload");
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabaseService as any)
      .from(TABLE)
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error?.code === "PGRST116") {
      return jsonError(404, "La categoría ya no existe", "not_found", getErrorMessage(error));
    }

    if (error) {
      throw error;
    }

    if (!data) {
      return jsonError(404, "La categoría ya no existe", "not_found");
    }

    logInfo("Category deleted", { id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const debug = getErrorMessage(error);
    logError("Unexpected error while deleting category", error, { id });
    return jsonError(500, "No se pudo eliminar la categoría", "unknown", debug);
  }
}
