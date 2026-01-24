import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";

function parseValue(value: FormDataEntryValue | null): string {
  return value === null ? "" : String(value).trim();
}

function normalizeNonNegativeInt(value: FormDataEntryValue | null): number {
  const raw = parseValue(value);
  if (!raw) return 0;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed) || parsed < 0) return 0;
  return parsed;
}

function normalizeNullableText(value: FormDataEntryValue | null): string | null {
  const raw = parseValue(value);
  return raw.length ? raw : null;
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }

  const form = await req.formData();
  const id = parseValue(form.get("id"));
  if (!id) {
    return NextResponse.json({ ok: false, error: "Voluntario inválido" }, { status: 400 });
  }

  const payload = {
    operativos_asistidos: normalizeNonNegativeInt(form.get("operativos_asistidos")),
    uniformes_entregados: normalizeNonNegativeInt(form.get("uniformes_entregados")),
    nota_inventario: normalizeNullableText(form.get("nota_inventario")),
  } as const;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseService as any)
      .from("voluntarios")
      .update(payload)
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    const message = error?.message || "No se pudieron guardar los cambios.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
