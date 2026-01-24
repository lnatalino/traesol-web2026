// src/lib/constants/publicContact.ts
// Constantes de contacto público para Traesol

/**
 * Email oficial de contacto público.
 * Usar esta constante en lugar de hardcodear el email.
 */
export const PUBLIC_CONTACT_EMAIL = "contacto@fundaciontraesol.cl";

/**
 * Email específico para operativos quirúrgicos.
 * @deprecated Usar PUBLIC_CONTACT_EMAIL en su lugar. Todas las comunicaciones deben usar contacto@.
 */
export const QUIRURGICO_CONTACT_EMAIL = "contacto@fundaciontraesol.cl";

/**
 * Teléfono de contacto (si aplica).
 */
export const PUBLIC_CONTACT_PHONE = "+56 9 1234 5678"; // TODO: Actualizar con número real

/**
 * Redes sociales oficiales.
 */
export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/traesol/?hl=es-la",
  facebook: "https://www.facebook.com/fundaciontraesol",
  linkedin: "https://www.linkedin.com/company/fundaciontraesol",
} as const;

/**
 * Dirección física (si aplica).
 */
export const PUBLIC_ADDRESS = {
  street: "", // TODO: Agregar dirección si se necesita
  city: "Santiago",
  country: "Chile",
} as const;
