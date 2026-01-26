// src/lib/publicUrl.ts
// Helper central para generar URLs públicas correctas según entorno
// Funciona tanto en SSR como en cliente

/**
 * Detecta si estamos en un entorno de producción (Vercel)
 */
function isProduction(): boolean {
  return process.env.VERCEL_ENV === "production" || 
         process.env.NODE_ENV === "production" ||
         !!process.env.VERCEL;
}

/**
 * Obtiene la URL base pública del sitio.
 * 
 * En PRODUCCIÓN:
 * - Usa NEXT_PUBLIC_SITE_URL si existe
 * - Fallback a https://fundaciontraesol.cl (NUNCA localhost)
 * 
 * En DESARROLLO (local):
 * - Usa NEXT_PUBLIC_SITE_URL si existe
 * - Fallback a http://localhost:3000
 * 
 * @returns URL base sin trailing slash (ej: "https://fundaciontraesol.cl")
 */
export function getPublicBaseUrl(): string {
  // 1. Variable explícita (siempre preferida)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  }

  // 2. En producción: SIEMPRE usar dominio real, NUNCA localhost
  if (isProduction()) {
    // Intentar VERCEL_PROJECT_PRODUCTION_URL primero
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
      return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    }
    // Fallback seguro para producción
    return "https://fundaciontraesol.cl";
  }

  // 3. Solo en desarrollo local: usar localhost
  return "http://localhost:3000";
}

/**
 * Genera una URL pública completa a partir de un path.
 * 
 * @param path - Path relativo (debe empezar con /)
 * @returns URL completa (ej: "https://fundaciontraesol.cl/paciente/portal?token=...")
 */
export function getPublicUrl(path: string): string {
  const baseUrl = getPublicBaseUrl();
  // Asegurar que el path empiece con /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

/**
 * Genera la URL del portal de paciente con token.
 * 
 * @param token - Token de acceso al portal
 * @returns URL completa al portal del paciente
 */
export function getPortalPacienteUrl(token: string): string {
  return getPublicUrl(`/paciente/portal?token=${encodeURIComponent(token)}`);
}
