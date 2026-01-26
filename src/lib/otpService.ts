// src/lib/otpService.ts
// Servicio para generación y verificación de OTP de 6 dígitos

import crypto from "node:crypto";
import { createSupabaseServiceRole } from "@/lib/supabaseRoute";

// =========================================================================
// TIPOS
// =========================================================================

export type OtpPurpose = "verify_email" | "reset_password";

export interface GenerateOtpResult {
  success: boolean;
  code?: string;  // Solo para envío, nunca almacenar plano
  error?: string;
}

export interface VerifyOtpResult {
  success: boolean;
  error?: string;
  expired?: boolean;
  used?: boolean;
}

// =========================================================================
// CONSTANTES
// =========================================================================

const OTP_EXPIRY_MINUTES = 15;
const OTP_LENGTH = 6;
const RATE_LIMIT_SECONDS = 60; // Mínimo 60 segundos entre envíos
const RATE_LIMIT_HOURLY = 5;   // Máximo 5 envíos por hora

// =========================================================================
// FUNCIONES DE HASH
// =========================================================================

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function generateRandomCode(): string {
  // Generar código de 6 dígitos
  const min = Math.pow(10, OTP_LENGTH - 1);
  const max = Math.pow(10, OTP_LENGTH) - 1;
  const code = crypto.randomInt(min, max + 1);
  return code.toString();
}

// =========================================================================
// FUNCIONES PRINCIPALES
// =========================================================================

/**
 * Verifica límites de envío de OTP (rate limiting)
 * Retorna null si está permitido, o mensaje de error si está bloqueado
 */
export async function checkOtpRateLimit(
  email: string,
  purpose: OtpPurpose
): Promise<string | null> {
  const supabase = createSupabaseServiceRole();
  const normalizedEmail = email.toLowerCase().trim();
  
  try {
    // 1. Verificar último envío (mínimo 60 segundos entre envíos)
    const cutoffRecent = new Date(Date.now() - RATE_LIMIT_SECONDS * 1000).toISOString();
    
    const { data: recentOtp } = await supabase
      .from("email_otps")
      .select("created_at")
      .eq("email", normalizedEmail)
      .eq("purpose", purpose)
      .gt("created_at", cutoffRecent)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    
    if (recentOtp) {
      const lastSent = new Date(recentOtp.created_at);
      const secondsRemaining = Math.ceil(
        (lastSent.getTime() + RATE_LIMIT_SECONDS * 1000 - Date.now()) / 1000
      );
      return `Debes esperar ${secondsRemaining} segundos antes de solicitar otro código`;
    }
    
    // 2. Verificar límite por hora (máximo 5 envíos por hora)
    const cutoffHourly = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { count } = await supabase
      .from("email_otps")
      .select("*", { count: "exact", head: true })
      .eq("email", normalizedEmail)
      .eq("purpose", purpose)
      .gt("created_at", cutoffHourly);
    
    if ((count || 0) >= RATE_LIMIT_HOURLY) {
      return "Has excedido el límite de solicitudes. Intenta de nuevo en 1 hora";
    }
    
    return null; // Permitido
  } catch (err) {
    console.error("[otpService] checkOtpRateLimit error:", err);
    return null; // En caso de error, permitir (fail open)
  }
}

/**
 * Genera y almacena un nuevo OTP
 * Invalida OTPs anteriores del mismo email/propósito
 */
export async function generateOtp(
  email: string,
  purpose: OtpPurpose,
  userId?: string,
  skipRateLimit = false
): Promise<GenerateOtpResult> {
  const supabase = createSupabaseServiceRole();
  const normalizedEmail = email.toLowerCase().trim();
  
  try {
    // 0. Verificar rate limit (a menos que se salte explícitamente)
    if (!skipRateLimit) {
      const rateLimitError = await checkOtpRateLimit(normalizedEmail, purpose);
      if (rateLimitError) {
        return { success: false, error: rateLimitError };
      }
    }
    
    // 1. Invalidar OTPs anteriores del mismo propósito
    await supabase.rpc("invalidate_previous_otps", {
      p_email: normalizedEmail,
      p_purpose: purpose,
    });
    
    // 2. Generar nuevo código
    const code = generateRandomCode();
    const codeHash = hashCode(code);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    
    // 3. Almacenar en base de datos
    const { error } = await supabase
      .from("email_otps")
      .insert({
        email: normalizedEmail,
        user_id: userId || null,
        code_hash: codeHash,
        purpose,
        expires_at: expiresAt.toISOString(),
      });
    
    if (error) {
      console.error("[otpService] Error storing OTP:", error);
      return { success: false, error: "Error al generar código" };
    }
    
    return {
      success: true,
      code, // Retornar para envío de email
    };
  } catch (err) {
    console.error("[otpService] generateOtp error:", err);
    return { success: false, error: "Error inesperado" };
  }
}

/**
 * Verifica un código OTP
 * Marca como usado si es válido
 */
export async function verifyOtp(
  email: string,
  code: string,
  purpose: OtpPurpose
): Promise<VerifyOtpResult> {
  const supabase = createSupabaseServiceRole();
  const normalizedEmail = email.toLowerCase().trim();
  const codeHash = hashCode(code);
  
  try {
    // Buscar OTP válido
    const { data: otp, error } = await supabase
      .from("email_otps")
      .select("id, expires_at, used_at")
      .eq("email", normalizedEmail)
      .eq("code_hash", codeHash)
      .eq("purpose", purpose)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    
    if (error || !otp) {
      return { success: false, error: "Código incorrecto" };
    }
    
    // Verificar si ya fue usado
    if (otp.used_at) {
      return { success: false, error: "Este código ya fue utilizado", used: true };
    }
    
    // Verificar si expiró
    if (new Date(otp.expires_at) < new Date()) {
      return { success: false, error: "El código ha expirado", expired: true };
    }
    
    // Marcar como usado
    const { error: updateError } = await supabase
      .from("email_otps")
      .update({ used_at: new Date().toISOString() })
      .eq("id", otp.id);
    
    if (updateError) {
      console.error("[otpService] Error marking OTP as used:", updateError);
      // Continuar de todos modos, el código era válido
    }
    
    return { success: true };
  } catch (err) {
    console.error("[otpService] verifyOtp error:", err);
    return { success: false, error: "Error al verificar código" };
  }
}

/**
 * Verifica si un email tiene un OTP pendiente válido
 */
export async function hasPendingOtp(
  email: string,
  purpose: OtpPurpose
): Promise<boolean> {
  const supabase = createSupabaseServiceRole();
  const normalizedEmail = email.toLowerCase().trim();
  
  const { data } = await supabase
    .from("email_otps")
    .select("id")
    .eq("email", normalizedEmail)
    .eq("purpose", purpose)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .single();
  
  return !!data;
}
