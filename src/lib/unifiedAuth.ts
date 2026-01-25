// src/lib/unifiedAuth.ts
// Sistema de autenticación unificado para Mi Cuenta y Admin
// Usa Supabase Auth como fuente única de verdad

import { createSupabaseRoute, createSupabaseServiceRole } from "@/lib/supabaseRoute";

// =========================================================================
// TIPOS
// =========================================================================

export type UserRole = "volunteer" | "admin" | "superadmin";

export interface UnifiedSession {
  authenticated: boolean;
  userId: string | null;
  email: string | null;
  role: UserRole;
  verified: boolean;
  profile: {
    firstName: string | null;
    lastName: string | null;
  } | null;
}

export interface AdminGateResult {
  allowed: boolean;
  reason?: "no_session" | "not_verified" | "not_admin";
  session: UnifiedSession;
  redirectTo?: string;
}

// Lista de emails que siempre son superadmin (fallback)
const SUPERADMIN_EMAILS = (process.env.SUPERADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase()).filter(Boolean);

// =========================================================================
// FUNCIONES PRINCIPALES
// =========================================================================

/**
 * Obtiene la sesión unificada del usuario actual
 * Funciona tanto en Server Components como en Route Handlers
 */
export async function getUnifiedSession(): Promise<UnifiedSession> {
  const supabase = createSupabaseRoute();
  
  // Obtener sesión de Supabase Auth
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return {
      authenticated: false,
      userId: null,
      email: null,
      role: "volunteer",
      verified: false,
      profile: null,
    };
  }
  
  // Obtener perfil y rol
  const [profileResult, roleResult] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("first_name, last_name, verified")
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single(),
  ]);
  
  // Determinar rol (prioridad: user_roles > SUPERADMIN_EMAILS > volunteer)
  let role: UserRole = "volunteer";
  
  if (roleResult.data?.role) {
    role = roleResult.data.role as UserRole;
  } else if (SUPERADMIN_EMAILS.includes(user.email?.toLowerCase() || "")) {
    role = "superadmin";
  }
  
  const verified = profileResult.data?.verified ?? false;
  
  return {
    authenticated: true,
    userId: user.id,
    email: user.email || null,
    role,
    verified,
    profile: profileResult.data ? {
      firstName: profileResult.data.first_name,
      lastName: profileResult.data.last_name,
    } : null,
  };
}

/**
 * Verifica acceso al panel de administración
 * Retorna si está permitido y razón si no
 */
export async function checkAdminAccess(): Promise<AdminGateResult> {
  const session = await getUnifiedSession();
  
  // No hay sesión
  if (!session.authenticated) {
    return {
      allowed: false,
      reason: "no_session",
      session,
      redirectTo: "/mi-cuenta/login?next=/admin",
    };
  }
  
  // No verificado
  if (!session.verified) {
    return {
      allowed: false,
      reason: "not_verified",
      session,
      redirectTo: `/mi-cuenta/verificar?email=${encodeURIComponent(session.email || "")}`,
    };
  }
  
  // No es admin
  if (session.role !== "admin" && session.role !== "superadmin") {
    return {
      allowed: false,
      reason: "not_admin",
      session,
    };
  }
  
  return {
    allowed: true,
    session,
  };
}

/**
 * Verifica acceso a rutas protegidas de usuario (Mi Cuenta)
 */
export async function checkUserAccess(): Promise<{
  allowed: boolean;
  needsVerification: boolean;
  session: UnifiedSession;
  redirectTo?: string;
}> {
  const session = await getUnifiedSession();
  
  if (!session.authenticated) {
    return {
      allowed: false,
      needsVerification: false,
      session,
      redirectTo: "/mi-cuenta/login",
    };
  }
  
  if (!session.verified) {
    return {
      allowed: false,
      needsVerification: true,
      session,
      redirectTo: `/mi-cuenta/verificar?email=${encodeURIComponent(session.email || "")}`,
    };
  }
  
  return {
    allowed: true,
    needsVerification: false,
    session,
  };
}

// =========================================================================
// HELPERS PARA ROLES
// =========================================================================

/**
 * Asigna un rol a un usuario (solo via service role)
 */
export async function setUserRole(userId: string, role: UserRole): Promise<{ success: boolean; error?: string }> {
  const supabase = createSupabaseServiceRole();
  
  const { error } = await supabase
    .from("user_roles")
    .upsert({
      user_id: userId,
      role,
    }, {
      onConflict: "user_id",
    });
  
  if (error) {
    console.error("[unifiedAuth] Error setting role:", error);
    return { success: false, error: error.message };
  }
  
  return { success: true };
}

/**
 * Obtiene el rol de un usuario específico
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  const supabase = createSupabaseRoute();
  
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .single();
  
  return (data?.role as UserRole) || "volunteer";
}
