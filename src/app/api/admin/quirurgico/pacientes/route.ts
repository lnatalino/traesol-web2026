import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import { normalizePatientPayload, type PatientInput } from "./utils";

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
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
  const { data: insertData, error: insertError } = await (supabaseService as any)
    .from("quirurgico_pacientes")
    .insert(data)
    .select("id")
    .single();

  if (insertError) {
    console.error("[quirurgico] insert paciente", insertError);
    return NextResponse.json(
      { ok: false, error: "No se pudo guardar el paciente. Intenta nuevamente o contacta al admin." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, id: insertData?.id });
}
