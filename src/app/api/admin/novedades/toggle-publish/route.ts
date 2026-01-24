import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";

type Payload = {
  id: string;
  nextValue: string;
  redirectTo?: string;
};

function parseBooleanValue(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "on" || normalized === "yes" || normalized === "si" || normalized === "sí";
}

async function parsePayload(req: Request): Promise<Payload> {
  const type = req.headers.get("content-type") || "";

  if (type.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    return {
      id: String(body?.id ?? ""),
      nextValue: String(body?.nextValue ?? ""),
      redirectTo: body?.redirectTo ? String(body.redirectTo) : undefined,
    };
  }

  if (type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data")) {
    const form = await req.formData();
    const id = String(form.get("id") ?? "");
    const nextValue = String(form.get("nextValue") ?? "");
    const redirectTo = form.get("redirectTo");
    return {
      id,
      nextValue,
      redirectTo: redirectTo ? String(redirectTo) : undefined,
    };
  }

  try {
    const body = await req.json();
    return {
      id: String(body?.id ?? ""),
      nextValue: String(body?.nextValue ?? ""),
      redirectTo: body?.redirectTo ? String(body.redirectTo) : undefined,
    };
  } catch {
    return { id: "", nextValue: "" };
  }
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }

  const payload = await parsePayload(req);
  const id = payload.id.trim();
  const nextValue = payload.nextValue.trim();
  const wantsJson = (req.headers.get("accept") || "").includes("application/json");

  if (!id || !nextValue) {
    if (wantsJson) {
      return NextResponse.json({ ok: false, error: "Faltan campos" }, { status: 400 });
    }
    const url = new URL(payload.redirectTo || "/admin/novedades", req.url);
    url.searchParams.set("error", "No se pudo actualizar el estado.");
    return NextResponse.redirect(url, 303);
  }

  try {
    const value = parseBooleanValue(nextValue);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseService as any)
      .from("novedades")
      .update({ publicado: value, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    if (payload.redirectTo) {
      return NextResponse.redirect(new URL(payload.redirectTo, req.url), 303);
    }

    if (wantsJson || (req.headers.get("content-type") || "").includes("application/json")) {
      return NextResponse.json({ ok: true, value });
    }

    return NextResponse.redirect(new URL("/admin/novedades", req.url), 303);
  } catch (err: any) {
    const message = err?.message ? String(err.message) : "No se pudo actualizar el estado.";
    if (payload.redirectTo) {
      const url = new URL(payload.redirectTo, req.url);
      url.searchParams.set("error", message);
      return NextResponse.redirect(url, 303);
    }
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
