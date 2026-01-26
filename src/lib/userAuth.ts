// src/lib/userAuth.ts
// Helpers para autenticación de usuarios con Supabase Auth
// NO modifica flujos existentes de admin, voluntarios por RUT, etc.

import { createSupabaseBrowser } from "@/lib/supabase";
import type { User, Session, AuthError } from "@supabase/supabase-js";

// =========================================================================
// TIPOS
// =========================================================================

export interface UserProfile {
  id: string;
  rut: string | null;
  first_name: string;
  last_name: string;
  birthdate: string | null;
  phone: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string | null;
}

// SignUpData se usa solo en /api/auth/register (server-side)
// NO usar signUp del cliente para evitar emails automáticos de Supabase

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
  session?: Session;
}

// =========================================================================
// FUNCIONES DE AUTENTICACIÓN
// =========================================================================

/**
 * IMPORTANTE: El registro de usuarios se hace SOLO via /api/auth/register
 * Esto evita que Supabase envíe el email de "Confirm your signup"
 * NO usar supabase.auth.signUp() del cliente para registro.
 */

/**
 * Iniciar sesión con email y contraseña
 */
export async function signInWithEmailPassword(
  email: string,
  password: string
): Promise<AuthResult> {
  const supabase = createSupabaseBrowser();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        success: false,
        error: translateAuthError(error),
      };
    }

    return {
      success: true,
      user: data.user,
      session: data.session,
    };
  } catch (err) {
    console.error("[userAuth] signIn error:", err);
    return {
      success: false,
      error: "Error inesperado al iniciar sesión",
    };
  }
}

/**
 * Cerrar sesión - limpia tanto Supabase Auth como cookies legacy
 * ROBUSTO: Con timeout para evitar colgarse, máximo 3 segundos
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  const supabase = createSupabaseBrowser();
  const LOGOUT_TIMEOUT = 3000; // 3 segundos máximo

  // Helper para timeout
  const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), ms)
      ),
    ]);
  };

  try {
    // 1. Limpiar storage local PRIMERO (instantáneo)
    if (typeof window !== "undefined") {
      const keysToRemove = Object.keys(localStorage).filter(
        key => key.startsWith("sb-") || key.includes("supabase")
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }

    // 2. Limpiar cookies del servidor (con timeout)
    try {
      await withTimeout(
        fetch("/api/auth/simple-logout", { 
          method: "POST",
          headers: { "Accept": "application/json" },
          credentials: "include",
        }),
        LOGOUT_TIMEOUT
      );
    } catch {
      // Ignorar timeout o errores de red
      console.warn("[userAuth] simple-logout timeout/error, continuando...");
    }
    
    // 3. SignOut de Supabase (con timeout, scope: local para ser más rápido)
    try {
      await withTimeout(
        supabase.auth.signOut({ scope: "local" }),
        LOGOUT_TIMEOUT
      );
    } catch {
      // Ignorar timeout
      console.warn("[userAuth] signOut timeout, continuando...");
    }
    
    return { success: true };
  } catch (err) {
    console.error("[userAuth] signOut error:", err);
    return { success: true }; // Retornar success para permitir navegación
  }
}

/**
 * Obtener sesión actual
 */
export async function getSession(): Promise<Session | null> {
  const supabase = createSupabaseBrowser();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/**
 * Obtener usuario actual
 */
export async function getUser(): Promise<User | null> {
  const supabase = createSupabaseBrowser();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/**
 * Obtener perfil del usuario actual
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = createSupabaseBrowser();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !data) {
    // Si no hay perfil, crear uno vacío
    if (error?.code === "PGRST116") {
      const { data: newProfile } = await supabase
        .from("user_profiles")
        .upsert({
          id: user.id,
          first_name: user.user_metadata?.first_name || "",
          last_name: user.user_metadata?.last_name || "",
        })
        .select()
        .single();
      return newProfile as UserProfile | null;
    }
    return null;
  }

  return data as UserProfile;
}

/**
 * Actualizar perfil del usuario actual
 */
export async function updateUserProfile(
  updates: Partial<Pick<UserProfile, "first_name" | "last_name" | "phone" | "birthdate" | "rut">>
): Promise<{ success: boolean; error?: string; profile?: UserProfile }> {
  const supabase = createSupabaseBrowser();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "No hay sesión activa" };
  }

  // Si se intenta actualizar RUT, verificar que no exista ya
  if (updates.rut !== undefined) {
    const { data: existing } = await supabase
      .from("user_profiles")
      .select("rut")
      .eq("id", user.id)
      .single();

    // Si ya tiene RUT guardado, no permitir cambio
    if (existing?.rut && existing.rut !== updates.rut) {
      return { success: false, error: "El RUT no puede ser modificado una vez guardado" };
    }
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    console.error("[userAuth] updateProfile error:", error);
    return { success: false, error: "Error al actualizar perfil" };
  }

  return { success: true, profile: data as UserProfile };
}

/**
 * Solicitar recuperación de contraseña
 */
export async function requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createSupabaseBrowser();

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/mi-cuenta/restablecer-contrasena`,
    });

    if (error) {
      return { success: false, error: translateAuthError(error) };
    }

    return { success: true };
  } catch (err) {
    console.error("[userAuth] requestPasswordReset error:", err);
    return { success: false, error: "Error al solicitar recuperación" };
  }
}

/**
 * Actualizar contraseña (después de reset)
 */
export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createSupabaseBrowser();

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: translateAuthError(error) };
    }

    return { success: true };
  } catch (err) {
    console.error("[userAuth] updatePassword error:", err);
    return { success: false, error: "Error al actualizar contraseña" };
  }
}

// =========================================================================
// HELPERS
// =========================================================================

function translateAuthError(error: AuthError): string {
  const messages: Record<string, string> = {
    "Invalid login credentials": "Email o contraseña incorrectos",
    "Email not confirmed": "Debes confirmar tu email antes de iniciar sesión",
    "User already registered": "Este email ya está registrado",
    "Password should be at least 6 characters": "La contraseña debe tener al menos 6 caracteres",
    "Unable to validate email address: invalid format": "El formato del email no es válido",
    "Email rate limit exceeded": "Demasiados intentos. Intenta más tarde.",
    "For security purposes, you can only request this once every 60 seconds": 
      "Por seguridad, solo puedes solicitar esto cada 60 segundos",
    "Email logins are disabled": "El acceso por email está deshabilitado en la configuración del sistema",
    "Signups not allowed for this instance": "Los registros están deshabilitados temporalmente",
  };

  return messages[error.message] || error.message;
}

// =========================================================================
// VALIDACIONES
// =========================================================================

/**
 * Validar que la fecha de nacimiento corresponda a >= 18 años
 */
export function isAdult(birthdate: string): boolean {
  const birth = new Date(birthdate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 18;
}

/**
 * Formatear RUT (ej: 12345678-9 → 12.345.678-9)
 */
export function formatRut(raw: string): string {
  const clean = raw.replace(/[^0-9Kk]/g, "").toUpperCase();
  if (!clean) return "";
  const dv = clean.slice(-1);
  let num = clean.slice(0, -1);
  let out = "";
  while (num.length > 3) {
    out = "." + num.slice(-3) + out;
    num = num.slice(0, -3);
  }
  out = num + out;
  return `${out}-${dv}`;
}

/**
 * Normalizar RUT (quitar puntos y guión)
 */
export function normalizeRut(raw: string): string {
  return raw.replace(/\./g, "").replace(/-/g, "").replace(/\s+/g, "").toUpperCase();
}

/**
 * Validar formato básico de RUT chileno
 */
export function isValidRutFormat(rut: string): boolean {
  const clean = normalizeRut(rut);
  // 7-9 dígitos + dígito verificador (0-9 o K)
  return /^[0-9]{7,9}[0-9Kk]$/.test(clean);
}

// =========================================================================
// VALIDACIÓN DE PERFIL PARA POSTULACIÓN
// =========================================================================

export interface VolunteerProfileStatus {
  isComplete: boolean;
  missingFields: string[];
}

/**
 * Verifica si el perfil del usuario tiene los campos mínimos requeridos
 * para postular a un operativo usando su cuenta.
 */
export function isVolunteerProfileComplete(profile: UserProfile | null): VolunteerProfileStatus {
  if (!profile) {
    return {
      isComplete: false,
      missingFields: ["Perfil no encontrado"],
    };
  }

  const missing: string[] = [];

  // Campos requeridos para postular
  if (!profile.first_name?.trim()) {
    missing.push("Nombre");
  }
  if (!profile.last_name?.trim()) {
    missing.push("Apellido");
  }
  if (!profile.rut?.trim()) {
    missing.push("RUT");
  }

  return {
    isComplete: missing.length === 0,
    missingFields: missing,
  };
}

