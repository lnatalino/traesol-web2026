// src/app/mi-cuenta/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUserSession } from "@/lib/hooks/useUserSession";
import { signOut } from "@/lib/userAuth";

export default function MiCuentaPage() {
  const router = useRouter();
  const { user, profile, loading } = useUserSession();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/mi-cuenta/login");
    }
  }, [loading, user, router]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOut();
    } finally {
      // Forzar navegación y refresh aunque falle el signOut
      router.replace("/");
      router.refresh();
    }
  }

  if (loading) {
    return (
      <main className="container">
        <div className="max-w-2xl mx-auto mt-12">
          <div className="card text-center py-12">
            <div className="animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-48 mx-auto mb-4" />
              <div className="h-4 bg-slate-200 rounded w-32 mx-auto" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return null; // Se redirige en useEffect
  }

  const displayName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : user.email?.split("@")[0] || "Usuario";

  const initials = profile?.first_name && profile?.last_name
    ? `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase()
    : user.email?.[0]?.toUpperCase() || "U";

  return (
    <main className="container">
      <div className="max-w-2xl mx-auto mt-8">
        {/* Header con avatar */}
        <div className="card mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-semibold">
              {initials}
            </div>
            <div>
              <h1 className="title">{displayName}</h1>
              <p className="text-slate-500">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/mi-cuenta/perfil" className="card hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Mi perfil</h3>
                <p className="text-sm text-slate-500">Ver y editar mis datos</p>
              </div>
            </div>
          </Link>

          <Link href="/operativos" className="card hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Operativos</h3>
                <p className="text-sm text-slate-500">Ver próximos operativos</p>
              </div>
            </div>
          </Link>

          <Link href="/postular" className="card hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Postular</h3>
                <p className="text-sm text-slate-500">Postular a un operativo</p>
              </div>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="card hover:border-red-300 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-red-600">
                  {loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
                </h3>
                <p className="text-sm text-slate-500">Salir de mi cuenta</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </main>
  );
}
