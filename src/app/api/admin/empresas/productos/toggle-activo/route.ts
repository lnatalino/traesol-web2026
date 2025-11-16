import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }

  let payload: { id?: string; activo?: boolean } = {};
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body inválido" }, { status: 400 });
  }

  const id = typeof payload.id === "string" ? payload.id.trim() : "";
  const activo = typeof payload.activo === "boolean" ? payload.activo : null;

  if (!id || activo === null) {
    return NextResponse.json({ ok: false, error: "Faltan campos" }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseService
      .from("empresa_productos")
      .update({ activo, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({ ok: true, producto: data });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "No se pudo actualizar" }, { status: 500 });
  }
}
