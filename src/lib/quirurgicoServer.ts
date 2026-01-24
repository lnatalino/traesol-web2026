import { randomUUID } from "node:crypto";
import { buildQuirurgicoPortalUrl, extractRutLastDigits } from "./quirurgico";
import { supabaseService } from "./supabaseService";

const ENV_PORTAL_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.SITE_URL ||
  null;

type PortalTokenResult = {
  token: string;
  url: string;
  rutUltimos4: string | null;
};

function shouldUpdate(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && Object.keys(value as Record<string, unknown>).length > 0;
}

type EnsurePortalOptions = {
  baseUrl?: string | null;
};

export async function ensureSurgicalPortalToken(patientId: string, options?: EnsurePortalOptions) {
  const { data, error } = await supabaseService
    .from("quirurgico_pacientes")
    .select("id,rut,rut_ultimos4,portal_token,portal_is_active")
    .eq("id", patientId)
    .maybeSingle();

  if (error) {
    console.error("[quirurgico] fetch paciente for portal", error);
    throw new Error("No pudimos acceder al paciente.");
  }

  if (!data) {
    throw new Error("Paciente no encontrado.");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const patientData = data as any;
  let portalToken = patientData.portal_token;
  let rutUltimos4 = patientData.rut_ultimos4 ? patientData.rut_ultimos4.trim().toUpperCase() : null;
  const updates: Record<string, unknown> = {};

  if (rutUltimos4 && patientData.rut_ultimos4 !== rutUltimos4) {
    updates.rut_ultimos4 = rutUltimos4;
  }

  if (!portalToken) {
    portalToken = randomUUID();
    updates.portal_token = portalToken;
  }

  if ((!rutUltimos4 || rutUltimos4.length === 0) && patientData.rut) {
    rutUltimos4 = extractRutLastDigits(patientData.rut);
    if (rutUltimos4) {
      updates.rut_ultimos4 = rutUltimos4;
    }
  }

  if (!patientData.portal_is_active) {
    updates.portal_is_active = true;
  }

  if (shouldUpdate(updates)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error: updateError } = await (supabaseService as any)
      .from("quirurgico_pacientes")
      .update(updates)
      .eq("id", patientId)
      .select("portal_token,rut_ultimos4")
      .single();

    if (updateError) {
      console.error("[quirurgico] update portal fields", updateError);
      throw new Error("No pudimos activar el portal.");
    }

    portalToken = updated.portal_token;
    rutUltimos4 = updated.rut_ultimos4;
  }

  if (!portalToken) {
    throw new Error("No pudimos generar el token del portal.");
  }

  const portalUrl = buildQuirurgicoPortalUrl(portalToken, options?.baseUrl ?? ENV_PORTAL_BASE_URL);
  if (!portalUrl) {
    throw new Error("No pudimos construir el enlace del portal.");
  }

  const result: PortalTokenResult = {
    url: portalUrl,
    token: portalToken,
    rutUltimos4: rutUltimos4 ?? null,
  };

  return result;
}

export async function registerSurgicalPortalAccess(patientId: string, token: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabaseService as any)
    .from("quirurgico_pacientes")
    .update({ portal_last_access_at: new Date().toISOString() })
    .eq("id", patientId)
    .eq("portal_token", token)
    .select("id")
    .single();

  if (error) {
    console.error("[quirurgico] register portal access", error);
    throw new Error("No pudimos registrar el acceso.");
  }
}
