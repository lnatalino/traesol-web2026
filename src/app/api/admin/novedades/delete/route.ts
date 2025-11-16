import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";

type Payload = {
  id: string;
  redirectTo?: string;
};

async function parsePayload(req: Request): Promise<Payload> {
  const type = req.headers.get("content-type") || "";

  if (type.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    return {
      id: String(body?.id ?? ""),
      redirectTo: body?.redirectTo ? String(body.redirectTo) : undefined,
    };
  }

  if (type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data")) {
    const form = await req.formData();
    const id = String(form.get("id") ?? "");
    const redirectTo = form.get("redirectTo");
    return {
      id,
      redirectTo: redirectTo ? String(redirectTo) : undefined,
    };
  }

  try {
    const body = await req.json();
    return {
      id: String(body?.id ?? ""),
      redirectTo: body?.redirectTo ? String(body.redirectTo) : undefined,
    };
  } catch {
    return { id: "" };
  }
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }

  const payload = await parsePayload(req);
  const id = payload.id.trim();
  const wantsJson = (req.headers.get("accept") || "").includes("application/json");

  if (!id) {
    if (payload.redirectTo) {
      const url = new URL(payload.redirectTo, req.url);
      url.searchParams.set("error", "Novedad inválida");
      return NextResponse.redirect(url, 303);
    }
    if (wantsJson) {
      return NextResponse.json({ ok: false, error: "Novedad inválida" }, { status: 400 });
    }
    return NextResponse.redirect(new URL("/admin/novedades", req.url), 303);
  }

  try {
    const { error } = await supabaseService
      .from("novedades")
      .delete()
      .eq("id", id);

    if (error) throw error;

    if (payload.redirectTo) {
      return NextResponse.redirect(new URL(payload.redirectTo, req.url), 303);
    }

    if (wantsJson || (req.headers.get("content-type") || "").includes("application/json")) {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.redirect(new URL("/admin/novedades", req.url), 303);
  } catch (err: any) {
    const message = err?.message ? String(err.message) : "No se pudo eliminar la novedad.";

    if (payload.redirectTo) {
      const url = new URL(payload.redirectTo, req.url);
      url.searchParams.set("error", message);
      return NextResponse.redirect(url, 303);
    }

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
