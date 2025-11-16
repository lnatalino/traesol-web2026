// src/app/api/admin/operativos/publish/route.ts
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";

type Payload = {
  id: string;
  estado: string;
  redirectTo?: string;
};

const ALLOWED_ESTADOS = new Set(["borrador", "publicado", "cerrado", "finalizado"]);

async function parsePayload(req: Request): Promise<Payload> {
  const type = req.headers.get("content-type") || "";

  if (type.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    return {
      id: String(body?.id || ""),
      estado: String(body?.estado || ""),
      redirectTo: body?.redirectTo ? String(body.redirectTo) : undefined,
    };
  }

  if (type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data")) {
    const form = await req.formData();
    const id = String(form.get("id") || "");
    const estado = String(form.get("estado") || "");
    const redirectTo = form.get("redirectTo");
    return {
      id,
      estado,
      redirectTo: redirectTo ? String(redirectTo) : undefined,
    };
  }

  try {
    const body = await req.json();
    return {
      id: String(body?.id || ""),
      estado: String(body?.estado || ""),
      redirectTo: body?.redirectTo ? String(body.redirectTo) : undefined,
    };
  } catch {
    return { id: "", estado: "" };
  }
}

export async function POST(req: Request) {
  try {
    const payload = await parsePayload(req);
    const id = payload.id.trim();
    const estado = payload.estado.trim().toLowerCase();

    if (!id || !estado) {
      return NextResponse.json({ ok: false, error: "Faltan campos" }, { status: 400 });
    }

    if (!ALLOWED_ESTADOS.has(estado)) {
      return NextResponse.json({ ok: false, error: "Estado inválido" }, { status: 400 });
    }

    const session = await getAdminSession();
    if (!session.allowed) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
    }

    const { error } = await supabaseService
      .from("operativos")
      .update({ estado })
      .eq("id", id);

    if (error) throw error;

    if (payload.redirectTo) {
      return NextResponse.redirect(new URL(payload.redirectTo, req.url), 303);
    }

    const wantsJson = (req.headers.get("accept") || "").includes("application/json");
    if (wantsJson || (req.headers.get("content-type") || "").includes("application/json")) {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.redirect(new URL("/admin/operativos", req.url), 303);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Error" },
      { status: 500 }
    );
  }
}
