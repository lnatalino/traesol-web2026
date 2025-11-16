import { NextResponse } from "next/server";
import { sendMail, tplGraciasContacto, tplInternoContacto } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      nombre = "",
      email = "",
      telefono = "",
      asunto = "",
      mensaje = "",
    } = body || {};

    if (!email || !mensaje) {
      return NextResponse.json(
        { ok: false, error: "Faltan campos obligatorios (email y mensaje)." },
        { status: 400 }
      );
    }

    const INTERNAL_TO =
      process.env.EMAIL_INTERNAL_TO || "contacto@fundaciontraesol.cl";

    // 1) Notificación interna
    await sendMail({
      to: INTERNAL_TO,
      subject: `Nuevo contacto: ${asunto || "Mensaje desde la web"}`,
      html: tplInternoContacto({ nombre, email, telefono, asunto, mensaje }),
      replyTo: email,
      from: process.env.RESEND_FROM,
    });

    // 2) Agradecimiento al usuario
    await sendMail({
      to: email,
      subject: "¡Gracias por contactarte con Traesol!",
      html: tplGraciasContacto({ nombre }),
      from: process.env.RESEND_FROM,
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Error enviando correo" },
      { status: 500 }
    );
  }
}
