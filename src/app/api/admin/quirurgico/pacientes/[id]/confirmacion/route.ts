import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { sendSurgicalConfirmationEmail } from "@/lib/quirurgico/quirurgicoEmail";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(req: Request, { params }: RouteContext) {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ success: false, message: "No autorizado" }, { status: 403 });
  }

  const resolved = await params;
  const patientId = resolved?.id;

  if (!patientId) {
    return NextResponse.json({ success: false, message: "Paciente inválido" }, { status: 400 });
  }

  const result = await sendSurgicalConfirmationEmail(patientId, session.email);

  if (!result.ok) {
    console.error("[quirurgico] enviar confirmacion", result.error);
    return NextResponse.json({ success: false, message: result.error ?? "No se pudo enviar el correo" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
