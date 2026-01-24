import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id: volunteerId } = await context.params;

  try {
    const { data, error } = await supabaseService
      .from("volunteer_gear_status")
      .select(`
        *,
        lanyard_type:lanyard_type_id(id, name, slug, ribbon_color_name, ribbon_hex)
      `)
      .eq("volunteer_id", volunteerId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Si no existe, crear uno por defecto
    if (!data) {
      const { data: newStatus, error: createError } = await supabaseService
        .from("volunteer_gear_status")
        .insert({
          volunteer_id: volunteerId,
          has_lanyard: true,
          has_id_card: true,
          uniform_cycles_since_issue: 0,
        } as any)
        .select(`
          *,
          lanyard_type:lanyard_type_id(id, name, slug, ribbon_color_name, ribbon_hex)
        `)
        .single();

      if (createError) {
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }

      return NextResponse.json({ data: newStatus });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Error en gear-status GET:", err);
    return NextResponse.json(
      { error: "Error al obtener estado de equipamiento" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id: volunteerId } = await context.params;

  try {
    const body = await request.json();

    // Cast temporal para tablas no en tipos generados
    const { data, error } = await supabaseService
      .from("volunteer_gear_status")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      } as unknown as never)
      .eq("volunteer_id", volunteerId)
      .select(`
        *,
        lanyard_type:lanyard_type_id(id, name, slug, ribbon_color_name, ribbon_hex)
      `)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Error en gear-status PATCH:", err);
    return NextResponse.json(
      { error: "Error al actualizar estado de equipamiento" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  // PUT es alias de PATCH para compatibilidad
  return PATCH(request, context);
}
