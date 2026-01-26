// src/lib/hooks/useUserSession.ts
// Hook para manejar sesión de usuario en componentes client
// SINCRONIZADO con middleware SSR - usa getUser() para validar con servidor

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

// Timeout máximo para evitar loading infinito (8 segundos)
const SESSION_TIMEOUT = 8000;

// Cache para evitar fetch repetitivo de rol
let roleCache: { role: UserRole; timestamp: number } | null = null;
const ROLE_CACHE_TTL = 60000; // 1 minuto

export function useUserSession(): UseUserSessionReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>("volunteer");
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef(false);
  const fetchingRef = useRef(false);

  const clearState = useCallback(() => {
    setSession(null);
    setUser(null);
    setProfile(null);
    setRole("volunteer");
    roleCache = null;
  }, []);

  const fetchProfileAndRole = useCallback(async (userId: string, userEmail?: string | null) => {
    const supabase = createSupabaseBrowser();
    
    try {
      // Obtener perfil de la DB (sin bloquear)
      const profilePromise = supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single()
        .then(({ data }) => data as UserProfile | null);
      
      // Obtener rol del servidor (considera SUPERADMIN_EMAILS)
      // Usar cache si está disponible y válido
      let userRole: UserRole = "volunteer";
      
      if (roleCache && Date.now() - roleCache.timestamp < ROLE_CACHE_TTL) {
        userRole = roleCache.role;
      } else {
        try {
          const res = await fetch("/api/auth/check-role", {
            cache: "no-store",
            credentials: "include", // Importante para enviar cookies
          });
          if (res.ok) {
            const data = await res.json();
            if (data.role) {
              userRole = data.role as UserRole;
              roleCache = { role: userRole, timestamp: Date.now() };
            }
          }
        } catch {
          // Fallback: obtener rol de la tabla user_roles
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .single();
          
          if (roleData?.role) {
            userRole = roleData.role as UserRole;
          }
        }
      }
      
      // Esperar perfil
      const profileData = await profilePromise;
      if (profileData) {
        setProfile(profileData);
      }
      
      setRole(userRole);
    } catch (err) {
      console.error("[useUserSession] fetchProfileAndRole error:", err);
      // En caso de error, mantener valores por defecto
      setRole("volunteer");
    }
  }, []);

  const refresh = useCallback(async () => {
    // Evitar múltiples refreshes simultáneos
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    
    setLoading(true);
    
    // Limpiar timeout anterior si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Establecer timeout de seguridad para evitar loading infinito
    timeoutRef.current = setTimeout(() => {
      console.warn("[useUserSession] Timeout alcanzado, finalizando loading");
      setLoading(false);
      fetchingRef.current = false;
    }, SESSION_TIMEOUT);
    
    try {
      const supabase = createSupabaseBrowser();
      
      // CRÍTICO: Usar getUser() que valida el token con el servidor
      // getSession() solo lee de localStorage y puede estar desincronizado
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();
      
      if (error || !currentUser) {
        // No hay sesión válida - limpiar todo
        clearState();
      } else {
        // Sesión válida - actualizar estado
        // Obtener session para tener access_token si se necesita
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentUser);
        await fetchProfileAndRole(currentUser.id, currentUser.email);
      }
    } catch (err) {
      console.error("[useUserSession] refresh error:", err);
      clearState();
    } finally {
      // Limpiar timeout y finalizar loading
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [fetchProfileAndRole, clearState]);

  useEffect(() => {
    // Evitar doble inicialización en StrictMode
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    const supabase = createSupabaseBrowser();

    // Obtener sesión inicial
    refresh();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("[useUserSession] Auth event:", event);
        
        // CRÍTICO: En SIGNED_OUT, limpiar TODO inmediatamente
        if (event === "SIGNED_OUT") {
          clearState();
          roleCache = null;
          setLoading(false);
          return;
        }
        
        // Si no hay sesión, limpiar
        if (!newSession) {
          clearState();
          setLoading(false);
          return;
        }
        
        // TOKEN_REFRESHED o SIGNED_IN: actualizar estado
        setSession(newSession);
        setUser(newSession.user);
        
        if (newSession.user) {
          // Invalidar cache de rol en login fresco
          if (event === "SIGNED_IN") {
            roleCache = null;
          }
          await fetchProfileAndRole(newSession.user.id, newSession.user.email);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [refresh, fetchProfileAndRole, clearState]);

  return { user, session, profile, role, loading, refresh };
}
