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
    return `<p style="margin:0 0 12px">${escapeHtml(content)}</p>`;
  });

  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:15px;line-height:1.6;color:#111827;">
    ${htmlLines.join("\n")}
  </div>`;
}

function wrapEmail(subject: string, bodyHtml: string): string {
  const headerColor = "#0b4dbf";
  return `
  <div style="background:#f8fafc;padding:24px 16px;">
    <table width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
      <tr>
        <td style="background:${headerColor};padding:18px 24px;color:#ffffff;font-weight:600;font-size:18px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial">Traesol · Mensajería Interna</td>
      </tr>
      <tr>
        <td style="padding:20px 24px 0;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#111827;">
          <h1 style="margin:0 0 12px;font-size:20px;line-height:1.35;">${escapeHtml(subject)}</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:0 24px 12px;">${bodyHtml}</td>
      </tr>
      <tr>
        <td style="padding:16px 24px 24px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#6b7280;font-size:12px;border-top:1px solid #e5e7eb;">
          Este mensaje fue enviado desde el panel de administración de Traesol.
        </td>
      </tr>
    </table>
  </div>`;
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
