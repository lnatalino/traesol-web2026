import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseService";
import { getAdminSession } from "@/lib/adminSession";

function parseFormValue(value: FormDataEntryValue | null): string {
  return value === null ? "" : String(value).trim();
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }

  const form = await req.formData();
  const id = parseFormValue(form.get("id"));
  if (!id) {
    const url = new URL("/admin/operativos", req.url);
    url.searchParams.set("error", "Operativo inválido");
    return NextResponse.redirect(url, 303);
  }

  try {
    const { error } = await supabaseService
      .from("operativos")
      .delete()
      .eq("id", id);

    if (error) throw error;

    const redirectTo = parseFormValue(form.get("redirectTo")) || "/admin/operativos";
    return NextResponse.redirect(new URL(redirectTo, req.url), 303);
  } catch (err: any) {
    const message = err?.message ? String(err.message) : "No se pudo eliminar el operativo.";
    const url = new URL(`/admin/operativos/${id}`, req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url, 303);
  }
}
