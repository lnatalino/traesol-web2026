import { NextResponse } from "next/server";
import { sendMail, tplGraciasEmpresa, tplInternoEmpresa } from "@/lib/email";

const TEMA_LABELS: Record<string, string> = {
  operativo_salud: "Organizar operativo de salud",
  tunnel_educativo: "Túneles educativos",
  capacitaciones: "Capacitaciones y jornadas",
  voluntariado: "Voluntariado corporativo",
  donacion: "Donación o aporte",
  otro: "Otro",
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      email,                // correo de quien escribe (obligatorio)
      nombre_persona = "",  // opcional
      cargo = "",           // opcional
      nombre_empresa = "",  // opcional
      telefono = "",        // opcional
      tema = "",            // tema de interés
      desea_reunion = "",   // "sí"/"no"
      mensaje = "",         // qué buscan / detalle
    } = body || {};

    if (!email) {
      return NextResponse.json({ ok: false, error: "Falta email" }, { status: 400 });
    }

    // --- 1) Notificación interna
    const INTERNAL_TO =
      process.env.EMAIL_INTERNAL_TO || "contacto@fundaciontraesol.cl";

    const temaLabel = tema ? (TEMA_LABELS[tema] || tema) : "";

    await sendMail({
      to: INTERNAL_TO,
      subject: `Nuevo contacto de empresa: ${nombre_empresa || nombre_persona || "sin nombre"}`,
      html: tplInternoEmpresa({
        email,
        nombre_persona,
        cargo,
        nombre_empresa,
        telefono,
        tema: temaLabel,
        desea_reunion,
        mensaje,
      }),
      replyTo: email,
      from: process.env.RESEND_FROM,
    });

    // --- 2) Agradecimiento a la empresa
    await sendMail({
      to: email,
      subject: "¡Gracias por contactarte con Traesol!",
      html: tplGraciasEmpresa({ nombre_persona, nombre_empresa }),
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
