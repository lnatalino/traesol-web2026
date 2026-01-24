import { cookies } from "next/headers";
import { getEffectiveRole, isSuperAdmin, ADMIN_ROLES, type AdminRole } from "./adminAuth";

export type AdminSession = {
  role: string;
  email: string;
  allowed: boolean;
  isSuperAdmin: boolean;
  effectiveRole: AdminRole | string;
};

const ALLOWED_ROLES = new Set(["superadmin", "admin", "editor"]);

export async function getAdminSession(): Promise<AdminSession> {
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
  };
}

export function isAdminRole(role: string | null | undefined): boolean {
  return ALLOWED_ROLES.has(String(role ?? ""));
}
