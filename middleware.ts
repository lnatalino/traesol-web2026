// middleware.ts
// SISTEMA UNIFICADO: Refresca sesión Supabase + protege rutas
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Roles permitidos para /admin
const ADMIN_ROLES = new Set(["superadmin", "admin", "editor", "viewer"]);

// Rutas públicas de /mi-cuenta que NO requieren autenticación
const PUBLIC_MI_CUENTA_PATHS = new Set([
  "/mi-cuenta/login",
  "/mi-cuenta/registro",
  "/mi-cuenta/olvido-contrasena",
  "/mi-cuenta/restablecer-contrasena",
  "/mi-cuenta/verificar", // Verificación de email - necesita acceso para recibir OTP
]);

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  
  // Crear response para poder modificar cookies
  let response = NextResponse.next({
    request: { headers: req.headers },
  });

  // Crear cliente Supabase con manejo de cookies en middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Primero setear en request para que el server las vea
          cookiesToSet.forEach(({ name, value }) => {
            req.cookies.set(name, value);
          });
          // Luego setear en response para que el browser las guarde
          response = NextResponse.next({
            request: { headers: req.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // CRÍTICO: Refrescar sesión para sincronizar cookies SSR
  // Esto DEBE llamarse en cada request para mantener sesión válida
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  // =====================================================
  // PROTECCIÓN DE /mi-cuenta (excepto rutas públicas)
  // =====================================================
  if (pathname.startsWith("/mi-cuenta") && !PUBLIC_MI_CUENTA_PATHS.has(pathname)) {
    // Si no hay sesión Supabase válida, redirigir a login
    if (userError || !user) {
      const url = new URL("/mi-cuenta/login", req.url);
      // Preservar destino original para redirigir después
      if (pathname !== "/mi-cuenta") {
        url.searchParams.set("next", pathname + req.nextUrl.search);
      }
      return NextResponse.redirect(url);
    }
    
    // Sesión válida: continuar con cookies actualizadas
    return response;
  }

  // =====================================================
  // PROTECCIÓN DE /admin
  // =====================================================
  if (pathname.startsWith("/admin")) {
    // Primero verificar cookie de rol (sistema legacy admin)
    const role = req.cookies.get("traesol-role")?.value || "";
    
    // Si tiene rol admin válido, permitir acceso
    if (ADMIN_ROLES.has(role)) {
      return response;
    }
    
    // Si no hay cookie de rol pero hay sesión Supabase, 
    // podría ser admin via user_roles (verificar en página)
    // Por ahora redirigir a login unificado
    const url = new URL("/mi-cuenta/login", req.url);
    url.searchParams.set("next", pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // =====================================================
  // RUTAS PÚBLICAS: Solo refrescar cookies
  // =====================================================
  return response;
}

// Matcher: solo rutas que requieren auth o refresh de cookies
// Excluye assets estáticos, api routes públicas, etc.
export const config = { 
  matcher: [
    // Proteger rutas admin y mi-cuenta
    "/admin/:path*",
    "/mi-cuenta/:path*",
    // Refresh de cookies en rutas públicas principales (sin bloquear)
    "/",
    "/operativos/:path*",
    "/novedades/:path*",
    "/empresas/:path*",
    "/quirurgico/:path*",
    "/postular/:path*",
    "/encuesta/:path*",
  ] 
};
