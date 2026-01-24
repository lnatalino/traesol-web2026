// src/lib/publicUrl.ts
// Helper central para generar URLs públicas correctas según entorno
// Funciona tanto en SSR como en cliente

/**
 * Obtiene la URL base pública del sitio.
 * Orden de prioridad:
 * 1. NEXT_PUBLIC_SITE_URL (configurada manualmente en Vercel/env)
 * 2. VERCEL_PROJECT_PRODUCTION_URL (auto-set por Vercel en producción)
 * 3. VERCEL_URL (auto-set por Vercel en preview deployments)
 * 4. localhost:3000 como fallback para desarrollo local
 * 
 * @returns URL base sin trailing slash (ej: "https://fundaciontraesol.cl")
 */
export function getPublicBaseUrl(): string {
  // 1. Variable explícita (preferida en producción)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  }

  // 2. Vercel: URL de producción del proyecto
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  // 3. Vercel: URL del deployment actual (incluye previews)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 4. Fallback: desarrollo local
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
