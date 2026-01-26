// src/lib/approvalTokens.ts
// Sistema de tokens seguros para aprobar/rechazar postulaciones desde email
// Usa HMAC con SHA-256 para firmar tokens con expiración

import crypto from "crypto";

const SECRET = process.env.APPROVAL_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret-change-me";
const TOKEN_EXPIRY_HOURS = 72; // 72 horas de validez

export type ApprovalAction = "accept" | "reject";

export interface ApprovalTokenPayload {
  inscripcionId: string;
  action: ApprovalAction;
  expiresAt: number; // timestamp en ms
}

/**
 * Genera un token firmado para aprobar/rechazar una inscripción
 */
export function generateApprovalToken(inscripcionId: string, action: ApprovalAction): string {
  const expiresAt = Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000;
  
  const payload: ApprovalTokenPayload = {
    inscripcionId,
    action,
    expiresAt,
  };
  
  const payloadStr = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadStr).toString("base64url");
  
  // Generar firma HMAC
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(payloadBase64)
    .digest("base64url");
  
  return `${payloadBase64}.${signature}`;
}

/**
 * Valida y decodifica un token de aprobación
 * Retorna null si es inválido o expirado
 */
export function validateApprovalToken(token: string): ApprovalTokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    
    const [payloadBase64, signature] = parts;
    
    // Verificar firma
    const expectedSignature = crypto
      .createHmac("sha256", SECRET)
      .update(payloadBase64)
      .digest("base64url");
    
    if (signature !== expectedSignature) {
      console.error("[approvalTokens] Invalid signature");
      return null;
    }
    
    // Decodificar payload
    const payloadStr = Buffer.from(payloadBase64, "base64url").toString("utf-8");
    const payload = JSON.parse(payloadStr) as ApprovalTokenPayload;
    
    // Verificar expiración
    if (payload.expiresAt < Date.now()) {
      console.error("[approvalTokens] Token expired");
      return null;
    }
    
    // Validar estructura
    if (!payload.inscripcionId || !["accept", "reject"].includes(payload.action)) {
      console.error("[approvalTokens] Invalid payload structure");
      return null;
    }
    
    return payload;
  } catch (err) {
    console.error("[approvalTokens] Error validating token:", err);
    return null;
  }
}

/**
 * Genera URLs completas para los botones de acción en el email
 */
export function generateApprovalUrls(
  inscripcionId: string,
  baseUrl: string
): { acceptUrl: string; rejectUrl: string } {
  const acceptToken = generateApprovalToken(inscripcionId, "accept");
  const rejectToken = generateApprovalToken(inscripcionId, "reject");
  
  const base = baseUrl.replace(/\/$/, "");
  
  return {
    acceptUrl: `${base}/api/inscripciones/aprobar?token=${encodeURIComponent(acceptToken)}`,
    rejectUrl: `${base}/api/inscripciones/aprobar?token=${encodeURIComponent(rejectToken)}`,
  };
}
