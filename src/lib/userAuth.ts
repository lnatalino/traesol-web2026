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
  created_at: string;
  updated_at: string | null;
}

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  birthdate: string;
  rut?: string;
  phone?: string;
}

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
 * Registrar nuevo usuario con email y contraseña
 */
export async function signUpWithEmailPassword(data: SignUpData): Promise<AuthResult> {
  const supabase = createSupabaseBrowser();
  
  try {
    // 1. Crear usuario en auth.users
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
        },
      },
    });

    if (authError) {
      return {
        success: false,
        error: translateAuthError(authError),
      };
    }

    if (!authData.user) {
      return {
        success: false,
        error: "No se pudo crear el usuario",
      };
    }

    // 2. Crear perfil en user_profiles
    const { error: profileError } = await supabase
      .from("user_profiles")
      .upsert({
        id: authData.user.id,
        first_name: data.firstName,
        last_name: data.lastName,
        birthdate: data.birthdate || null,
        rut: data.rut || null,
        phone: data.phone || null,
      });

    if (profileError) {
      console.error("[userAuth] Error creando perfil:", profileError);
      // El usuario ya se creó, continuamos
    }

    return {
      success: true,
      user: authData.user,
      session: authData.session ?? undefined,
    };
  } catch (err) {
    console.error("[userAuth] signUp error:", err);
    return {
      success: false,
      error: "Error inesperado al registrar",
    };
  }
}

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
 * Cerrar sesión
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  const supabase = createSupabaseBrowser();

  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error("[userAuth] signOut error:", err);
    return { success: false, error: "Error al cerrar sesión" };
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

