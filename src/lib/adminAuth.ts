// src/lib/adminAuth.ts
// Lógica de autenticación y autorización para administradores

/**
 * Verifica si un email pertenece a la lista de superadmins.
 * 
 * Los superadmins se definen en la variable de entorno SUPERADMIN_EMAILS,
 * que puede contener múltiples emails separados por coma.
 * 
 * Ejemplo: SUPERADMIN_EMAILS="admin@traesol.org,backup@traesol.org"
 * 
 * @param email - Email a verificar
 * @returns true si el email está en la lista de superadmins
 */
export function isSuperAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  
  const superadminEmails = process.env.SUPERADMIN_EMAILS || "";
  if (!superadminEmails.trim()) return false;
  
  const normalizedEmail = email.trim().toLowerCase();
  const allowedEmails = superadminEmails
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  
  return allowedEmails.includes(normalizedEmail);
}

/**
 * Roles disponibles en el sistema admin.
 */
export const ADMIN_ROLES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  EDITOR: "editor",
} as const;

export type AdminRole = (typeof ADMIN_ROLES)[keyof typeof ADMIN_ROLES];

/**
 * Jerarquía de roles: superadmin > admin > editor
 */
const ROLE_HIERARCHY: Record<string, number> = {
  superadmin: 100,
  admin: 50,
  editor: 10,
};

/**
 * Verifica si un rol tiene al menos cierto nivel de acceso.
 * 
 * @param userRole - Rol del usuario
 * @param requiredRole - Rol mínimo requerido
 * @returns true si el usuario tiene el nivel de acceso requerido
 */
export function hasRoleAccess(
  userRole: string | null | undefined,
  requiredRole: AdminRole
): boolean {
  if (!userRole) return false;
  
  const userLevel = ROLE_HIERARCHY[userRole.toLowerCase()] ?? 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole.toLowerCase()] ?? 0;
  
  return userLevel >= requiredLevel;
}

/**
 * Verifica si un usuario es superadmin.
 * Un usuario es superadmin si:
 * 1. Su rol es "superadmin" en la sesión, O
 * 2. Su email está en la lista SUPERADMIN_EMAILS (override)
 * 
 * @param role - Rol del usuario en sesión
 * @param email - Email del usuario
 * @returns true si el usuario es superadmin
 */
export function isSuperAdmin(
  role: string | null | undefined,
  email: string | null | undefined
): boolean {
  // Override por email: si está en la lista, siempre es superadmin
  if (isSuperAdminEmail(email)) return true;
  
  // Por rol en sesión
  return role?.toLowerCase() === ADMIN_ROLES.SUPERADMIN;
}

/**
 * Obtiene el rol efectivo de un usuario.
 * Si el email está en SUPERADMIN_EMAILS, el rol efectivo es "superadmin"
 * independientemente del rol guardado en DB.
 * 
 * @param dbRole - Rol guardado en la base de datos
 * @param email - Email del usuario
 * @returns Rol efectivo del usuario
 */
export function getEffectiveRole(
  dbRole: string | null | undefined,
  email: string | null | undefined
): AdminRole | string {
  // Override por email
  if (isSuperAdminEmail(email)) return ADMIN_ROLES.SUPERADMIN;
  
  // Rol de DB o vacío
  return dbRole || "";
}
