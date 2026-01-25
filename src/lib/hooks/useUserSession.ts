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

  const fetchProfileAndRole = useCallback(async (userId: string) => {
    const supabase = createSupabaseBrowser();
    
    // Obtener perfil y rol en paralelo
    const [profileResult, roleResult] = await Promise.all([
      supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single(),
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single(),
    ]);
    
    if (profileResult.data) {
      setProfile(profileResult.data as UserProfile);
    }
    
    if (roleResult.data?.role) {
      setRole(roleResult.data.role as UserRole);
    } else {
      setRole("volunteer");
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const supabase = createSupabaseBrowser();
    
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    setSession(currentSession);
    setUser(currentSession?.user ?? null);
    
    if (currentSession?.user) {
      await fetchProfileAndRole(currentSession.user.id);
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
        setSession(newSession);
        setUser(newSession?.user ?? null);
        
        if (newSession?.user) {
          await fetchProfileAndRole(newSession.user.id);
        } else {
          setProfile(null);
          setRole("volunteer");
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
