// src/lib/hooks/useUserSession.ts
// Hook para manejar sesión de usuario en componentes client
// OPTIMIZADO: Carga paralela de perfil y rol para mayor velocidad

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

// Timeout máximo para evitar loading infinito (5 segundos)
const SESSION_TIMEOUT = 5000;

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

  const fetchProfileAndRole = useCallback(async (userId: string) => {
    const supabase = createSupabaseBrowser();
    
    try {
      // OPTIMIZACIÓN: Ejecutar perfil y rol EN PARALELO
      const profilePromise = supabase
        .from("user_profiles")
        .select("id, rut, first_name, last_name, birthdate, phone, verified, created_at, updated_at")
        .eq("id", userId)
        .single()
        .then(({ data }) => data as UserProfile | null);
      
      // Obtener rol: usar cache si está disponible y válido
      let rolePromise: Promise<UserRole>;
      
      if (roleCache && Date.now() - roleCache.timestamp < ROLE_CACHE_TTL) {
        rolePromise = Promise.resolve(roleCache.role);
      } else {
        rolePromise = fetch("/api/auth/check-role", {
          cache: "no-store",
          credentials: "include",
        })
          .then(res => res.ok ? res.json() : { role: "volunteer" })
          .then(data => {
            const userRole = (data.role as UserRole) || "volunteer";
            roleCache = { role: userRole, timestamp: Date.now() };
            return userRole;
          })
          .catch(() => "volunteer" as UserRole);
      }
      
      // Esperar ambos en paralelo
      const [profileData, userRole] = await Promise.all([profilePromise, rolePromise]);
      
      if (profileData) {
        setProfile(profileData);
      }
      setRole(userRole);
    } catch (err) {
      console.error("[useUserSession] fetchProfileAndRole error:", err);
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
      
      // OPTIMIZACIÓN: Obtener session directamente (más rápido que getUser)
      // El middleware ya validó la sesión, aquí solo necesitamos los datos
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession?.user) {
        // No hay sesión válida - limpiar todo
        clearState();
      } else {
        // Sesión válida - actualizar estado
        setSession(currentSession);
        setUser(currentSession.user);
        await fetchProfileAndRole(currentSession.user.id);
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
          await fetchProfileAndRole(newSession.user.id);
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
