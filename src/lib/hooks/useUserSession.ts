// src/lib/hooks/useUserSession.ts
// Hook para manejar sesión de usuario en componentes client

"use client";

import { useEffect, useState, useCallback } from "react";
import { createSupabaseBrowser } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import type { UserProfile } from "@/lib/userAuth";

interface UseUserSessionReturn {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useUserSession(): UseUserSessionReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = createSupabaseBrowser();
    const { data } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    if (data) {
      setProfile(data as UserProfile);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const supabase = createSupabaseBrowser();
    
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    setSession(currentSession);
    setUser(currentSession?.user ?? null);
    
    if (currentSession?.user) {
      await fetchProfile(currentSession.user.id);
    } else {
      setProfile(null);
    }
    
    setLoading(false);
  }, [fetchProfile]);

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
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [refresh, fetchProfile]);

  return { user, session, profile, loading, refresh };
}
