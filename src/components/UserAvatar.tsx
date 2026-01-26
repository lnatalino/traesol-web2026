// src/components/UserAvatar.tsx
// Componente de avatar con dropdown para usuarios autenticados
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useUserSession } from "@/lib/hooks/useUserSession";
import { signOut } from "@/lib/userAuth";

export default function UserAvatar() {
  const { user, profile, role, loading } = useUserSession();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const isAdmin = role === "admin" || role === "superadmin";

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    // Prevenir doble click
    if (loggingOut) return;
    
    setLoggingOut(true);
    setOpen(false); // Cerrar dropdown inmediatamente
    
    try {
      // 1. Hacer signOut que limpia servidor + Supabase + localStorage
      await signOut();
      
      // 2. Limpiar cookie de rol manualmente (backup)
      document.cookie = "traesol-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "traesol-email=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      
      // 3. CRÍTICO: Usar window.location para forzar recarga completa
      // Esto garantiza que:
      // - El navbar se re-renderiza desde cero
      // - Todas las cookies del servidor se respetan
      // - No hay estado stale en memoria
      window.location.href = "/";
    } catch (err) {
      console.error("[UserAvatar] Logout error:", err);
      // Forzar recarga de todos modos
      window.location.href = "/";
    }
  }

  // Si está haciendo logout, mostrar spinner
  if (loggingOut) {
    return (
      <div className="w-9 h-9 rounded-full bg-slate-300 flex items-center justify-center">
        <svg className="animate-spin h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (loading) {
    // Skeleton mientras carga
    return (
      <div className="w-9 h-9 rounded-full bg-slate-200 animate-pulse" />
    );
  }

  // Si no hay sesión, mostrar link "Mi cuenta"
  if (!user) {
    return (
      <Link href="/mi-cuenta/login" className="nav-link">
        Mi cuenta
      </Link>
    );
  }

  // Calcular iniciales
  const initials = profile?.first_name && profile?.last_name
    ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    : user.email?.[0]?.toUpperCase() || "U";

  const displayName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : user.email?.split("@")[0] || "Usuario";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Avatar button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-full bg-blue-600 text-white font-semibold text-sm flex items-center justify-center hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
        aria-label="Menú de usuario"
        aria-expanded={open}
      >
        {initials}
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
          {/* User info */}
          <div className="px-4 py-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <p className="font-medium text-slate-900 truncate">{displayName}</p>
              {isAdmin && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 uppercase">
                  {role === "superadmin" ? "Super" : "Admin"}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 truncate">{user.email}</p>
          </div>

          {/* Links */}
          <div className="py-1">
            <Link
              href="/mi-cuenta"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Mi cuenta
            </Link>

            <Link
              href="/mi-cuenta/perfil"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Mi perfil
            </Link>
          </div>

          {/* Admin link - solo visible para admins */}
          {isAdmin && (
            <div className="py-1 border-t border-slate-100">
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-blue-600 hover:bg-blue-50 transition-colors font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Panel Admin
              </Link>
            </div>
          )}

          {/* Logout */}
          <div className="py-1 border-t border-slate-100">
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-3 w-full px-4 py-2 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {loggingOut ? "Cerrando..." : "Cerrar sesión"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
