// src/lib/quirurgico/portalSession.ts
// Manejo de sesión del portal del paciente usando cookies httpOnly + token fallback

import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { PortalSessionData } from "./types";
import { verifyPortalToken } from "./portalTokens";

const JWT_SECRET = new TextEncoder().encode(
  process.env.PORTAL_SESSION_SECRET || process.env.NEXTAUTH_SECRET || "portal-session-secret-change-in-prod"
);

const COOKIE_NAME = "traesol-patient-portal";
const SESSION_DURATION_HOURS = 4; // Sesión corta para seguridad

interface PortalJWTPayload extends JWTPayload {
  paciente_id: string;
}

/**
 * Crea una sesión de portal y setea la cookie httpOnly
 */
export async function createPortalSession(pacienteId: string): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS);

  const token = await new SignJWT({ paciente_id: pacienteId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

/**
 * Verifica la sesión del portal desde la cookie
 * Retorna el paciente_id si es válida, null si no
 */
export async function verifyPortalSession(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const data = payload as PortalJWTPayload;

    if (!data.paciente_id) {
      return null;
    }

    return data.paciente_id;
  } catch (error) {
    // Token inválido o expirado
    return null;
  }
}

/**
 * Verifica la sesión del portal usando múltiples métodos:
 * 1. Cookie httpOnly (preferido)
 * 2. Header X-Portal-Token (fallback para cuando cookies no funcionan)
 * Retorna el paciente_id si es válida, null si no
 */
export async function verifyPortalSessionOrToken(): Promise<string | null> {
  // Intento 1: Cookie httpOnly (más seguro)
  const fromCookie = await verifyPortalSession();
  if (fromCookie) {
    return fromCookie;
  }

  // Intento 2: Header X-Portal-Token (fallback)
  try {
    const headerStore = await headers();
    const portalToken = headerStore.get("x-portal-token");
    
    if (portalToken) {
      const result = await verifyPortalToken(portalToken);
      if (result.valid && result.pacienteId) {
        return result.pacienteId;
      }
    }
  } catch (error) {
    console.error("[portalSession] Error verificando token de header:", error);
  }

  return null;
}

/**
 * Obtiene los datos de sesión completos
 */
export async function getPortalSessionData(): Promise<PortalSessionData | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const data = payload as PortalJWTPayload;

    if (!data.paciente_id || !data.exp) {
      return null;
    }

    return {
      paciente_id: data.paciente_id,
      expires_at: data.exp * 1000, // Convertir a milliseconds
    };
  } catch {
    return null;
  }
}

/**
 * Destruye la sesión del portal (logout)
 */
export async function destroyPortalSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Renueva la sesión si está cerca de expirar (dentro de 1 hora)
 */
export async function refreshPortalSessionIfNeeded(): Promise<boolean> {
  try {
    const session = await getPortalSessionData();
    if (!session) return false;

    const oneHourFromNow = Date.now() + 60 * 60 * 1000;
    if (session.expires_at > oneHourFromNow) {
      // Aún tiene tiempo, no renovar
      return false;
    }

    // Renovar sesión
    await createPortalSession(session.paciente_id);
    return true;
  } catch {
    return false;
  }
}
