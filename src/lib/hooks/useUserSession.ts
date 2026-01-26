// src/lib/hooks/useUserSession.ts
// Hook para manejar sesión de usuario en componentes client

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

export function useUserSession(): UseUserSessionReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>("volunteer");
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef(false);

  const fetchProfileAndRole = useCallback(async (userId: string, userEmail?: string | null) => {
    const supabase = createSupabaseBrowser();
    
    try {
      // Obtener perfil de la DB
      const { data: profileData } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();
      
      if (profileData) {
        setProfile(profileData as UserProfile);
      }
      
      // Obtener rol efectivo del servidor (considera SUPERADMIN_EMAILS)
      let userRole: UserRole = "volunteer";
      
      try {
        const res = await fetch("/api/auth/check-role", {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.role) {
            userRole = data.role as UserRole;
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
      
      setRole(userRole);
    } catch (err) {
      console.error("[useUserSession] fetchProfileAndRole error:", err);
      // En caso de error, mantener valores por defecto
      setRole("volunteer");
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    
    // Limpiar timeout anterior si existe
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Establecer timeout de seguridad para evitar loading infinito
    timeoutRef.current = setTimeout(() => {
      console.warn("[useUserSession] Timeout alcanzado, finalizando loading");
      setLoading(false);
    }, SESSION_TIMEOUT);
    
    try {
      const supabase = createSupabaseBrowser();
      
      // IMPORTANTE: Usar getUser() que valida el token con el server
      // getSession() solo lee de localStorage y puede estar desincronizado
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();
      
      if (error || !currentUser) {
        // No hay sesión válida
        setSession(null);
        setUser(null);
        setProfile(null);
        setRole("volunteer");
      } else {
        // Obtener session para tener access_token si se necesita
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
        setUser(currentUser);
        await fetchProfileAndRole(currentUser.id, currentUser.email);
      }
    } catch (err) {
      console.error("[useUserSession] refresh error:", err);
      setSession(null);
      setUser(null);
      setProfile(null);
      setRole("volunteer");
    } finally {
      // Limpiar timeout y finalizar loading
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setLoading(false);
    }
  }, [fetchProfileAndRole]);

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
        if (event === "SIGNED_OUT" || !newSession) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setRole("volunteer");
          setLoading(false);
          return;
        }
        
        setSession(newSession);
        setUser(newSession.user);
        
        if (newSession.user) {
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
  }, [refresh, fetchProfileAndRole]);

  return { user, session, profile, role, loading, refresh };
}
