// src/app/api/admin/novedades/publish/route.ts
import { NextResponse } from "next/server";
import { createSupabaseRoute } from "@/lib/supabaseRoute";

export async function POST(req: Request) {
  try {
    const { id, publicado } = await req.json();
    const supabase = createSupabaseRoute();

    const {
      data: me,
    } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", (await supabase.auth.getUser()).data.user?.id)
      .single();

    if (!me || !["admin", "editor"].includes(me.role)) {
      return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
    }

    const { error } = await supabase
      .from("novedades")
      .update({ publicado: !!publicado })
      .eq("id", id);
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Error" }, { status: 500 });
  }
}
