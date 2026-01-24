import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";

const LOG_PREFIX = "[api:inventario-stock]";
const IS_DEV = process.env.NODE_ENV !== "production";

type StockBody = {
  id?: string | null;
  cantidad?: number | string | null;
};

function normalizeId(value: unknown): string | null {
  return typeof value === "string" && value.trim().length ? value.trim() : null;
}

function parseCantidad(value: unknown): number | null {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return null;
    return value < 0 ? null : Math.floor(value);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number.parseInt(trimmed, 10);
    if (!Number.isFinite(parsed) || parsed < 0) return null;
    return Math.floor(parsed);
  }
  return null;
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

function respond(status: number, message: string, debug?: string) {
  const payload: Record<string, unknown> = { ok: status >= 200 && status < 300, message };
  if (debug && IS_DEV) {
    payload.debug = debug;
  }
  return NextResponse.json(payload, { status });
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session.allowed) {
    return respond(403, "No autorizado");
  }

  let body: StockBody;
  try {
    body = await req.json();
  } catch (error) {
    return respond(400, "Información inválida", getErrorMessage(error));
  }

  const id = normalizeId(body.id);
  const cantidad = parseCantidad(body.cantidad);

  if (!id) {
    return respond(400, "Ítem inválido");
  }

  if (cantidad === null) {
    return respond(400, "Ingresa un stock válido");
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseService as any)
      .from("inventario_items")
      .update({ cantidad_actual: cantidad })
      .eq("id", id);

    if (error) {
      throw error;
    }

    console.log(`${LOG_PREFIX} stock updated`, { id, cantidad });
    return respond(200, "Stock actualizado correctamente");
  } catch (error) {
    const debug = getErrorMessage(error);
    console.error(`${LOG_PREFIX} error updating stock`, { id, error });
    return respond(500, "No se pudo actualizar el stock", debug);
  }
}
