// middleware.ts
// SISTEMA UNIFICADO: Refresca sesión Supabase + protege /admin
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ALLOWED_ROLES = new Set(["superadmin", "admin", "editor", "viewer"]);

export async function middleware(req: NextRequest) {
  // Crear response para poder modificar cookies
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
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
            request: {
              headers: req.headers,
            },
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
  const { data: { user } } = await supabase.auth.getUser();

  // Si NO es ruta /admin, simplemente retornar con cookies actualizadas
  if (!req.nextUrl.pathname.startsWith("/admin")) {
    return response;
  }

  // Para rutas /admin: verificar rol
  const role = req.cookies.get("traesol-role")?.value || "";
  
  // Verificar si el rol está permitido
  if (!ALLOWED_ROLES.has(role)) {
    // SIEMPRE redirigir al login unificado, NO al viejo /login
    const url = new URL("/mi-cuenta/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }
  
  return response;
}

export const config = { 
  matcher: [
    // Incluir todas las rutas excepto assets estáticos
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ] 
};
