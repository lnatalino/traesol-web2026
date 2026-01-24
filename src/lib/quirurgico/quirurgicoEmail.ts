import { supabaseService } from "../supabaseService";
import { sendMail } from "../email";
import type { Json } from "../database.types";
import type { OperativoQuirurgicoSummary, SurgicalEmailPayload } from "../quirurgico";
import { SURGICAL_EMAIL_SELECT } from "../quirurgico";
import { buildEmailBodyPreview } from "./communications";

const COMMUNICATION_TYPE = "confirmacion";

const DATE_FORMAT = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatDate(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return DATE_FORMAT.format(date);
}

function buildSection(label: string, value?: string | null) {
  if (!value) return "";
  return `<li><strong>${label}:</strong> ${value}</li>`;
}

const SURGICAL_EMAIL_WITH_OPERATIVO_SELECT = `${SURGICAL_EMAIL_SELECT},operativo:operativos_quirurgicos(id,titulo,slug,ciudad,lugar,fecha_inicio,fecha_fin)`;

type SurgicalPatientWithOperativo = SurgicalEmailPayload & {
  operativo?: OperativoQuirurgicoSummary | null;
};

type SurgicalEmailResult =
  | { ok: true }
  | { ok: false; error: string };

export function buildSurgicalConfirmationEmail(
  patient: SurgicalPatientWithOperativo
): { subject: string; html: string } {
  const operativoNombre = patient.operativo?.titulo || "nuestro operativo quirúrgico";
  const fechaCirugia = formatDate(patient.fecha_cirugia);
  const fechaLlegada = formatDate(patient.fecha_llegada_ciudad);
  const fechaRegreso = formatDate(patient.fecha_regreso_ciudad);

  const viajeItems = [
    buildSection("Ciudad de origen", patient.ciudad_origen),
    buildSection("Fecha de llegada", fechaLlegada),
    buildSection("Fecha de regreso", fechaRegreso),
  ].filter(Boolean);

  const html = `
    <p>Hola <strong>${patient.nombre_completo}</strong>,</p>
    <p>
      Te confirmamos tu participación en ${operativoNombre}. A continuación encontrarás un resumen
      con los datos más importantes para que prepares tu viaje y cirugía.
    </p>
    <ul>
      ${buildSection("Diagnóstico", patient.diagnostico || "En evaluación")}
      ${buildSection("Cirugía planificada", patient.cirugia_planificada || "Por confirmar")}
      ${buildSection("Fecha de cirugía", fechaCirugia || "Te avisaremos a la brevedad")}
      ${buildSection("Hora de cirugía", patient.hora_cirugia || "Por confirmar")}
    </ul>
    <p><strong>Traslado y hospedaje</strong></p>
    <ul>
      ${patient.requiere_vuelo ? "<li>Coordinaremos tus pasajes aéreos.</li>" : "<li>No se requiere vuelo.</li>"}
      ${patient.requiere_hospedaje ? "<li>Traesol gestionará tu hospedaje en Santiago.</li>" : "<li>No se requiere hospedaje adicional.</li>"}
      ${viajeItems.join("")}
    </ul>
    <p>
      Nuestro equipo se comunicará contigo si surge alguna actualización. Si tienes dudas,
      puedes responder este correo o escribirnos a <a href="mailto:contacto@fundaciontraesol.cl">contacto@fundaciontraesol.cl</a>
      o al teléfono que te compartimos previamente.
    </p>
    <p>Un abrazo,<br/>Equipo Traesol</p>
  `;

  const subject = `Confirmación operativa · ${operativoNombre}`;

  return { subject, html };
}

export async function sendSurgicalConfirmationEmail(
  pacienteId: string,
  adminEmail?: string,
  tipo: string = COMMUNICATION_TYPE,
): Promise<SurgicalEmailResult> {
  const { data: patient, error } = await supabaseService
    .from("quirurgico_pacientes")
    .select(SURGICAL_EMAIL_WITH_OPERATIVO_SELECT)
    .eq("id", pacienteId)
    .maybeSingle<SurgicalPatientWithOperativo>();

  if (error) {
    console.error("[quirurgico] fetch paciente comunicacion", error);
    return { ok: false, error: "No pudimos obtener al paciente." };
  }

  if (!patient) {
    return { ok: false, error: "Paciente no encontrado." };
  }

  if (!patient.email) {
    return { ok: false, error: "Este paciente no tiene correo registrado." };
  }

  const recipientEmail = patient.email;
  const { subject, html } = buildSurgicalConfirmationEmail(patient);

  try {
    await sendMail({
      to: recipientEmail,
      subject,
      html,
    });
  } catch (sendError) {
    console.error("[quirurgico] email envio", sendError);
    return { ok: false, error: sendError instanceof Error ? sendError.message : "No pudimos enviar el correo." };
  }

  const body_preview = buildEmailBodyPreview({ html });
  const metadata: Json = {
    enviado_por: adminEmail ?? null,
    resend_message_id: null,
    operativo_id: patient.operativo_quirurgico_id ?? null,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: logError } = await (supabaseService as any).from("quirurgico_comunicaciones").insert({
    paciente_id: patient.id,
    tipo,
    to_email: recipientEmail,
    subject,
    body_preview,
    metadata,
  });

  if (logError) {
    console.error("[quirurgico] registro comunicacion", logError);
    return { ok: false, error: "No pudimos registrar el envío." };
  }

  return { ok: true };
}
