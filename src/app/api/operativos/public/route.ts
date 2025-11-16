import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseService";
import {
  mapPublicOperativos,
  PUBLIC_OPERATIVO_FIELDS,
  PUBLIC_OPERATIVO_STATES,
} from "@/lib/operativosPublic";

export const revalidate = 60;

export async function GET() {
  try {
    const stateFilters = Array.from(PUBLIC_OPERATIVO_STATES);
    const { data, error } = await supabaseService
      .from("operativos")
      .select(PUBLIC_OPERATIVO_FIELDS)
      .in("estado", stateFilters)
      .order("fecha_inicio", { ascending: true });

    if (error) {
      console.error("Error en /api/operativos/public", error);
      return NextResponse.json(
        {
          ok: false,
          error: error.message ?? "No se pudieron cargar los operativos.",
          items: [],
        },
        { status: 200 }
      );
    }

    const items = mapPublicOperativos(data);
    return NextResponse.json({ ok: true, error: null, items }, { status: 200 });
  } catch (err) {
    console.error("Excepción en /api/operativos/public", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message, items: [] }, { status: 200 });
  }
}
