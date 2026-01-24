import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";

function parseValue(value: FormDataEntryValue | null): string {
  return value === null ? "" : String(value).trim();
}

function normalizeOrNull(value: FormDataEntryValue | null): string | null {
  const v = parseValue(value);
  return v.length ? v : null;
}

function normalizeNonNegativeInt(value: FormDataEntryValue | null): number {
  const raw = parseValue(value);
  if (!raw) return 0;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || Number.isNaN(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }

  const form = await req.formData();
  const id = parseValue(form.get("id"));
  if (!id) {
    const url = new URL("/admin/voluntarios", req.url);
    url.searchParams.set("error", "Voluntario inválido");
    return NextResponse.redirect(url, 303);
  }

  const payload = {
    nombres: normalizeOrNull(form.get("nombres")),
    apellidos: normalizeOrNull(form.get("apellidos")),
    email: normalizeOrNull(form.get("email")),
    telefono: normalizeOrNull(form.get("telefono")),
    profesion: normalizeOrNull(form.get("profesion")),
    especialidad: normalizeOrNull(form.get("especialidad")),
    fecha_nacimiento: normalizeOrNull(form.get("fecha_nacimiento")),
    genero: normalizeOrNull(form.get("genero")),
    ciudad: normalizeOrNull(form.get("ciudad")),
    region: normalizeOrNull(form.get("region")),
    pais: normalizeOrNull(form.get("pais")),
    talla_polera: normalizeOrNull(form.get("talla_polera")),
    talla_pantalon: normalizeOrNull(form.get("talla_pantalon")),
    tipo_usuario: normalizeOrNull(form.get("tipo_usuario")),
    operativos_asistidos: normalizeNonNegativeInt(form.get("operativos_asistidos")),
    uniformes_entregados: normalizeNonNegativeInt(form.get("uniformes_entregados")),
    ultima_entrega_uniforme_en: normalizeOrNull(form.get("ultima_entrega_uniforme_en")),
    nota_inventario: normalizeOrNull(form.get("nota_inventario")),
  } as const;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabaseService as any)
      .from("voluntarios")
      .update(payload)
      .eq("id", id);

    if (error) throw error;

    const redirectTo = parseValue(form.get("redirectTo")) || `/admin/voluntarios/${id}`;
    return NextResponse.redirect(new URL(redirectTo, req.url), 303);
  } catch (err: any) {
    const message = err?.message ? String(err.message) : "No se pudo actualizar el voluntario.";
    const url = new URL(`/admin/voluntarios/${id}/editar`, req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url, 303);
  }
}
