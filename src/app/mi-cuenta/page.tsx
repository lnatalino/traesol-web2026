// src/app/mi-cuenta/page.tsx
// Panel principal del voluntario - Dashboard con datos, operativos y postulaciones
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "@/components/providers/SessionProvider";
import { signOut } from "@/lib/userAuth";
import { Calendar, MapPin, Users, Clock, ExternalLink, MessageCircle, CalendarPlus, AlertTriangle, CheckCircle2 } from "lucide-react";

interface VoluntarioData {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  rut: string | null;
  profesion: string | null;
}

interface OperativoData {
  id: string;
  titulo: string;
  slug: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  lugar: string | null;
  estado: string;
  whatsapp_grupo_url?: string | null;
}

interface InscripcionData {
  id: string;
  estado: string;
  created_at: string;
  operativo: OperativoData | null;
}

export default function MiCuentaPage() {
  const router = useRouter();
  const { user, profile, role, loading: sessionLoading, isAdmin } = useSession();
  
  const [loggingOut, setLoggingOut] = useState(false);
  const [voluntarioData, setVoluntarioData] = useState<VoluntarioData | null>(null);
  const [porAsistir, setPorAsistir] = useState<InscripcionData[]>([]);
  const [finalizados, setFinalizados] = useState<InscripcionData[]>([]);
  const [pendientes, setPendientes] = useState<InscripcionData[]>([]);
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
          setPorAsistir(data.porAsistir || []);
          setFinalizados(data.finalizados || []);
          setPendientes(data.pendientes || []);
        } else {
          setVoluntarioData(null);
          setPorAsistir([]);
          setFinalizados([]);
          setPendientes([]);
        }
      } catch (err) {
        console.error("[mi-cuenta] Error cargando datos:", err);
        setVoluntarioData(null);
        setPorAsistir([]);
        setFinalizados([]);
        setPendientes([]);
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

  // Helpers para fechas y Google Calendar
  function formatFechaMes(fecha: string | null): { dia: string; mes: string } {
    if (!fecha) return { dia: "--", mes: "---" };
    const d = new Date(fecha);
    return {
      dia: d.getDate().toString().padStart(2, "0"),
      mes: d.toLocaleDateString("es-CL", { month: "short" }).replace(".", ""),
    };
  }

  function formatFechaCompleta(fecha: string | null): string {
    if (!fecha) return "Fecha por confirmar";
    return new Date(fecha).toLocaleDateString("es-CL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function createGoogleCalendarUrl(op: OperativoData | null): string {
    if (!op?.fecha_inicio) return "#";
    const start = op.fecha_inicio.replace(/-/g, "").slice(0, 8);
    const end = op.fecha_fin 
      ? op.fecha_fin.replace(/-/g, "").slice(0, 8)
      : start;
    const title = encodeURIComponent(op.titulo || "Operativo Traesol");
    const location = encodeURIComponent(op.lugar || "");
    const details = encodeURIComponent(`Operativo de Fundación Traesol\nhttps://www.traesol.cl/operativos/${op.slug || op.id}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&location=${location}&details=${details}`;
  }

  // Verificar si el perfil está completo (campos críticos)
  const isProfileIncomplete = !voluntarioData?.rut || !voluntarioData?.profesion;

  return (
    <main className="container">
      <div className="max-w-4xl mx-auto mt-6 sm:mt-8 px-0 sm:px-5 pb-14">
        {/* Header con avatar */}
        <div className="card mb-5 sm:mb-6 relative overflow-hidden mx-4 sm:mx-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-transparent to-transparent" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center text-lg sm:text-xl font-bold shrink-0 shadow-[0_4px_12px_rgba(37,99,235,0.3)]">
                {initials}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate">{displayName}</h1>
                <p className="text-slate-500 text-sm truncate">{user.email}</p>
                <span className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Voluntario verificado
                </span>
              </div>
            </div>
            <Link 
              href="/mi-cuenta/perfil" 
              className="btn-outline text-sm flex items-center justify-center gap-2 w-full sm:w-auto"
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
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3 mb-6 sm:mb-8 px-4 sm:px-0">
          <Link href="/operativos" className="card hover:border-blue-300 hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 group">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors duration-300">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold tracking-tight text-slate-900">Ver operativos</h3>
                <p className="text-sm text-slate-500">Próximas oportunidades</p>
              </div>
            </div>
          </Link>

          <Link href="/postular" className="card hover:border-green-300 hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 group">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors duration-300">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold tracking-tight text-slate-900">Postular</h3>
                <p className="text-sm text-slate-500">A un nuevo operativo</p>
              </div>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="card hover:border-red-300 hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.08)] transition-all duration-300 group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors duration-300">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold tracking-tight text-red-600">
                  {loggingOut ? "Cerrando..." : "Cerrar sesión"}
                </h3>
                <p className="text-sm text-slate-500">Salir de mi cuenta</p>
              </div>
            </div>
          </button>
        </div>

        {/* Grid de secciones - stack on mobile */}
        <div className="grid gap-5 sm:gap-6 lg:grid-cols-2 px-4 sm:px-0">
          {/* Mis datos */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-bold tracking-tight text-slate-900">Mis datos</h2>
              </div>
              {isProfileIncomplete && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                  <AlertTriangle className="w-3 h-3" />
                  Incompleto
                </span>
              )}
            </div>
            
            {isProfileIncomplete && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  Completa tu perfil para poder postular a operativos.
                </p>
                <Link 
                  href="/mi-cuenta/perfil" 
                  className="inline-flex items-center gap-1 mt-2 text-sm font-medium text-amber-700 hover:text-amber-900"
                >
                  Completar ahora →
                </Link>
              </div>
            )}
            
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
                <span className={`font-medium ${voluntarioData?.rut ? "text-slate-900" : "text-amber-600"}`}>
                  {voluntarioData?.rut || "Sin registrar"}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Profesión</span>
                <span className={`font-medium ${voluntarioData?.profesion ? "text-slate-900" : "text-amber-600"}`}>
                  {voluntarioData?.profesion || "Sin registrar"}
                </span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100">
              <Link 
                href="/mi-cuenta/perfil" 
                className="btn-primary w-full justify-center text-sm"
              >
                Editar perfil completo
              </Link>
            </div>
          </div>

          {/* POR ASISTIR - Sección principal mejorada */}
          <div className="card lg:row-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-bold tracking-tight text-slate-900">Por asistir</h2>
              </div>
              <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                {porAsistir.length}
              </span>
            </div>
            
            {loadingData ? (
              <div className="animate-pulse space-y-4">
                <div className="h-24 bg-slate-100 rounded-xl" />
                <div className="h-24 bg-slate-100 rounded-xl" />
              </div>
            ) : porAsistir.length > 0 ? (
              <div className="space-y-4">
                {/* Cards de operativos */}
                {porAsistir.slice(0, 3).map(insc => {
                  const { dia, mes } = formatFechaMes(insc.operativo?.fecha_inicio || null);
                  const op = insc.operativo;
                  return (
                    <div 
                      key={insc.id}
                      className="relative bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200 overflow-hidden"
                    >
                      <div className="flex">
                        {/* Fecha destacada */}
                        <div className="flex-shrink-0 w-20 py-4 flex flex-col items-center justify-center border-r border-blue-200 bg-white/50">
                          <span className="text-2xl font-bold text-blue-700">{dia}</span>
                          <span className="text-xs font-medium text-blue-600 uppercase">{mes}</span>
                        </div>
                        
                        {/* Contenido */}
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-slate-900 text-sm leading-tight">
                              {op?.titulo || "Operativo"}
                            </h3>
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              Confirmado
                            </span>
                          </div>
                          
                          {op?.lugar && (
                            <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                              <MapPin className="w-3 h-3" />
                              <span>{op.lugar}</span>
                            </div>
                          )}
                          
                          {/* Botones de acción */}
                          <div className="flex flex-wrap gap-2">
                            <Link
                              href={`/operativos/${op?.slug || op?.id}`}
                              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 bg-white px-2 py-1 rounded-md border border-blue-200 hover:border-blue-300 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Ver detalle
                            </Link>
                            
                            <a
                              href={createGoogleCalendarUrl(op)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white px-2 py-1 rounded-md border border-slate-200 hover:border-slate-300 transition-colors"
                            >
                              <CalendarPlus className="w-3 h-3" />
                              Agregar a calendario
                            </a>
                            
                            {op?.whatsapp_grupo_url && (
                              <a
                                href={op.whatsapp_grupo_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-800 bg-white px-2 py-1 rounded-md border border-green-200 hover:border-green-300 transition-colors"
                              >
                                <MessageCircle className="w-3 h-3" />
                                WhatsApp
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {porAsistir.length > 3 && (
                  <p className="text-center text-sm text-slate-500 pt-2">
                    y {porAsistir.length - 3} operativo{porAsistir.length - 3 > 1 ? "s" : ""} más...
                  </p>
                )}
                
                {/* Timeline de próximas fechas */}
                {porAsistir.length > 1 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs font-medium text-slate-500 mb-3">Próximas fechas</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {porAsistir.slice(0, 6).map(insc => {
                        const { dia, mes } = formatFechaMes(insc.operativo?.fecha_inicio || null);
                        return (
                          <div 
                            key={insc.id}
                            className="flex-shrink-0 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-center min-w-[60px]"
                            title={insc.operativo?.titulo}
                          >
                            <span className="block text-sm font-bold text-blue-700">{dia}</span>
                            <span className="block text-[10px] font-medium text-blue-500 uppercase">{mes}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-600 font-medium mb-1">No tienes operativos próximos</p>
                <p className="text-slate-500 text-sm mb-4">Explora los operativos disponibles y postula</p>
                <Link 
                  href="/operativos" 
                  className="btn-primary inline-flex items-center gap-2 text-sm"
                >
                  Ver operativos disponibles
                </Link>
              </div>
            )}
          </div>

          {/* Postulaciones pendientes */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold tracking-tight text-slate-900">Mis postulaciones</h2>
              </div>
              <span className="text-sm font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                {pendientes.length} pendientes
              </span>
            </div>
            
            {loadingData ? (
              <div className="animate-pulse space-y-3">
                <div className="h-16 bg-slate-100 rounded-lg" />
              </div>
            ) : pendientes.length > 0 ? (
              <div className="space-y-3">
                {pendientes.map(insc => (
                  <div 
                    key={insc.id}
                    className="p-3 bg-amber-50 rounded-lg border border-amber-200"
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
                <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No tienes postulaciones pendientes</p>
              </div>
            )}
          </div>

          {/* Operativos finalizados */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <h2 className="text-lg font-bold tracking-tight text-slate-900">Finalizados</h2>
              </div>
              <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                {finalizados.length}
              </span>
            </div>
            
            {loadingData ? (
              <div className="animate-pulse space-y-3">
                <div className="h-16 bg-slate-100 rounded-lg" />
              </div>
            ) : finalizados.length > 0 ? (
              <div className="space-y-3">
                {finalizados.slice(0, 3).map(insc => (
                  <div 
                    key={insc.id}
                    className="p-3 bg-green-50 rounded-lg border border-green-200"
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
                {finalizados.length > 3 && (
                  <p className="text-center text-sm text-slate-500">
                    y {finalizados.length - 3} más...
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Aún no has participado en operativos</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
