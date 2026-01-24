import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import {
  listMessagingRecipients,
  parseMessagingFilters,
} from "@/lib/mensajeriaRecipients";
import { sendMail } from "@/lib/email";

const BATCH_SIZE = 20;
const BATCH_DELAY_MS = 250;
const PREHEADER_LENGTH = 120;

function parseValue(value: FormDataEntryValue | null): string {
  return value === null ? "" : String(value).trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatBodyHtml(body: string): string {
  const lines = body.split(/\r?\n/);
  const htmlLines = lines.map((line) => {
    const content = line.trim();
    if (!content) {
      return '<p style="margin:0 0 12px">&nbsp;</p>';
    }
    return `<p style="margin:0 0 16px">${escapeHtml(content)}</p>`;
  });

  return htmlLines.join("\n");
}

function wrapEmail(subject: string, bodyHtml: string): string {
  const HEADER_GRADIENT = "linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)";
  const SUPPORT_EMAIL = "contacto@fundaciontraesol.cl";
  const LOGO_URL = process.env.NEXT_PUBLIC_LOGO_URL || 
    "https://alohwvivujbhlpqunad.supabase.co/storage/v1/object/public/public/logo-traesol.png";
  const SITE_URL = (process.env.NEXT_PUBLIC_BASE_URL || "https://fundaciontraesol.cl").replace(/\/+$/, "");
  const year = new Date().getFullYear();
  
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
      <a href="${SITE_URL}" target="_blank" rel="noopener" style="text-decoration: none;">
        <img src="${LOGO_URL}" alt="Traesol" width="120" height="40" style="display: inline-block; max-height: 40px; width: auto; border: 0; margin-bottom: 12px;" />
      </a>
      <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700; line-height: 1.3;">${escapeHtml(subject)}</h1>
    </div>
    
    <!-- Contenido -->
    <div style="padding: 32px 24px; color: #334155; font-size: 16px; line-height: 1.6;">
      ${bodyHtml}
    </div>
    
    <!-- Footer -->
    <div style="background: #f8fafc; padding: 20px 24px; border-top: 1px solid #e2e8f0;">
      <p style="color: #64748b; font-size: 12px; margin: 0 0 8px; line-height: 1.5;">
        Este mensaje fue enviado desde el panel de administración de Traesol.
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

function buildPreheader(body: string): string {
  const compact = body.replace(/\s+/g, " ").trim();
  return compact.slice(0, PREHEADER_LENGTH);
}

function uniqueRecipients(rows: Array<{ email: string | null }>): string[] {
  const emails: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const email = (row.email || "").trim();
    if (!email) continue;
    const lower = email.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      emails.push(email);
    }
  }
  return emails;
}

async function delay(ms: number) {
  if (ms <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }

  const form = await req.formData();
  const subject = parseValue(form.get("subject"));
  const body = parseValue(form.get("body"));
  const selectedIds = Array.from(
    new Set(
      form
        .getAll("selectedIds")
        .map((value) => parseValue(value))
        .filter((value): value is string => Boolean(value))
    )
  );

  if (!subject || !body) {
    const url = new URL("/admin/mensajeria", req.url);
    url.searchParams.set("error", "Debes completar asunto y mensaje.");
    return NextResponse.redirect(url, 303);
  }

  const filterSource = {
    mode: parseValue(form.get("mode")),
    operativoId: parseValue(form.get("operativoId")),
    q: parseValue(form.get("q")),
  } as Record<string, string>;

  const filters = parseMessagingFilters(filterSource);

  if (filters.mode === "operativo" && !filters.operativoId) {
    const url = new URL("/admin/mensajeria", req.url);
    url.searchParams.set("error", "Debes seleccionar un operativo válido.");
    return NextResponse.redirect(url, 303);
  }

  if (filters.mode === "custom" && selectedIds.length === 0) {
    const url = new URL("/admin/mensajeria", req.url);
    url.searchParams.set("error", "Debes elegir al menos un voluntario para el envío personalizado.");
    return NextResponse.redirect(url, 303);
  }

  try {
    const recipients = await listMessagingRecipients(filters);
    const filteredRecipients = (() => {
      if (filters.mode !== "custom") return recipients;
      const selectedSet = new Set(selectedIds);
      return recipients.filter((recipient) => selectedSet.has(recipient.id));
    })();

    if (filters.mode === "custom" && filteredRecipients.length === 0) {
      const url = new URL("/admin/mensajeria", req.url);
      url.searchParams.set("error", "Los voluntarios seleccionados ya no están disponibles. Actualiza la lista.");
      return NextResponse.redirect(url, 303);
    }

    const emails = uniqueRecipients(
      filteredRecipients.map((recipient) => ({ email: recipient.email })) as Array<{ email: string | null }>
    );

    if (emails.length === 0) {
      const url = new URL("/admin/mensajeria", req.url);
      url.searchParams.set("error", "No hay voluntarios con email para estos filtros.");
      return NextResponse.redirect(url, 303);
    }

    const htmlBody = formatBodyHtml(body);
    const html = wrapEmail(subject, htmlBody);
    const preheader = buildPreheader(body);

    let sent = 0;
    let failed = 0;
    const failures: string[] = [];

    for (let index = 0; index < emails.length; index += BATCH_SIZE) {
      const batch = emails.slice(index, index + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((email) =>
          sendMail({
            to: email,
            subject,
            html,
            preheader,
          })
        )
      );

      results.forEach((result, idx) => {
        if (result.status === "fulfilled") {
          sent += 1;
        } else {
          failed += 1;
          const address = batch[idx];
          if (failures.length < 5) {
            const reason = result.reason?.message || String(result.reason || "Error desconocido");
            failures.push(`${address}: ${reason}`);
          }
        }
      });

      if (index + BATCH_SIZE < emails.length) {
        await delay(BATCH_DELAY_MS);
      }
    }

    const url = new URL("/admin/mensajeria", req.url);
    const summary = failed
      ? `Correos enviados: ${sent}. Fallidos: ${failed}. ${failures.join(" · ")}`
      : `Correos enviados correctamente a ${sent} destinatario${sent === 1 ? "" : "s"}.`;

    url.searchParams.set(failed ? "error" : "success", summary);
    return NextResponse.redirect(url, 303);
  } catch (err: any) {
    const message = err?.message ? String(err.message) : "No se pudo enviar el correo masivo.";
    const url = new URL("/admin/mensajeria", req.url);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url, 303);
  }
}
