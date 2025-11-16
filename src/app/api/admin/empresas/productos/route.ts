import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";

export async function DELETE(req: Request) {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }

  let payload: { id?: string } = {};
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body inválido" }, { status: 400 });
  }

  const id = typeof payload.id === "string" ? payload.id.trim() : "";

  if (!id) {
    return NextResponse.json({ ok: false, error: "Falta el id" }, { status: 400 });
  }

  try {
    const { error } = await supabaseService.from("empresa_productos").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error?.message || "No se pudo eliminar" }, { status: 500 });
  }
}
