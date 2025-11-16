// src/app/api/email/voluntario/route.ts
import { NextResponse } from "next/server";
import {
  sendMail,
  tplInternoNuevaPostulacion,
  tplGraciasVoluntarioFull,
} from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const to = String(body?.to || body?.email || "").trim();
    const nombres = String(body?.nombres || "").trim();
    const apellidos = String(body?.apellidos || "").trim();

    if (!to || !nombres) {
      return NextResponse.json(
        { ok: false, error: "Faltan campos mínimos (to/email y nombres)." },
        { status: 400 }
      );
    }

    // Interno: usa tu variable RESEND_INTERNAL_TO
    const INTERNAL_TO =
      process.env.RESEND_INTERNAL_TO || "contacto@fundaciontraesol.cl";

    // 1) Notificación interna con ficha completa
    await sendMail({
      to: INTERNAL_TO,
      subject: `Nueva postulación: ${nombres} ${apellidos}`.trim(),
      html: tplInternoNuevaPostulacion(body),
      replyTo: to,
      from: process.env.EMAIL_FROM, // tus envs ya tienen EMAIL_FROM
    });

    // 2) Confirmación al postulante (ficha + CTA; varía por general/específica)
    await sendMail({
      to,
      subject: "¡Gracias por postular a Traesol!",
      html: tplGraciasVoluntarioFull(body),
      from: process.env.EMAIL_FROM,
      preheader: "Recibimos tu postulación. Pronto te contactaremos con novedades.",
    });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Error enviando correos" },
      { status: 500 }
    );
  }
}
