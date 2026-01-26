// src/lib/email.ts
import { Resend } from "resend";
import { generateApprovalUrls } from "./approvalTokens";

const resend = new Resend(process.env.RESEND_API_KEY);

// ===== Config por entorno / defaults seguros =====
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://fundaciontraesol.cl").replace(/\/+$/, "");
const LOGO_URL =
  process.env.NEXT_PUBLIC_LOGO_URL ||
  "https://alohwvivujbhlpqunad.supabase.co/storage/v1/object/public/public/logo-traesol.png";
const BRAND_COLOR = "#0b4dbf";

type SendMailParams = {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  preheader?: string;
};

export type EmpresaProductoEmailSummary = {
  nombre: string;
  cantidad?: number | null;
  nota?: string | null;
  categoria?: string | null;
  config?: Record<string, any> | null;
};
export type EmpresaSolicitudCarritoItem = {
  productoId: string;
  titulo: string;
  categoria?: string | null;
  cantidad: number;
  nota?: string | null;
  config?: Record<string, any> | null;
};
export type EmpresaSolicitudCarritoResumen = {
  items: EmpresaSolicitudCarritoItem[];
};
export type EmpresaSolicitudEmailPayload = {
  empresaNombre: string;
  contactoNombre: string;
  contactoEmail: string;
  contactoTelefono?: string | null;
  ciudad?: string | null;
  deseaReunion?: boolean | null;
  comentario?: string | null;
  fechaRecepcion: string;
  carritoResumen?: EmpresaSolicitudCarritoResumen | null;
};

export async function sendMail({
  to,
  subject,
  html,
  from,
  replyTo,
  preheader,
}: SendMailParams) {
  const sender =
    from ??
    process.env.EMAIL_FROM ??
    "Fundación Traesol <notificaciones@mail.traesol.cl>";

  const htmlWithPreheader = preheader ? injectPreheader(html, preheader) : html;

  return await resend.emails.send({
    from: sender,
    to,
    subject,
    html: htmlWithPreheader,
    ...(replyTo ? { reply_to: replyTo } : {}),
  } as any);
}

/* =======================================================================
   SHELL · Layout con LOGO + header gradiente + footer (inline CSS)
   Unificado con diseño de "Bienvenida Admin"
   ======================================================================= */

const HEADER_GRADIENT = "linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)";
const SUPPORT_EMAIL = "contacto@fundaciontraesol.cl";

function shell({
  title,
  body,
  prefooter,
}: {
  title: string;
  body: string;
  prefooter?: string;
}) {
  const homeUrl = SITE_URL || "https://fundaciontraesol.cl";
  const safeTitle = escapeHtml(title);
  const year = new Date().getFullYear();
  const footerNote = prefooter || "Este es un mensaje automático.";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; background: #f8fafc; padding: 24px; margin: 0;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <!-- Header con gradiente -->
    <div style="background: ${HEADER_GRADIENT}; padding: 32px 24px; text-align: center;">
      <a href="${homeUrl}" target="_blank" rel="noopener" style="text-decoration: none;">
        <img src="${LOGO_URL}" alt="Traesol" width="120" height="40" style="display: inline-block; max-height: 40px; width: auto; border: 0; margin-bottom: 12px;" />
      </a>
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; line-height: 1.3;">${safeTitle}</h1>
    </div>
    
    <!-- Contenido -->
    <div style="padding: 32px 24px; color: #334155; font-size: 16px; line-height: 1.6;">
      ${body}
    </div>
    
    <!-- Footer -->
    <div style="background: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 12px; margin: 0 0 8px; line-height: 1.5;">
        ${escapeHtml(footerNote)}
      </p>
      <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px;">
        ¿Dudas? Escríbenos a <a href="mailto:${SUPPORT_EMAIL}" style="color: #0b4dbf; text-decoration: none;">${SUPPORT_EMAIL}</a>
      </p>
      <p style="color: #94a3b8; font-size: 12px; margin: 0;">
        © ${year} Fundación Traesol. Todos los derechos reservados.
      </p>
    </div>
  </div>
</body>
</html>`;
}

/* =======================================================================
   Utils
   ======================================================================= */

const CARRO_CONFIG_LABELS: Record<string, string> = {
  numero_tuneles: "Túneles",
  dias: "Días",
  comentario_tunel: "Comentario túnel",
  tipo_operativo_especialidades: "Tipo operativo",
  meta_atenciones: "Meta atenciones",
  comentario_operativo: "Comentario operativo",
  numero_cirugias: "Cirugías",
  tipo_cirugia: "Tipo de cirugía",
  comentario_quirurgico: "Comentario quirúrgico",
  ajustes_pack: "Ajustes del pack",
};

function kvTable(payload: Record<string, any>) {
  const rows = Object.entries(payload || {}).map(
    ([k, v]) => `
      <tr>
        <td style="padding:6px 10px;color:#6b7280;vertical-align:top;white-space:nowrap">${escapeHtml(k)}</td>
        <td style="padding:6px 10px;vertical-align:top"><strong>${escapeHtml(String(v ?? ""))}</strong></td>
      </tr>`
  );
  return `<table style="border-collapse:collapse;width:100%;margin:10px 0 0">${rows.join("")}</table>`;
}

function productosSelectedList(items: EmpresaProductoEmailSummary[]) {
  if (!items?.length) {
    return `<p style="margin:6px 0;color:#6b7280">Sin selección específica</p>`;
  }

  const rows = items
    .map((item) => {
      const cantidadLabel = item.cantidad ? ` (x${item.cantidad})` : "";
      const notaLabel = item.nota
        ? `<br/><small style="color:#6b7280">${escapeHtml(item.nota)}</small>`
        : "";
      const configSummary = formatConfigSummaryForEmail(item.config);
      const configLabel = configSummary ? `<br/><small style="color:#6b7280">${configSummary}</small>` : "";
      return `<li style="margin-bottom:6px"><strong>${escapeHtml(item.nombre)}</strong>${cantidadLabel}${notaLabel}${configLabel}</li>`;
    })
    .join("");

  return `<ul style="padding-left:18px;margin:6px 0">${rows}</ul>`;
}

function renderCarritoItems(carrito?: EmpresaSolicitudCarritoResumen | null) {
  const items = carrito?.items?.filter((item) => item && item.titulo?.trim().length);
  if (!items?.length) {
    return "";
  }
  const rows = items
    .map((item) => {
      const categoria = item.categoria ? ` · ${escapeHtml(item.categoria)}` : "";
      const nota = item.nota ? `<br/><small style="color:#6b7280">${escapeHtml(item.nota)}</small>` : "";
      const configSummary = formatConfigSummaryForEmail(item.config);
      const config = configSummary ? `<br/><small style="color:#6b7280">${configSummary}</small>` : "";
      return `<li style="margin-bottom:8px"><strong>${escapeHtml(item.titulo)}</strong>${categoria} · ${item.cantidad}×${nota}${config}</li>`;
    })
    .join("");
  return `<p style="margin:16px 0 6px;font-weight:600;color:#111827">Servicios que te interesan:</p><ul style="margin:0 0 12px 18px;padding:0;color:#1f2937">${rows}</ul>`;
}

function humanizeConfigKey(key: string): string {
  return key
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatConfigSummaryForEmail(config: Record<string, any> | null | undefined): string | null {
  if (!config) return null;
  const entries = Object.entries(config)
    .map(([key, value]) => {
      if (value === undefined || value === null || value === "") return null;
      const label = CARRO_CONFIG_LABELS[key] ?? humanizeConfigKey(key);
      return `${escapeHtml(label)}: ${escapeHtml(String(value))}`;
    })
    .filter((item): item is string => Boolean(item));
  return entries.length ? entries.join(" · ") : null;
}

function escapeHtml(s: string) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function injectPreheader(html: string, preheader: string) {
  const ph = `
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">
    ${escapeHtml(preheader)}&#847;&zwnj;&#847;&zwnj;&#847;&zwnj;&#847;&zwnj;&#847;&zwnj;
  </div>`;
  if (/<body[^>]*>/i.test(html)) {
    return html.replace(/<body[^>]*>/i, (m) => `${m}${ph}`);
  }
  return ph + html;
}

/* =======================================================================
   TEMPLATES · VOLUNTARIADO
   ======================================================================= */

export function tplGraciasVoluntario({ nombres }: { nombres: string }) {
  const name = escapeHtml(nombres || "voluntario/a");
  const operativosUrl = SITE_URL ? `${SITE_URL}/operativos` : "#";
  const instagramUrl = "https://www.instagram.com/traesol/";

  return shell({
    title: "¡Gracias por postular a Traesol!",
    body: `
      <p style="margin:0 0 12px">Estimado/a <strong>${name}</strong>,</p>
      <p style="margin:0 0 12px">
        <strong>¡Muchísimas gracias por querer ser parte de nuestros voluntariados!</strong><br/>
        El apoyo de cada persona es profundamente importante: con tu ayuda podemos llegar a más
        pacientes y comunidades. Tu aporte siempre es significativo.
      </p>
      <p style="margin:0 0 12px">
        Hemos recibido tu postulación y nuestro equipo la revisará a la brevedad.
        Te mantendremos al tanto de los próximos operativos disponibles.
      </p>
      <div style="margin:16px 0">
        <a href="${operativosUrl}" target="_blank" rel="noopener"
           style="display:inline-block;background:${BRAND_COLOR};color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600">
          Ver operativos disponibles
        </a>
      </div>
      <p style="margin:16px 0 0;color:#6b7280">
        Mientras tanto, puedes seguir nuestras novedades en Instagram:
        <a href="${instagramUrl}" target="_blank" rel="noopener" style="color:${BRAND_COLOR};text-decoration:none">@traesol</a>.
      </p>
    `,
    prefooter: "Este mensaje fue enviado automáticamente por Traesol.",
  });
}

export function tplActualizacionVoluntario({ nombres }: { nombres: string }) {
  const name = escapeHtml(nombres || "voluntario/a");
  return shell({
    title: "Actualizamos tus datos en Traesol",
    body: `
      <p style="margin:0 0 12px">Hola <strong>${name}</strong>,</p>
      <p style="margin:0 0 12px">
        Confirmamos que actualizamos exitosamente tu ficha de voluntario en Fundación Traesol.
      </p>
      <p style="margin:0 0 12px">
        Si deseas postular a operativos específicos o revisar futuras convocatorias, puedes volver al formulario cuando quieras.
      </p>
      <p style="margin:0 0 16px">¡Gracias por mantener tus datos al día y seguir colaborando con Traesol!</p>
    `,
    prefooter: "Notificación automática · Fundación Traesol",
  });
}

// Agradecimiento COMPLETO con ficha + variación por tipo
export function tplGraciasVoluntarioFull(body: Record<string, any>) {
  const nombres = escapeHtml(String(body?.nombres || "voluntario/a"));
  const tipo = String(body?.tipo_postulacion || "general");
  const operativoSlug = String(body?.operativo_slug || "");
  const operativosUrl = SITE_URL ? `${SITE_URL}/operativos` : "#";
  const operativoUrl =
    SITE_URL && operativoSlug ? `${SITE_URL}/operativos/${operativoSlug}` : operativosUrl;

  const introEspecifica = `
    <p style="margin:0 0 12px">
      Hemos recibido tu postulación al <strong>operativo específico</strong>.
      Te confirmaremos por correo si quedas seleccionado/a y los pasos a seguir.
    </p>
    <div style="margin:16px 0">
      <a href="${operativoUrl}" target="_blank" rel="noopener"
         style="display:inline-block;background:${BRAND_COLOR};color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600">
        Ver operativo
      </a>
    </div>
  `;

  const introGeneral = `
    <p style="margin:0 0 12px">
      Registramos tu <strong>postulación general</strong>. Te iremos avisando de
      los próximos operativos disponibles para que te inscribas con un solo clic.
    </p>
    <div style="margin:16px 0">
      <a href="${operativosUrl}" target="_blank" rel="noopener"
         style="display:inline-block;background:${BRAND_COLOR};color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600">
        Ver operativos disponibles
      </a>
    </div>
  `;

  const ficha = kvTable({
    nombres: body?.nombres,
    apellidos: body?.apellidos,
    email: body?.email || body?.to,
    telefono: body?.telefono,
    instagram: body?.instagram,
    profesion: body?.profesion,
    especialidad: body?.especialidad,
    talla_polera: body?.talla_polera,
    talla_pantalon: body?.talla_pantalon,
    tipo_postulacion: tipo,
    operativo_slug: operativoSlug || undefined,
  });

  return shell({
    title: "¡Gracias por postular!",
    body: `
      <p style="margin:0 0 12px">Estimado/a <strong>${nombres}</strong>,</p>
      <p style="margin:0 0 12px">
        <strong>¡Muchísimas gracias por querer ser parte de nuestros voluntariados!</strong>
        El apoyo de cada persona es profundamente importante: con tu ayuda podemos llegar a más
        pacientes y comunidades. Tu aporte siempre será significativo ❤️.
      </p>
      ${tipo === "especifica" ? introEspecifica : introGeneral}
      <h3 style="margin:16px 0 8px;font-size:16px;color:#111827">Resumen de tu postulación</h3>
      ${ficha}
      <p style="margin:16px 0 0;color:#6b7280;font-size:12px">
        Si actualizas algún dato (por ejemplo, tallas o contacto) quedará guardado en tu registro.
      </p>
    `,
    prefooter: "Este mensaje fue enviado automáticamente por Traesol.",
  });
}

export function tplInternoNuevaPostulacion(payload: Record<string, any>) {
  const pretty = kvTable(payload);
  return shell({
    title: "Nueva postulación de voluntariado",
    body: `
      <p style="margin:0 0 12px">Llegó un nuevo formulario de postulación.</p>
      ${pretty}
    `,
    prefooter: "Notificación automática · Traesol",
  });
}

/* =======================================================================
   TEMPLATES · INSCRIPCIONES / OPERATIVOS
   ======================================================================= */

type OperativoInfo = {
  titulo: string;
  fecha_inicio?: string | null;
  fecha_fin?: string | null;
  lugar?: string | null;
  descripcion?: string | null;
  link?: string | null;
};

function formatDateLabel(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("es-CL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function operativoSummaryTable(op: OperativoInfo) {
  const rows: Record<string, string | null | undefined> = {
    "Fecha de inicio": formatDateLabel(op.fecha_inicio),
    "Fecha de término": formatDateLabel(op.fecha_fin),
    Lugar: op.lugar,
  };

  return kvTable(rows);
}

type InscripcionEstadoEmail = {
  to: string;
  nombre?: string | null;
  operativoTitulo?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  lugar?: string | null;
  whatsappGrupoUrl?: string | null;
};

function buildOperativoInfoFromParams(params: InscripcionEstadoEmail): OperativoInfo {
  return {
    titulo: params.operativoTitulo || "un operativo de Traesol",
    fecha_inicio: params.fechaInicio,
    fecha_fin: params.fechaFin,
    lugar: params.lugar,
  };
}

function displayNombreCorto(nombre?: string | null): string {
  const trimmed = String(nombre || "").trim();
  return trimmed.length ? trimmed : "voluntario/a";
}

export function tplGraciasPostulacionOperativo({
  voluntario,
  operativo,
}: {
  voluntario: { nombres?: string | null };
  operativo: OperativoInfo;
}) {
  const nombre = escapeHtml(voluntario?.nombres || "voluntario/a");
  const resumen = operativoSummaryTable(operativo);
  const link = operativo.link || (operativo.titulo ? `${SITE_URL || "#"}/operativos` : null);

  return shell({
    title: `Gracias por postular a ${escapeHtml(operativo.titulo || "Traesol")}`,
    body: `
      <p style="margin:0 0 12px">Hola <strong>${nombre}</strong>,</p>
      <p style="margin:0 0 12px">
        Gracias por postular al operativo <strong>${escapeHtml(operativo.titulo || "de Traesol")}</strong>.
        Nuestro equipo revisará tu postulación y te contactará para confirmar los siguientes pasos.
      </p>
      <p style="margin:0 0 12px">Mientras tanto, aquí tienes un resumen del operativo:</p>
      ${resumen}
      ${link ? `
        <div style="margin:16px 0">
          <a href="${escapeHtml(link)}" target="_blank" rel="noopener"
             style="display:inline-block;background:${BRAND_COLOR};color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600">
            Ver detalles del operativo
          </a>
        </div>` : ""}
      <p style="margin:16px 0 0;color:#6b7280;font-size:12px">
        Si no reconoces esta postulación puedes ignorar este correo.
      </p>
    `,
    prefooter: "Mensaje automático · Fundación Traesol",
  });
}

export async function sendInscripcionAceptadaEmail(params: InscripcionEstadoEmail) {
  const nombre = escapeHtml(displayNombreCorto(params.nombre));
  const operativo = buildOperativoInfoFromParams(params);
  const resumen = operativoSummaryTable(operativo);
  const tituloOperativo = escapeHtml(operativo.titulo || "Traesol");
  const whatsappRaw = (params.whatsappGrupoUrl || "").trim();
  const whatsappLink = whatsappRaw ? escapeHtml(whatsappRaw) : "";

  const html = shell({
    title: `Postulación aceptada · ${tituloOperativo}`,
    body: `
      <p style="margin:0 0 12px">Hola <strong>${nombre}</strong>,</p>
      <p style="margin:0 0 12px">
        ¡Tenemos excelentes noticias! Tu postulación para el operativo <strong>${tituloOperativo}</strong> fue
        <strong>aceptada</strong>. Nuestro equipo te contactará con los pasos finales y la coordinación en terreno.
      </p>
      <p style="margin:0 0 12px">Te recordamos los datos principales:</p>
      ${resumen}
      ${
        whatsappLink
          ? `
      <p style="margin:0 0 12px">
        Además, te dejamos el enlace al grupo de WhatsApp de este operativo.<br />
        Este será el canal principal de comunicación con el equipo, así que te pedimos que te unas lo antes posible:
        <br />
        <a href="${whatsappLink}" target="_blank" rel="noopener" style="color:${BRAND_COLOR};text-decoration:none;word-break:break-all;">
          ${whatsappLink}
        </a>
      </p>`
          : ""
      }
      <p style="margin:0 0 12px">
        Gracias por ser parte de Traesol y por poner tu tiempo y conocimiento al servicio de otras personas.
        Tu compromiso hace posible que lleguemos a más comunidades.
      </p>
    `,
    prefooter: "Mensaje automático · Fundación Traesol",
  });

  await sendMail({
    to: params.to,
    subject: `Tu postulación al operativo ${operativo.titulo || "Traesol"} fue aceptada`,
    html,
    preheader: `Confirmamos tu participación en ${operativo.titulo || "nuestro próximo operativo"}.`,
  });
}

export async function sendInscripcionRechazadaEmail(params: InscripcionEstadoEmail) {
  const nombre = escapeHtml(displayNombreCorto(params.nombre));
  const operativo = buildOperativoInfoFromParams(params);
  const tituloOperativo = escapeHtml(operativo.titulo || "Traesol");

  const html = shell({
    title: `Actualización sobre ${tituloOperativo}`,
    body: `
      <p style="margin:0 0 12px">Hola <strong>${nombre}</strong>,</p>
      <p style="margin:0 0 12px">
        Queremos agradecerte sinceramente por postular al operativo <strong>${tituloOperativo}</strong> y por tu disposición a ayudar.
        En esta oportunidad, y debido a cupos limitados y a la organización de los equipos, no podremos contar contigo en este operativo.
      </p>
      <p style="margin:0 0 12px">
        Queremos que sepas que valoramos muchísimo tu tiempo y tu interés. Tu registro queda activo en nuestra base
        de voluntariado para futuras oportunidades, y nos encantaría que sigas postulando a los próximos operativos.
      </p>
      <p style="margin:0 0 12px">
        Gracias nuevamente por confiar en Traesol. Sin personas como tú, este proyecto no sería posible.
      </p>
    `,
    prefooter: "Mensaje automático · Fundación Traesol",
  });

  await sendMail({
    to: params.to,
    subject: `Actualización sobre tu postulación a ${operativo.titulo || "Traesol"}`,
    html,
    preheader: "Gracias por postular. Te invitamos a seguir participando en próximos operativos.",
  });
}

export function tplInternoNuevaInscripcionOperativo({
  voluntario,
  operativo,
  origen,
}: {
  voluntario: { nombres?: string | null; apellidos?: string | null; email?: string | null };
  operativo: OperativoInfo;
  origen: string;
}) {
  const pretty = kvTable({
    voluntario: [voluntario.nombres, voluntario.apellidos].filter(Boolean).join(" ") || "—",
    email: voluntario.email || "—",
    operativo: operativo.titulo || "—",
    fecha_inicio: formatDateLabel(operativo.fecha_inicio),
    origen,
  });

  return shell({
    title: "Nueva postulación a operativo",
    body: `
      <p style="margin:0 0 12px">Se registró una nueva inscripción a un operativo.</p>
      ${pretty}
    `,
    prefooter: "Notificación automática · Traesol",
  });
}

export function tplInvitacionOperativo({
  voluntario,
  operativo,
  acceptUrl,
  rejectUrl,
}: {
  voluntario: { nombres?: string | null };
  operativo: OperativoInfo;
  acceptUrl: string;
  rejectUrl: string;
}) {
  const nombre = escapeHtml(voluntario?.nombres || "voluntario/a");
  const resumen = operativoSummaryTable(operativo);

  return shell({
    title: `Invitación al operativo ${escapeHtml(operativo.titulo || "Traesol")}`,
    body: `
      <p style="margin:0 0 12px">Hola <strong>${nombre}</strong>,</p>
      <p style="margin:0 0 12px">
        Nos encantaría contar contigo en el operativo <strong>${escapeHtml(operativo.titulo || "de Traesol")}</strong>.
        Presiona una de las opciones para confirmar tu disponibilidad.
      </p>
      ${resumen}
      <div style="margin:18px 0;display:flex;gap:12px;flex-wrap:wrap">
        <a href="${escapeHtml(acceptUrl)}" target="_blank" rel="noopener"
           style="display:inline-block;background:${BRAND_COLOR};color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600">
          Aceptar invitación
        </a>
        <a href="${escapeHtml(rejectUrl)}" target="_blank" rel="noopener"
           style="display:inline-block;background:#e11d48;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600">
          Rechazar invitación
        </a>
      </div>
      <p style="margin:16px 0 0;color:#6b7280;font-size:12px">
        Si aceptas, te enviaremos la información logística y pendientes a completar.
        En caso de rechazar, puedes hacerlo más adelante volviendo a este correo.
      </p>
    `,
    prefooter: "Mensaje automático · Fundación Traesol",
  });
}

/* =======================================================================
   SENDER HELPERS
   ======================================================================= */

const INTERNAL_EMAIL = process.env.RESEND_INTERNAL_TO || "contacto@fundaciontraesol.cl";

export async function sendRegistroVoluntarioEmail(payload: { to: string; nombres: string }) {
  const html = tplGraciasVoluntario({ nombres: payload.nombres });
  await sendMail({
    to: payload.to,
    subject: "¡Gracias por sumarte como voluntario!",
    html,
    from: process.env.EMAIL_FROM,
    preheader: "Recibimos tu registro en Fundación Traesol.",
  });
}

export async function sendActualizacionVoluntarioEmail(payload: { to: string; nombres: string }) {
  const html = tplActualizacionVoluntario({ nombres: payload.nombres });
  await sendMail({
    to: payload.to,
    subject: "Actualizamos tus datos de voluntario",
    html,
    from: process.env.EMAIL_FROM,
    preheader: "Tus datos en Traesol están al día.",
  });
}

export async function sendPostulacionOperativoEmails({
  voluntario,
  operativo,
  origen,
}: {
  voluntario: { nombres: string; apellidos?: string | null; email: string };
  operativo: OperativoInfo;
  origen: string;
}) {
  const html = tplGraciasPostulacionOperativo({ voluntario, operativo });
  await sendMail({
    to: voluntario.email,
    subject: `Postulación registrada: ${operativo.titulo ?? "Operativo Traesol"}`,
    html,
    from: process.env.EMAIL_FROM,
    preheader: "Registramos tu postulación, pronto recibirás novedades.",
  });

  const internoHtml = tplInternoNuevaInscripcionOperativo({ voluntario, operativo, origen });
  await sendMail({
    to: INTERNAL_EMAIL,
    subject: `Nueva inscripción a ${operativo.titulo ?? "operativo Traesol"}`,
    html: internoHtml,
    from: process.env.EMAIL_FROM,
    replyTo: voluntario.email,
  });
}

export async function sendInvitacionOperativoEmail({
  voluntario,
  operativo,
  acceptUrl,
  rejectUrl,
}: {
  voluntario: { nombres: string; email: string };
  operativo: OperativoInfo;
  acceptUrl: string;
  rejectUrl: string;
}) {
  const html = tplInvitacionOperativo({ voluntario, operativo, acceptUrl, rejectUrl });
  await sendMail({
    to: voluntario.email,
    subject: `Invitación al operativo ${operativo.titulo ?? "Traesol"}`,
    html,
    from: process.env.EMAIL_FROM,
    preheader: "Confirma tu participación en el operativo.",
  });
}

/* =======================================================================
   TEMPLATES · EMPRESAS
   ======================================================================= */

export function tplGraciasEmpresa({
  nombre_persona,
  nombre_empresa,
  productos = [],
  mensaje,
}: {
  nombre_persona: string;
  nombre_empresa: string;
  productos?: EmpresaProductoEmailSummary[];
  mensaje?: string | null;
}) {
  const name = escapeHtml(nombre_persona || "equipo");
  const empresa = escapeHtml(nombre_empresa || "su empresa");
  const contactoUrl = SITE_URL ? `${SITE_URL}/empresas` : "#";
  const productosHtml = productos?.length
    ? `
      <h3 style="margin:18px 0 6px;font-size:16px;color:#111827">Productos de interés</h3>
      ${productosSelectedList(productos)}
    `
    : "";
  const mensajeHtml = mensaje
    ? `
      <p style="margin:18px 0 6px;color:#374151">Lo que nos contaron:</p>
      <blockquote style="margin:0;padding:10px 14px;border-left:3px solid ${BRAND_COLOR};background:#f3f4f6;border-radius:12px;color:#1f2937">${escapeHtml(
        mensaje,
      )}</blockquote>
    `
    : "";

  return shell({
    title: "¡Gracias por contactarnos!",
    body: `
      <p style="margin:0 0 12px">Hola, <strong>${name}</strong> 👋</p>
      <p style="margin:0 0 12px">
        Recibimos el formulario de <strong>${empresa}</strong>. Nos alegra que quieran explorar
        alianzas, programas o voluntariado corporativo junto a Traesol.
      </p>
      <p style="margin:0 0 16px">
        Nuestro equipo revisará su solicitud y les escribirá para coordinar una reunión según disponibilidad.
      </p>
      ${productosHtml}
      ${mensajeHtml}
      <div style="margin:16px 0">
        <a href="${contactoUrl}" target="_blank" rel="noopener"
           style="display:inline-block;background:${BRAND_COLOR};color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600">
          Ver información para empresas
        </a>
      </div>
    `,
    prefooter: "Gracias por querer impactar con nosotros.",
  });
}

export function tplEmpresaSolicitudInterna(payload: EmpresaSolicitudEmailPayload) {
  const {
    empresaNombre,
    contactoNombre,
    contactoEmail,
    contactoTelefono,
    ciudad,
    comentario,
    fechaRecepcion,
    carritoResumen,
    deseaReunion,
  } = payload;

  const contacto = contactoNombre ? escapeHtml(contactoNombre) : "—";
  const telefonoLabel = contactoTelefono ? escapeHtml(contactoTelefono) : "—";
  const ciudadLabel = ciudad ? escapeHtml(ciudad) : "—";
  const reunionLabel =
    typeof deseaReunion === "boolean" ? (deseaReunion ? "Sí, desea coordinarlas" : "Prefiere solo información") : "No indicó";
  const comentarioBlock = comentario
    ? `
      <p style="margin:16px 0 6px;font-weight:600;color:#111827">Mensaje de la empresa:</p>
      <blockquote style="margin:0;padding:12px 18px;border-left:3px solid ${BRAND_COLOR};background:#f8fafc;border-radius:12px;color:#1f2937">${escapeHtml(
        comentario,
      )}</blockquote>
    `
    : `<p style="margin:16px 0;color:#6b7280">La empresa no agregó un mensaje adicional.</p>`;
  const carritoBlock = renderCarritoItems(carritoResumen);
  const carritoFallback = carritoBlock
    ? ""
    : `<p style="margin:16px 0;color:#6b7280">No seleccionaron servicios específicos; revisa la respuesta en detalle.</p>`;

  return shell({
    title: "Nueva solicitud de empresa",
    body: `
      <p style="margin:0 0 12px">Hola equipo Traesol,</p>
      <p style="margin:0 0 12px">
        Se ha recibido una nueva solicitud desde el formulario de Empresas en el sitio web.
      </p>
      <h3 style="margin:18px 0 8px;font-size:16px;color:#111827">Datos de contacto</h3>
      ${kvTable({
        Empresa: empresaNombre,
        "Nombre de contacto": contacto,
        Email: contactoEmail,
        Teléfono: telefonoLabel,
        Ciudad: ciudadLabel,
        "Fecha de recepción": fechaRecepcion,
        "¿Solicita reunión?": reunionLabel,
      })}
      <h3 style="margin:18px 0 8px;font-size:16px;color:#111827">Servicios seleccionados</h3>
      ${carritoBlock || carritoFallback}
      ${comentarioBlock}
      <p style="margin:24px 0 0;color:#111827">
        Por favor, revisa esta solicitud y contáctalos para coordinar los siguientes pasos.
      </p>
      <p style="margin:12px 0 0;color:#111827;font-weight:600">Equipo Fundación Traesol</p>
    `,
    prefooter: "Notificación automática · Traesol",
  });
}

export function tplEmpresaSolicitudConfirmacion(payload: EmpresaSolicitudEmailPayload) {
  const {
    empresaNombre,
    contactoNombre,
    contactoEmail,
    contactoTelefono,
    ciudad,
    carritoResumen,
    deseaReunion,
  } = payload;

  const saludo = contactoNombre ? `Hola ${escapeHtml(contactoNombre)},` : `Hola ${escapeHtml(empresaNombre)},`;
  const telefonoLabel = contactoTelefono ? escapeHtml(contactoTelefono) : "No indicado";
  const ciudadLabel = ciudad ? escapeHtml(ciudad) : "No indicada";
  const productosHtml = renderCarritoItems(carritoResumen);
  const reunionParagraph =
    typeof deseaReunion === "boolean"
      ? deseaReunion
        ? `<p style="margin:12px 0;color:#111827">Marcaste que te gustaría coordinar una reunión. Nuestro equipo revisará la agenda y te propondrá horarios.</p>`
        : `<p style="margin:12px 0;color:#111827">Puedes responder a este correo cuando quieras agendar una reunión o hacer más preguntas.</p>`
      : "";
  const productosFallback = productosHtml
    ? ""
    : `<p style="margin:12px 0;color:#6b7280">No seleccionaste un servicio específico en el catálogo. Si quieres, en tu próxima comunicación puedes contarnos qué tipo de actividades o proyectos te interesan.</p>`;

  return shell({
    title: "Hemos recibido tu contacto",
    body: `
      <p style="margin:0 0 12px">${saludo}</p>
      <p style="margin:0 0 12px">
        Muchas gracias por escribirnos y por tu interés en colaborar con nosotros desde <strong>${escapeHtml(
          empresaNombre,
        )}</strong>.<br />
        Hemos recibido tu solicitud y nuestro equipo revisará los detalles para responderte a la brevedad.
      </p>
      <p style="margin:16px 0 8px;font-weight:600;color:#111827">Esto es un resumen de la información que registramos:</p>
      <ul style="margin:0 0 12px 18px;color:#1f2937">
        <li>Empresa: ${escapeHtml(empresaNombre)}</li>
        <li>Email de contacto: ${escapeHtml(contactoEmail)}</li>
        <li>Teléfono: ${telefonoLabel}</li>
        <li>Ciudad: ${ciudadLabel}</li>
      </ul>
      ${productosHtml || productosFallback}
      ${reunionParagraph}
      <p style="margin:18px 0 12px;color:#111827">
        Revisaremos tu solicitud y te escribiremos por este mismo medio para coordinar una reunión o enviarte una propuesta ajustada a lo que necesitas.
      </p>
      <p style="margin:0 0 12px;color:#111827">Un abrazo,</p>
      <p style="margin:0 0 4px;font-weight:600;color:#111827">Equipo Fundación Traesol</p>
      <p style="margin:0;color:#0b4dbf;font-weight:600">contacto@fundaciontraesol.cl</p>
    `,
    prefooter: "Gracias por confiar en Traesol",
  });
}

export function tplInternoEmpresa(payload: Record<string, any>) {
  const pretty = kvTable(payload);
  return shell({
    title: "Nuevo contacto de empresa",
    body: `
      <p style="margin:0 0 12px">Llegó un nuevo formulario de contacto desde Empresas.</p>
      ${pretty}
    `,
    prefooter: "Notificación automática · Traesol",
  });
}

/* =======================================================================
   TEMPLATES · CONTACTO
   ======================================================================= */

export function tplGraciasContacto({ nombre }: { nombre: string }) {
  const name = escapeHtml(nombre || "gracias");
  return shell({
    title: "¡Gracias por escribirnos!",
    body: `
      <p style="margin:0 0 12px">Hola, <strong>${name}</strong> 👋</p>
      <p style="margin:0 0 12px">Recibimos tu mensaje. Nuestro equipo lo revisará y te responderá a la brevedad.</p>
    `,
    prefooter: "Este mensaje fue enviado automáticamente por Traesol.",
  });
}

export function tplInternoContacto({
  nombre,
  email,
  telefono,
  asunto,
  mensaje,
}: {
  nombre: string;
  email: string;
  telefono: string;
  asunto: string;
  mensaje: string;
}) {
  const rows = [
    ["nombre", nombre],
    ["email", email],
    ["telefono", telefono],
    ["asunto", asunto],
    ["mensaje", mensaje],
  ].reduce(
    (acc, [k, v]) =>
      acc +
      `
    <tr><td style="padding:6px 10px;color:#6b7280">${escapeHtml(String(k))}</td>
    <td style="padding:6px 10px"><strong>${escapeHtml(String(v || ""))}</strong></td></tr>`,
    ""
  );
  const table = `<table style="border-collapse:collapse;width:100%">${rows}</table>`;

  return shell({
    title: "Nuevo contacto",
    body: table,
    prefooter: "Notificación automática · Traesol",
  });
}

/* =======================================================================
   TEMPLATES · POSTULACIÓN A OPERATIVO CON BOTONES ADMIN
   ======================================================================= */

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || "contacto@fundaciontraesol.cl";

export type PostulacionAdminEmailPayload = {
  inscripcionId: string;
  voluntario: {
    nombres: string | null;
    apellidos: string | null;
    email: string | null;
    telefono: string | null;
    rut: string | null;
    id_nacional: string | null;
    profesion: string | null;
    talla_polera: string | null;
    restricciones_alimentarias: string | null;
  };
  operativo: {
    id: string;
    titulo: string | null;
    slug: string | null;
    fecha_inicio: string | null;
    lugar: string | null;
  };
  /** Si fue postulado por otro usuario (ej: amigo, familiar) */
  postuladoPor?: {
    userId: string;
    email?: string | null;
  } | null;
  /** Si es postulación de usuario con cuenta (vs voluntario anónimo) */
  isUserAccount?: boolean;
};

function tplAdminNuevaPostulacion(payload: PostulacionAdminEmailPayload) {
  const { inscripcionId, voluntario, operativo, postuladoPor, isUserAccount } = payload;
  const siteUrl = SITE_URL || "https://fundaciontraesol.cl";
  
  // Para usuarios con cuenta, los botones de acción requieren diferentes endpoints
  // Por ahora, mostramos solo link al admin panel para estos casos
  const showActionButtons = !isUserAccount;
  const { acceptUrl, rejectUrl } = showActionButtons 
    ? generateApprovalUrls(inscripcionId, siteUrl)
    : { acceptUrl: "", rejectUrl: "" };
  const adminUrl = isUserAccount
    ? `${siteUrl}/admin/operativos/${operativo.id}/inscripciones`
    : `${siteUrl}/admin/inscripciones`;
  
  const nombreCompleto = [voluntario.nombres, voluntario.apellidos].filter(Boolean).join(" ") || "Sin nombre";
  const identificacion = voluntario.rut || voluntario.id_nacional || "No especificada";
  
  const datosVoluntario = kvTable({
    "Nombre": nombreCompleto,
    "Email": voluntario.email || "—",
    "Teléfono": voluntario.telefono || "—",
    "RUT / ID": identificacion,
    "Profesión": voluntario.profesion || "—",
    "Talla polera": voluntario.talla_polera || "—",
    "Restricciones alimentarias": voluntario.restricciones_alimentarias || "—",
  });

  const datosOperativo = kvTable({
    "Operativo": operativo.titulo || "Sin título",
    "Fecha": formatDateLabel(operativo.fecha_inicio) || "—",
    "Lugar": operativo.lugar || "—",
  });
  
  // Indicador si fue postulado por otra persona
  const postuladoPorHtml = postuladoPor?.userId 
    ? `<p style="margin:8px 0 0;padding:8px 12px;background:#fef3c7;border-radius:6px;font-size:13px;color:#92400e;">
        ⚠️ <strong>Postulado por otra persona</strong>${postuladoPor.email ? ` (${escapeHtml(postuladoPor.email)})` : ""}
       </p>`
    : "";
  
  // Indicador si es usuario con cuenta
  const userAccountHtml = isUserAccount 
    ? `<p style="margin:8px 0 0;padding:8px 12px;background:#dbeafe;border-radius:6px;font-size:13px;color:#1e40af;">
        👤 <strong>Usuario con cuenta registrada</strong>
       </p>`
    : "";

  // Botones de acción (solo para postulaciones anónimas con tokens)
  const actionButtonsHtml = showActionButtons ? `
        <p style="margin:0 0 16px;color:#64748b;font-size:14px;">
          Puedes aprobar o rechazar esta postulación directamente:
        </p>
        
        <div style="display:inline-block;">
          <a href="${escapeHtml(acceptUrl)}" 
             style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;margin:0 8px 8px 0;">
            ✓ Aceptar
          </a>
          <a href="${escapeHtml(rejectUrl)}" 
             style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;margin:0 0 8px 8px;">
            ✗ Rechazar
          </a>
        </div>
        
        <p style="margin:16px 0 0;">
          <a href="${escapeHtml(adminUrl)}" 
             style="color:${BRAND_COLOR};text-decoration:none;font-size:14px;">
            Ver en el panel de administración →
          </a>
        </p>
  ` : `
        <p style="margin:0 0 16px;color:#64748b;font-size:14px;">
          Gestiona esta postulación desde el panel de administración:
        </p>
        
        <a href="${escapeHtml(adminUrl)}" 
           style="display:inline-block;background:${BRAND_COLOR};color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;">
          Ver postulaciones del operativo →
        </a>
  `;

  return shell({
    title: `Nueva postulación: ${escapeHtml(nombreCompleto)}`,
    body: `
      <p style="margin:0 0 16px;font-size:16px;">
        <strong>${escapeHtml(nombreCompleto)}</strong> ha postulado al operativo 
        <strong>${escapeHtml(operativo.titulo || "")}</strong>.
      </p>
      ${postuladoPorHtml}
      ${userAccountHtml}
      
      <h3 style="margin:16px 0 8px;font-size:14px;color:#111827;text-transform:uppercase;letter-spacing:0.05em;">
        Datos del voluntario
      </h3>
      ${datosVoluntario}
      
      <h3 style="margin:24px 0 8px;font-size:14px;color:#111827;text-transform:uppercase;letter-spacing:0.05em;">
        Operativo
      </h3>
      ${datosOperativo}
      
      <div style="margin:32px 0;text-align:center;">
        ${actionButtonsHtml}
      </div>
      
      <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;text-align:center;">
        Los enlaces de acción expiran en 72 horas por seguridad.
      </p>
    `,
    prefooter: "Notificación automática · Traesol Admin",
  });
}

/**
 * Envía email al admin cuando hay una nueva postulación
 * Incluye botones de Aceptar/Rechazar con tokens seguros
 */
export async function sendPostulacionAdminEmail(payload: PostulacionAdminEmailPayload): Promise<{ ok: boolean; error?: string }> {
  try {
    const html = tplAdminNuevaPostulacion(payload);
    const nombreCompleto = [payload.voluntario.nombres, payload.voluntario.apellidos].filter(Boolean).join(" ") || "Voluntario";
    const operativoTitulo = payload.operativo.titulo || "operativo";
    
    await sendMail({
      to: ADMIN_EMAIL,
      subject: `[Postulación] ${nombreCompleto} → ${operativoTitulo}`,
      html,
      preheader: `Nueva postulación de ${nombreCompleto} al operativo ${operativoTitulo}`,
    });
    
    return { ok: true };
  } catch (err) {
    console.error("[sendPostulacionAdminEmail] Error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}

/**
 * Envía email al voluntario confirmando que recibimos su postulación
 */
export async function sendPostulacionRecibidaEmail(params: {
  to: string;
  nombre: string;
  operativoTitulo: string;
  operativoFecha: string | null;
  operativoLugar: string | null;
  operativoSlug: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const { to, nombre, operativoTitulo, operativoFecha, operativoLugar, operativoSlug } = params;
    const siteUrl = SITE_URL || "https://fundaciontraesol.cl";
    const operativoUrl = operativoSlug ? `${siteUrl}/operativos/${operativoSlug}` : `${siteUrl}/operativos`;
    
    const resumen = kvTable({
      "Operativo": operativoTitulo,
      "Fecha": formatDateLabel(operativoFecha) || "Por confirmar",
      "Lugar": operativoLugar || "Por confirmar",
      "Estado": "Pendiente de revisión",
    });

    const html = shell({
      title: `Recibimos tu postulación`,
      body: `
        <p style="margin:0 0 12px">Hola <strong>${escapeHtml(nombre)}</strong>,</p>
        <p style="margin:0 0 12px">
          ¡Gracias por postular al operativo <strong>${escapeHtml(operativoTitulo)}</strong>!
          Hemos recibido tu postulación y nuestro equipo la revisará a la brevedad.
        </p>
        <p style="margin:0 0 12px">Te avisaremos por email cuando tengamos una respuesta.</p>
        
        <h3 style="margin:24px 0 8px;font-size:14px;color:#111827;">Resumen de tu postulación</h3>
        ${resumen}
        
        <div style="margin:24px 0;text-align:center;">
          <a href="${escapeHtml(operativoUrl)}" 
             style="display:inline-block;background:${BRAND_COLOR};color:#fff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;">
            Ver detalles del operativo
          </a>
        </div>
        
        <p style="margin:16px 0 0;color:#64748b;font-size:13px;">
          Si tienes alguna pregunta, escríbenos a 
          <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_COLOR};text-decoration:none;">${SUPPORT_EMAIL}</a>.
        </p>
      `,
      prefooter: "Este mensaje fue enviado automáticamente por Traesol.",
    });

    await sendMail({
      to,
      subject: `Recibimos tu postulación a ${operativoTitulo}`,
      html,
      preheader: `Gracias por postular. Te avisaremos cuando revisemos tu postulación.`,
    });
    
    return { ok: true };
  } catch (err) {
    console.error("[sendPostulacionRecibidaEmail] Error:", err);
    return { ok: false, error: err instanceof Error ? err.message : "Error desconocido" };
  }
}
