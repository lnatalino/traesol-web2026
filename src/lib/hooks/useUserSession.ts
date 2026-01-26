// src/lib/hooks/useUserSession.ts
// Hook para manejar sesión de usuario en componentes client
// CORREGIDO: Usa getUser() para validación real del servidor

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createSupabaseBrowser } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/userAuth";

export type UserRole = "volunteer" | "admin" | "superadmin";

interface UseUserSessionReturn {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: UserRole;
  loading: boolean;
  refresh: () => Promise<void>;
}

// Timeout máximo para evitar loading infinito
const SESSION_TIMEOUT = 4000;

// Cache de rol POR userId (no global, para soportar múltiples usuarios)
const roleCacheMap = new Map<string, { role: UserRole; timestamp: number }>();
const ROLE_CACHE_TTL = 60000; // 1 minuto

// Cliente Supabase singleton para consistencia
let supabaseInstance: ReturnType<typeof createSupabaseBrowser> | null = null;
function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseBrowser();
  }
  return supabaseInstance;
}

export function useUserSession(): UseUserSessionReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>("volunteer");
  const [loading, setLoading] = useState(true);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);

  // Limpiar estado de forma segura
  const clearState = useCallback(() => {
    if (mountedRef.current) {
      setSession(null);
      setUser(null);
      setProfile(null);
      setRole("volunteer");
    }
  }, []);

  // Fetch de perfil y rol en paralelo
  const fetchProfileAndRole = useCallback(async (userId: string) => {
    const supabase = getSupabase();
    
    try {
      // PARALELO: Profile + Role
      const profilePromise = supabase
        .from("user_profiles")
        .select("id, rut, first_name, last_name, birthdate, phone, verified, created_at, updated_at")
        .eq("id", userId)
        .single()
        .then(({ data }) => data as UserProfile | null);
      
      // Obtener rol: usar cache si está disponible y válido
      let rolePromise: Promise<UserRole>;
      const cached = roleCacheMap.get(userId);
      
      if (cached && Date.now() - cached.timestamp < ROLE_CACHE_TTL) {
        rolePromise = Promise.resolve(cached.role);
      } else {
        rolePromise = fetch("/api/auth/check-role", {
          cache: "no-store",
          credentials: "include",
        })
          .then(res => res.ok ? res.json() : { role: "volunteer" })
          .then(data => {
            const userRole = (data.role as UserRole) || "volunteer";
            roleCacheMap.set(userId, { role: userRole, timestamp: Date.now() });
            return userRole;
          })
          .catch(() => "volunteer" as UserRole);
      }
      
      const [profileData, userRole] = await Promise.all([profilePromise, rolePromise]);
      
      if (mountedRef.current) {
        if (profileData) setProfile(profileData);
        setRole(userRole);
      }
    } catch (err) {
      console.error("[useUserSession] fetchProfileAndRole error:", err);
      if (mountedRef.current) setRole("volunteer");
    }
  }, []);

  // Refresh: SIEMPRE usa getUser() para validar con el servidor
  const refresh = useCallback(async () => {
    // Evitar múltiples refreshes simultáneos
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    
    if (mountedRef.current) setLoading(true);
    
    // Timeout de seguridad
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      console.warn("[useUserSession] Timeout alcanzado");
      if (mountedRef.current) setLoading(false);
      fetchingRef.current = false;
    }, SESSION_TIMEOUT);
    
    try {
      const supabase = getSupabase();
      
      // CRÍTICO: Usar getUser() que VALIDA contra el servidor Supabase
      // getSession() solo lee del localStorage y puede estar desactualizado
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !authUser) {
        // No hay sesión válida en el servidor
        clearState();
      } else {
        // Usuario válido - también obtener la sesión para tokens
        const { data: { session: authSession } } = await supabase.auth.getSession();
        
        if (mountedRef.current) {
          setUser(authUser);
          setSession(authSession);
          await fetchProfileAndRole(authUser.id);
        }
      }
    } catch (err) {
      console.error("[useUserSession] refresh error:", err);
      clearState();
    } finally {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (mountedRef.current) setLoading(false);
      fetchingRef.current = false;
    }
  }, [fetchProfileAndRole, clearState]);

  useEffect(() => {
    // Marcar como montado
    mountedRef.current = true;
    
    const supabase = getSupabase();

    // Obtener sesión inicial
    refresh();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("[useUserSession] Auth event:", event);
        
        // SIGNED_OUT: limpiar TODO inmediatamente
        if (event === "SIGNED_OUT") {
          clearState();
          roleCacheMap.clear();
          if (mountedRef.current) setLoading(false);
          return;
        }
        
        // Si no hay sesión en el evento, limpiar
        if (!newSession?.user) {
          clearState();
          if (mountedRef.current) setLoading(false);
          return;
        }
        
        // SIGNED_IN, TOKEN_REFRESHED, etc: actualizar estado
        if (mountedRef.current) {
          setSession(newSession);
          setUser(newSession.user);
          
          // Invalidar cache de rol en login fresco
          if (event === "SIGNED_IN") {
            roleCacheMap.delete(newSession.user.id);
          }
          
          await fetchProfileAndRole(newSession.user.id);
          setLoading(false);
        }
      }
    );

    // Cleanup al desmontar
    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [refresh, fetchProfileAndRole, clearState]);

  return { user, session, profile, role, loading, refresh };
}
