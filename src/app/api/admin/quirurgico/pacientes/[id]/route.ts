import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import { normalizePatientPayload, type PatientInput } from "../utils";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function ensureSession() {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }
  return null;
}

export async function PUT(req: Request, { params }: RouteContext) {
  const unauthorized = await ensureSession();
  if (unauthorized) return unauthorized;

  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id) {
    return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
  }

  const body = (await req.json().catch(() => null)) as PatientInput | null;
  if (!body) {
    return NextResponse.json({ ok: false, error: "Payload inválido" }, { status: 400 });
  }

  const { data, error } = normalizePatientPayload(body);
  if (error) {
    return NextResponse.json({ ok: false, error }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabaseService as any)
    .from("quirurgico_pacientes")
    .update(data)
    .eq("id", id)
    .select("id")
    .single();

  if (updateError) {
    console.error("[quirurgico] update paciente", updateError);
    return NextResponse.json(
      { ok: false, error: "No se pudo actualizar el paciente. Intenta nuevamente o contacta al admin." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, id });
}

export async function DELETE(req: Request, { params }: RouteContext) {
  const unauthorized = await ensureSession();
  if (unauthorized) return unauthorized;

  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id) {
    return NextResponse.json({ ok: false, error: "ID inválido" }, { status: 400 });
  }

  const { error } = await supabaseService.from("quirurgico_pacientes").delete().eq("id", id);
  if (error) {
    console.error("[quirurgico] delete paciente", error);
    return NextResponse.json(
      { ok: false, error: "No se pudo eliminar el paciente. Intenta nuevamente o contacta al admin." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
