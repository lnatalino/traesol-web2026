import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import type { Database } from "@/lib/database.types";

type LanyardTypeRow = Database["public"]["Tables"]["lanyard_types"]["Row"];
type LanyardTypeInsert = Database["public"]["Tables"]["lanyard_types"]["Insert"];

export async function GET() {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { data, error } = await supabaseService
    .from("lanyard_types")
    .select("*")
    .order("display_order", { ascending: true })
    .returns<LanyardTypeRow[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session.allowed || session.effectiveRole !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, slug, ribbon_color_name, ribbon_hex, description, display_order } = body;

    if (!name || !slug || !ribbon_color_name) {
      return NextResponse.json(
        { error: "Nombre, slug y color son requeridos" },
        { status: 400 }
      );
    }

    const insertData: LanyardTypeInsert = {
      name,
      slug,
      ribbon_color_name,
      ribbon_hex: ribbon_hex || null,
      description: description || null,
      display_order: display_order || 0,
      is_active: true,
    };

    const { data, error } = await supabaseService
      .from("lanyard_types")
      .insert(insertData as never)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "El slug ya existe" }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Error al procesar solicitud" }, { status: 500 });
  }
}
