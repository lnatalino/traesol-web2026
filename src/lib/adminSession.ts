import { cookies } from "next/headers";
import { getEffectiveRole, isSuperAdmin, ADMIN_ROLES, type AdminRole } from "./adminAuth";
import { getUnifiedSession } from "./unifiedAuth";

export type AdminSession = {
  role: string;
  email: string;
  allowed: boolean;
  isSuperAdmin: boolean;
  effectiveRole: AdminRole | string;
  // Nuevos campos para sesión unificada
  userId: string | null;
  verified: boolean;
  authSource: "supabase" | "legacy_cookie";
};

const ALLOWED_ROLES = new Set(["superadmin", "admin", "editor"]);

export async function getAdminSession(): Promise<AdminSession> {
  // 1. Primero intentar con Supabase Auth (sesión unificada)
  try {
    const unifiedSession = await getUnifiedSession();
    
    if (unifiedSession.authenticated && unifiedSession.email) {
      const effectiveRole = getEffectiveRole(unifiedSession.role, unifiedSession.email);
      const superAdmin = isSuperAdmin(unifiedSession.role, unifiedSession.email);
      
      // REGLA DE NEGOCIO: Admin/Superadmin NO requiere verified
      // Solo voluntarios necesitan verificar email
      const isAdminRole = ALLOWED_ROLES.has(effectiveRole) || superAdmin;
      const allowed = isAdminRole; // Admin siempre tiene acceso si está autenticado
      
      return {
        role: unifiedSession.role,
        email: unifiedSession.email,
        allowed,
        isSuperAdmin: superAdmin,
        effectiveRole,
        userId: unifiedSession.userId,
        verified: unifiedSession.verified,
        authSource: "supabase",
      };
    }
  } catch (err) {
    console.error("[adminSession] Error getting unified session:", err);
  }

  // 2. Fallback: Cookies legacy (para compatibilidad con admin_users existente)
  const store = await cookies();
  const role = store.get("traesol-role")?.value ?? "";
  const email = store.get("traesol-email")?.value ?? "";
  
  // Calcular rol efectivo (puede ser sobreescrito por SUPERADMIN_EMAILS)
  const effectiveRole = getEffectiveRole(role, email);
  const superAdmin = isSuperAdmin(role, email);
  
  // Permitir acceso si el rol efectivo está en la lista de roles permitidos
  const allowed = ALLOWED_ROLES.has(effectiveRole) || superAdmin;
  
  return { 
    role, 
    email, 
    allowed,
    isSuperAdmin: superAdmin,
    effectiveRole,
    userId: null,
    verified: true, // Legacy siempre se considera verificado
    authSource: "legacy_cookie",
  };
}

export function isAdminRole(role: string | null | undefined): boolean {
  return ALLOWED_ROLES.has(String(role ?? ""));
}
