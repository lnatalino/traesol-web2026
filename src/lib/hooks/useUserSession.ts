// src/lib/hooks/useUserSession.ts
// Hook para manejar sesión de usuario en componentes client

"use client";

import { useEffect, useState, useCallback } from "react";
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

export function useUserSession(): UseUserSessionReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>("volunteer");
  const [loading, setLoading] = useState(true);

  const fetchProfileAndRole = useCallback(async (userId: string, userEmail?: string | null) => {
    const supabase = createSupabaseBrowser();
    
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
      const res = await fetch("/api/auth/check-role");
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
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const supabase = createSupabaseBrowser();
    
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    setSession(currentSession);
    setUser(currentSession?.user ?? null);
    
    if (currentSession?.user) {
      await fetchProfileAndRole(currentSession.user.id, currentSession.user.email);
    } else {
      setProfile(null);
      setRole("volunteer");
    }
    
    setLoading(false);
  }, [fetchProfileAndRole]);

  useEffect(() => {
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
    };
  }, [refresh, fetchProfileAndRole]);

  return { user, session, profile, role, loading, refresh };
}
