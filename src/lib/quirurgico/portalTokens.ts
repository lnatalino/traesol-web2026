// src/lib/quirurgico/portalTokens.ts
// Sistema de tokens seguros para el portal del paciente

import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { supabaseService } from "../supabaseService";
import type { PacientePortalToken, PacientePortalTokenInfo } from "./types";

// Secreto para HMAC - debe estar en variables de entorno
const TOKEN_SECRET = process.env.PORTAL_TOKEN_SECRET || process.env.NEXTAUTH_SECRET || "fallback-dev-secret-change-in-prod";

// Duración del token en días
const TOKEN_EXPIRY_DAYS = 30;

/**
 * Genera un token aleatorio seguro
 */
export function generateSecureToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Genera el hash de un token usando HMAC-SHA256
 * Esto permite verificar tokens sin guardarlos en plano
 */
export function hashToken(token: string): string {
  return createHmac("sha256", TOKEN_SECRET)
    .update(token)
    .digest("base64url");
}

/**
 * Verifica si un token coincide con su hash de forma segura
 */
export function verifyTokenHash(token: string, storedHash: string): boolean {
  const computedHash = hashToken(token);
  try {
    // Usar comparación de tiempo constante para evitar timing attacks
    return timingSafeEqual(
      Buffer.from(computedHash, "utf8"),
      Buffer.from(storedHash, "utf8")
    );
  } catch {
    return false;
  }
}

/**
 * Calcula la fecha de expiración del token
 */
export function calculateTokenExpiry(days: number = TOKEN_EXPIRY_DAYS): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + days);
  return expiry;
}

/**
 * Crea o regenera un token de portal para un paciente.
 * 
 * IMPORTANTE: La tabla tiene UNIQUE constraint sobre paciente_id,
 * por lo que usamos UPSERT (onConflict) para:
 * - Si no existe token: crear nuevo
 * - Si existe token (incluso revocado): actualizar con nuevo token
 * 
 * Esto permite regenerar tokens después de revocarlos sin errores.
 */
export async function createPortalToken(
  pacienteId: string,
  createdBy?: string
): Promise<{ token: string; url: string; expiresAt: Date }> {
  const token = generateSecureToken();
  const tokenHash = hashToken(token);
  const expiresAt = calculateTokenExpiry();

  // UPSERT: crear nuevo token o actualizar existente
  // La tabla tiene UNIQUE(paciente_id), así que solo puede haber uno por paciente
  const { error } = await supabaseService
    .from("paciente_portal_tokens" as unknown as never)
    .upsert(
      {
        paciente_id: pacienteId,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        created_by: createdBy || "system",
        revoked_at: null,     // Limpiar revocación previa
        last_used_at: null,   // Resetear uso
        created_at: new Date().toISOString(), // Actualizar fecha de creación
      } as never,
      { 
        onConflict: "paciente_id",
        ignoreDuplicates: false  // Actualizar en caso de conflicto
      }
    );

  if (error) {
    console.error("[portalTokens] create error:", error);
    throw new Error("No se pudo crear el token de acceso");
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                  process.env.NEXT_PUBLIC_SITE_URL || 
                  "http://localhost:3000";
  
  const url = `${baseUrl.replace(/\/$/, "")}/paciente/portal?token=${token}`;

  return { token, url, expiresAt };
}

/**
 * Verifica un token y devuelve el paciente_id si es válido
 */
export async function verifyPortalToken(token: string): Promise<{
  valid: boolean;
  pacienteId?: string;
  error?: string;
}> {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "Token inválido" };
  }

  const tokenHash = hashToken(token);

  const { data, error } = await supabaseService
    .from("paciente_portal_tokens" as unknown as never)
    .select("id, paciente_id, expires_at, revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (error) {
    console.error("[portalTokens] verify error:", error);
    return { valid: false, error: "Error al verificar el token" };
  }

  if (!data) {
    return { valid: false, error: "Token no encontrado" };
  }

  const tokenData = data as { id: string; paciente_id: string; expires_at: string; revoked_at: string | null };

  // Verificar si está revocado
  if (tokenData.revoked_at) {
    return { valid: false, error: "Este enlace ha sido revocado" };
  }

  // Verificar expiración
  const expiresAt = new Date(tokenData.expires_at);
  if (expiresAt < new Date()) {
    return { valid: false, error: "Este enlace ha expirado" };
  }

  return { valid: true, pacienteId: tokenData.paciente_id };
}

/**
 * Registra el uso de un token (actualiza last_used_at)
 */
export async function recordTokenUsage(pacienteId: string): Promise<void> {
  await supabaseService
    .from("paciente_portal_tokens" as unknown as never)
    .update({ last_used_at: new Date().toISOString() } as never)
    .eq("paciente_id", pacienteId)
    .is("revoked_at", null);
}

/**
 * Revoca el token activo de un paciente
 */
export async function revokePortalToken(pacienteId: string): Promise<void> {
  const { error } = await supabaseService
    .from("paciente_portal_tokens" as unknown as never)
    .update({ revoked_at: new Date().toISOString() } as never)
    .eq("paciente_id", pacienteId)
    .is("revoked_at", null);

  if (error) {
    console.error("[portalTokens] revoke error:", error);
    throw new Error("No se pudo revocar el token");
  }
}

/**
 * Obtiene info del token activo de un paciente (para admin)
 */
export async function getPortalTokenInfo(pacienteId: string): Promise<PacientePortalTokenInfo | null> {
  const { data, error } = await supabaseService
    .from("paciente_portal_tokens" as unknown as never)
    .select("id, expires_at, last_used_at, revoked_at, created_at")
    .eq("paciente_id", pacienteId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const tokenData = data as {
    id: string;
    expires_at: string;
    last_used_at: string | null;
    revoked_at: string | null;
    created_at: string;
  };

  const expiresAt = new Date(tokenData.expires_at);
  const isExpired = expiresAt < new Date();
  const isActive = !tokenData.revoked_at && !isExpired;

  return {
    id: tokenData.id,
    expires_at: tokenData.expires_at,
    last_used_at: tokenData.last_used_at,
    revoked_at: tokenData.revoked_at,
    is_active: isActive,
    is_expired: isExpired,
    created_at: tokenData.created_at,
  };
}
