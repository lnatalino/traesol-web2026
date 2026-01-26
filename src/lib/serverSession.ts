// src/lib/serverSession.ts
// Obtener sesión desde el servidor (para SSR en layout y pages)
// Esta es la FUENTE DE VERDAD para el estado inicial de sesión

import { createSupabaseRoute } from "@/lib/supabaseRoute";

export type UserRole = "volunteer" | "admin" | "superadmin";

export interface ServerSession {
  user: {
    id: string;
    email: string;
  } | null;
  role: UserRole;
  profile: {
    firstName: string | null;
    lastName: string | null;
    verified: boolean;
  } | null;
}

// Lista de emails que siempre son superadmin (fallback)
const SUPERADMIN_EMAILS = (process.env.SUPERADMIN_EMAILS || "")
  .split(",")
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * Obtiene la sesión del usuario desde el servidor.
 * Usar en Server Components (layout, pages, etc.)
 * 
 * IMPORTANTE: Esta función lee cookies reales del request,
 * por lo que siempre refleja el estado actual de autenticación.
 */
export async function getServerSession(): Promise<ServerSession> {
  try {
    const supabase = createSupabaseRoute();
    
    // Obtener usuario autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return { user: null, role: "volunteer", profile: null };
    }
    
    // Obtener perfil y rol en paralelo
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
    
    // Determinar rol efectivo
    let role: UserRole = "volunteer";
    
    if (roleResult.data?.role) {
      role = roleResult.data.role as UserRole;
    } else if (SUPERADMIN_EMAILS.includes(user.email?.toLowerCase() || "")) {
      role = "superadmin";
    }
    
    return {
      user: {
        id: user.id,
        email: user.email || "",
      },
      role,
      profile: profileResult.data ? {
        firstName: profileResult.data.first_name,
        lastName: profileResult.data.last_name,
        verified: profileResult.data.verified ?? false,
      } : null,
    };
  } catch (error) {
    console.error("[serverSession] Error getting session:", error);
    return { user: null, role: "volunteer", profile: null };
  }
}
