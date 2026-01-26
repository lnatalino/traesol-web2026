// src/components/providers/SessionProvider.tsx
// Proveedor de sesión que recibe datos iniciales del servidor
// y los sincroniza con el cliente

"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { createSupabaseBrowser } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import type { ServerSession, UserRole } from "@/lib/serverSession";

interface SessionContextValue {
  user: User | null;
  session: Session | null;
  role: UserRole;
  profile: {
    firstName: string | null;
    lastName: string | null;
    verified: boolean;
  } | null;
  loading: boolean;
  isAdmin: boolean;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionProviderProps {
  children: ReactNode;
  initialSession: ServerSession;
}

// Cache de rol por userId
const roleCacheMap = new Map<string, { role: UserRole; timestamp: number }>();
const ROLE_CACHE_TTL = 60000; // 1 minuto

// Singleton de Supabase client
let supabaseInstance: ReturnType<typeof createSupabaseBrowser> | null = null;
function getSupabase() {
  if (!supabaseInstance) {
    supabaseInstance = createSupabaseBrowser();
  }
  return supabaseInstance;
}

export function SessionProvider({ children, initialSession }: SessionProviderProps) {
  // Inicializar con datos del servidor (sin loading flash)
  const [user, setUser] = useState<User | null>(
    initialSession.user ? { id: initialSession.user.id, email: initialSession.user.email } as User : null
  );
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(initialSession.role);
  const [profile, setProfile] = useState(initialSession.profile);
  const [loading, setLoading] = useState(false); // NO loading inicial - ya tenemos datos del servidor
  
  const mountedRef = useRef(true);
  const fetchingRef = useRef(false);

  const isAdmin = role === "admin" || role === "superadmin";

  const clearState = useCallback(() => {
    if (mountedRef.current) {
      setSession(null);
      setUser(null);
      setProfile(null);
      setRole("volunteer");
    }
  }, []);

  const fetchRole = useCallback(async (userId: string): Promise<UserRole> => {
    const cached = roleCacheMap.get(userId);
    if (cached && Date.now() - cached.timestamp < ROLE_CACHE_TTL) {
      return cached.role;
    }
    
    try {
      const res = await fetch("/api/auth/check-role", {
        cache: "no-store",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        const userRole = (data.role as UserRole) || "volunteer";
        roleCacheMap.set(userId, { role: userRole, timestamp: Date.now() });
        return userRole;
      }
    } catch {
      // Ignorar errores
    }
    return "volunteer";
  }, []);

  const refresh = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    
    try {
      const supabase = getSupabase();
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      
      if (error || !authUser) {
        clearState();
      } else {
        const { data: { session: authSession } } = await supabase.auth.getSession();
        
        if (mountedRef.current) {
          setUser(authUser);
          setSession(authSession);
          
          // Obtener rol y perfil
          const [userRole, profileResult] = await Promise.all([
            fetchRole(authUser.id),
            supabase
              .from("user_profiles")
              .select("first_name, last_name, verified")
              .eq("id", authUser.id)
              .single(),
          ]);
          
          if (mountedRef.current) {
            setRole(userRole);
            if (profileResult.data) {
              setProfile({
                firstName: profileResult.data.first_name,
                lastName: profileResult.data.last_name,
                verified: profileResult.data.verified ?? false,
              });
            }
          }
        }
      }
    } catch (err) {
      console.error("[SessionProvider] refresh error:", err);
      clearState();
    } finally {
      fetchingRef.current = false;
      if (mountedRef.current) setLoading(false);
    }
  }, [clearState, fetchRole]);

  useEffect(() => {
    mountedRef.current = true;
    const supabase = getSupabase();

    // Sincronizar session real de Supabase (para tokens)
    supabase.auth.getSession().then(({ data: { session: authSession } }) => {
      if (mountedRef.current && authSession) {
        setSession(authSession);
      }
    });

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log("[SessionProvider] Auth event:", event);
        
        if (event === "SIGNED_OUT") {
          clearState();
          roleCacheMap.clear();
          return;
        }
        
        if (!newSession?.user) {
          clearState();
          return;
        }
        
        if (mountedRef.current) {
          setSession(newSession);
          setUser(newSession.user);
          
          if (event === "SIGNED_IN") {
            roleCacheMap.delete(newSession.user.id);
          }
          
          const userRole = await fetchRole(newSession.user.id);
          if (mountedRef.current) {
            setRole(userRole);
          }
        }
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [clearState, fetchRole]);

  return (
    <SessionContext.Provider value={{ user, session, role, profile, loading, isAdmin, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
