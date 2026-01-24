import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import type { Database } from "@/lib/database.types";

type LanyardTypeRow = Database["public"]["Tables"]["lanyard_types"]["Row"];
type LanyardTypeUpdate = Database["public"]["Tables"]["lanyard_types"]["Update"];

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;

  const { data, error } = await supabaseService
    .from("lanyard_types")
    .select("*")
    .eq("id", id)
    .single<LanyardTypeRow>();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Tipo de lanyard no encontrado" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = await getAdminSession();
  if (!session.allowed || session.effectiveRole !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const body = await request.json();
    const { name, slug, ribbon_color_name, ribbon_hex, description, display_order, is_active } = body;

    const updates: LanyardTypeUpdate = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug;
    if (ribbon_color_name !== undefined) updates.ribbon_color_name = ribbon_color_name;
    if (ribbon_hex !== undefined) updates.ribbon_hex = ribbon_hex;
    if (description !== undefined) updates.description = description;
    if (display_order !== undefined) updates.display_order = display_order;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data, error } = await supabaseService
      .from("lanyard_types")
      .update(updates as never)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "El slug ya existe" }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    return NextResponse.json({ error: "Error al procesar solicitud" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const session = await getAdminSession();
  if (!session.allowed || session.effectiveRole !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await context.params;

  const { error } = await supabaseService.from("lanyard_types").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
