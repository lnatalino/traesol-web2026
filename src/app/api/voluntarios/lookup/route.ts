// src/app/api/voluntarios/lookup/route.ts
import { NextResponse } from "next/server";
import { createSupabaseRoute } from "@/lib/supabaseRoute";

function normalizeRut(raw: string) {
  return String(raw || "").replace(/\./g, "").replace(/-/g, "").trim().toUpperCase();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rut = normalizeRut(body?.rut || "");
    const idn = String(body?.id_nacional || "").trim();

    if (!rut && !idn) {
      return NextResponse.json({ ok: false, error: "Enviar rut o id_nacional" }, { status: 400 });
    }

    const supabase = createSupabaseRoute();

    let query = supabase
      .from("voluntarios")
      .select(
        [
          "nombres",
          "apellidos",
          "nacionalidad",
          "genero",
          "fecha_nacimiento",
          "rut",
          "id_nacional",
          "pasaporte",
          "email",
          "telefono",
          "direccion",
          "instagram",
          "profesion",
          "profesion_otro",
          "especialidad",
          "talla_polera",
          "talla_pantalon",
          "nombre_credencial",
        ].join(",")
      )
      .limit(1);

    if (rut) query = query.eq("rut", rut);
    else query = query.eq("id_nacional", idn);

    const { data, error } = await query;
    if (error) throw error;

    const row = data?.[0];
    if (!row) {
      return NextResponse.json({ ok: true, found: false });
    }

    return NextResponse.json({ ok: true, found: true, data: row });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Error en lookup" },
      { status: 500 }
    );
  }
}
