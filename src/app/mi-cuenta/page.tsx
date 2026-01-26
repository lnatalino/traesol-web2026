// src/app/mi-cuenta/page.tsx
// Panel principal del voluntario - Dashboard con datos, operativos y postulaciones
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/components/providers/SessionProvider";
import { signOut } from "@/lib/userAuth";

interface VoluntarioData {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  rut: string | null;
  profesion: string | null;
}

interface InscripcionData {
  id: string;
  estado: string;
  created_at: string;
  operativo: {
    id: string;
    titulo: string;
    slug: string;
    fecha_inicio: string | null;
    fecha_fin: string | null;
    lugar: string | null;
    estado: string;
  } | null;
}

export default function MiCuentaPage() {
  const router = useRouter();
  const { user, profile, role, loading: sessionLoading, isAdmin } = useSession();
  
  const [loggingOut, setLoggingOut] = useState(false);
  const [voluntarioData, setVoluntarioData] = useState<VoluntarioData | null>(null);
  const [inscripciones, setInscripciones] = useState<InscripcionData[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Redirecciones según rol (middleware ya valida autenticación)
  useEffect(() => {
    // Si tenemos datos SSR (user existe), no esperar loading
    if (!user && sessionLoading) return;
    
    // Admin/superadmin va al panel admin
    if (user && isAdmin) {
      router.replace("/admin");
      return;
    }
    
    // Voluntario no verificado va a verificación
    if (user && profile && !profile.verified) {
      router.replace(`/mi-cuenta/verificar?email=${encodeURIComponent(user.email || "")}`);
    }
  }, [sessionLoading, user, profile, isAdmin, router]);

  // Cargar datos del voluntario e inscripciones
  useEffect(() => {
    async function loadVoluntarioData() {
      if (!user?.email) return;
      
      setLoadingData(true);
      
      try {
        const res = await fetch(`/api/mi-cuenta/datos`, {
          credentials: "include", // Importante para enviar cookies
        });
        if (res.ok) {
          const data = await res.json();
          setVoluntarioData(data.voluntario || null);
          setInscripciones(data.inscripciones || []);
        } else {
          setVoluntarioData(null);
          setInscripciones([]);
        }
      } catch (err) {
        console.error("[mi-cuenta] Error cargando datos:", err);
        setVoluntarioData(null);
        setInscripciones([]);
      } finally {
        setLoadingData(false);
      }
    }
    
    // Cargar datos solo si hay usuario verificado (usar datos SSR si existen)
    const hasSession = !!user;
    const isVerified = profile?.verified ?? false;
    
    if (hasSession && isVerified) {
      loadVoluntarioData();
    } else if (!sessionLoading) {
      setLoadingData(false);
    }
  }, [sessionLoading, user, profile?.verified]);

  async function handleLogout() {
    if (loggingOut) return; // Prevenir doble click
    setLoggingOut(true);
    
    // Timeout de seguridad: máximo 4 segundos
    const safetyTimeout = setTimeout(() => {
      window.location.href = "/";
    }, 4000);
    
    try {
      await signOut();
      clearTimeout(safetyTimeout);
      window.location.href = "/";
    } catch (err) {
      console.error("[mi-cuenta] Logout error:", err);
      clearTimeout(safetyTimeout);
      window.location.href = "/";
    }
  }

  // Loading state - Solo mostrar si no tenemos datos SSR
  if (!user && sessionLoading) {
    return (
      <main className="container">
        <div className="max-w-4xl mx-auto mt-8 px-4">
          <div className="card text-center py-12">
            <div className="animate-pulse">
              <div className="h-16 w-16 bg-slate-200 rounded-full mx-auto mb-4" />
              <div className="h-6 bg-slate-200 rounded w-48 mx-auto mb-2" />
              <div className="h-4 bg-slate-200 rounded w-32 mx-auto" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Si no hay usuario después de cargar, redirigir a login
  // El middleware debería haber redirigido, pero por si acaso
  if (!user) {
    // Redirigir en lugar de mostrar mensaje estático
    if (typeof window !== "undefined") {
      window.location.href = "/mi-cuenta/login?next=/mi-cuenta";
    }
    return (
      <main className="container">
        <div className="max-w-md mx-auto mt-16 px-4">
          <div className="card text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Redirigiendo...</h2>
            <p className="text-slate-600 mb-4">Te llevamos al inicio de sesión.</p>
          </div>
        </div>
      </main>
    );
  }

  const displayName = profile?.firstName && profile?.lastName
    ? `${profile.firstName} ${profile.lastName}`
    : user.email?.split("@")[0] || "Usuario";

  const initials = profile?.firstName && profile?.lastName
    ? `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
    : user.email?.[0]?.toUpperCase() || "U";

  // Separar inscripciones por estado
  const ahora = new Date();
  const operativosFuturos = inscripciones.filter(i => {
    if (!i.operativo?.fecha_inicio) return false;
    const fechaInicio = new Date(i.operativo.fecha_inicio);
    return fechaInicio > ahora && (i.estado === "confirmado" || i.estado === "aprobado");
  });
  
  const operativosFinalizados = inscripciones.filter(i => {
    if (!i.operativo?.fecha_fin) return false;
    const fechaFin = new Date(i.operativo.fecha_fin);
    return fechaFin < ahora && (i.estado === "confirmado" || i.estado === "aprobado");
  });
  
  const postulacionesPendientes = inscripciones.filter(i => 
    i.estado === "pendiente"
  );

  return (
    <main className="container">
      <div className="max-w-4xl mx-auto mt-8 px-4 pb-12">
        {/* Header con avatar */}
        <div className="card mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-semibold shrink-0">
                {initials}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{displayName}</h1>
                <p className="text-slate-500">{user.email}</p>
                <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Voluntario verificado
                </span>
              </div>
            </div>
            <Link 
              href="/mi-cuenta/perfil" 
              className="btn-secondary text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Editar perfil
            </Link>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <Link href="/operativos" className="card hover:border-blue-300 hover:shadow-md transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Ver operativos</h3>
                <p className="text-sm text-slate-500">Próximas oportunidades</p>
              </div>
            </div>
          </Link>

          <Link href="/postular" className="card hover:border-green-300 hover:shadow-md transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Postular</h3>
                <p className="text-sm text-slate-500">A un nuevo operativo</p>
              </div>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="card hover:border-red-300 hover:shadow-md transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-red-600">
                  {loggingOut ? "Cerrando..." : "Cerrar sesión"}
                </h3>
                <p className="text-sm text-slate-500">Salir de mi cuenta</p>
              </div>
            </div>
          </button>
        </div>

        {/* Grid de secciones */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Mis datos */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h2 className="text-lg font-semibold text-slate-900">Mis datos</h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Nombre</span>
                <span className="font-medium text-slate-900">
                  {voluntarioData 
                    ? `${voluntarioData.nombres} ${voluntarioData.apellidos}`.trim() || displayName
                    : displayName
                  }
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Email</span>
                <span className="font-medium text-slate-900">{user.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">RUT</span>
                <span className="font-medium text-slate-900">
                  {voluntarioData?.rut || "No registrado"}
                </span>
              </div>
              {voluntarioData?.profesion && (
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Profesión</span>
                  <span className="font-medium text-slate-900">{voluntarioData.profesion}</span>
                </div>
              )}
            </div>
          </div>

          {/* Operativos por asistir */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h2 className="text-lg font-semibold text-slate-900">Por asistir</h2>
              </div>
              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {operativosFuturos.length}
              </span>
            </div>
            
            {loadingData ? (
              <div className="animate-pulse space-y-3">
                <div className="h-16 bg-slate-100 rounded-lg" />
                <div className="h-16 bg-slate-100 rounded-lg" />
              </div>
            ) : operativosFuturos.length > 0 ? (
              <div className="space-y-3">
                {operativosFuturos.slice(0, 3).map(insc => (
                  <Link 
                    key={insc.id} 
                    href={`/operativos/${insc.operativo?.slug || insc.operativo?.id}`}
                    className="block p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-slate-900">{insc.operativo?.titulo}</p>
                        <p className="text-sm text-slate-500">
                          {insc.operativo?.fecha_inicio 
                            ? new Date(insc.operativo.fecha_inicio).toLocaleDateString("es-CL", {
                                day: "numeric", month: "long", year: "numeric"
                              })
                            : "Fecha por confirmar"
                          }
                        </p>
                      </div>
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-slate-500 text-sm">No tienes operativos próximos</p>
                <Link href="/operativos" className="text-blue-600 text-sm hover:underline mt-1 inline-block">
                  Ver operativos disponibles
                </Link>
              </div>
            )}
          </div>

          {/* Postulaciones pendientes */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h2 className="text-lg font-semibold text-slate-900">Mis postulaciones</h2>
              </div>
              <span className="text-sm font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                {postulacionesPendientes.length} pendientes
              </span>
            </div>
            
            {loadingData ? (
              <div className="animate-pulse space-y-3">
                <div className="h-16 bg-slate-100 rounded-lg" />
              </div>
            ) : postulacionesPendientes.length > 0 ? (
              <div className="space-y-3">
                {postulacionesPendientes.map(insc => (
                  <div 
                    key={insc.id}
                    className="p-3 bg-amber-50 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-slate-900">{insc.operativo?.titulo || "Operativo"}</p>
                        <p className="text-sm text-amber-600">Esperando confirmación</p>
                      </div>
                      <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        Pendiente
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-slate-500 text-sm">No tienes postulaciones pendientes</p>
              </div>
            )}
          </div>

          {/* Operativos finalizados */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-lg font-semibold text-slate-900">Finalizados</h2>
              </div>
              <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                {operativosFinalizados.length}
              </span>
            </div>
            
            {loadingData ? (
              <div className="animate-pulse space-y-3">
                <div className="h-16 bg-slate-100 rounded-lg" />
              </div>
            ) : operativosFinalizados.length > 0 ? (
              <div className="space-y-3">
                {operativosFinalizados.slice(0, 3).map(insc => (
                  <div 
                    key={insc.id}
                    className="p-3 bg-green-50 rounded-lg"
                  >
                    <p className="font-medium text-slate-900">{insc.operativo?.titulo}</p>
                    <p className="text-sm text-slate-500">
                      {insc.operativo?.fecha_fin 
                        ? new Date(insc.operativo.fecha_fin).toLocaleDateString("es-CL", {
                            day: "numeric", month: "long", year: "numeric"
                          })
                        : ""
                      }
                    </p>
                  </div>
                ))}
                {operativosFinalizados.length > 3 && (
                  <p className="text-center text-sm text-slate-500">
                    y {operativosFinalizados.length - 3} más...
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-slate-500 text-sm">Aún no has participado en operativos</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
