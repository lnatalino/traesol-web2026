import { NextResponse } from "next/server";
import { registerSurgicalPortalAccess } from "@/lib/quirurgicoServer";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { patientId?: string; token?: string } | null;
  const patientId = typeof body?.patientId === "string" ? body.patientId : "";
  const token = typeof body?.token === "string" ? body.token : "";

  if (!patientId || !token) {
    return NextResponse.json({ ok: false, error: "Solicitud inválida" }, { status: 400 });
  }

  try {
    await registerSurgicalPortalAccess(patientId, token);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No pudimos registrar el acceso.";
    console.error("[quirurgico] portal access", error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
