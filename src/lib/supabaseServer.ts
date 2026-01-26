// src/lib/supabaseServer.ts
import {
  createServerClient,
  createBrowserClient,
  type CookieMethodsServer,
  type CookieMethodsServerDeprecated,
  type CookieOptions,
} from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type EmptyCookieAdapter = (CookieMethodsServer & CookieMethodsServerDeprecated) & {
  delete: (name: string, options?: CookieOptions) => void;
};

const emptyCookies: EmptyCookieAdapter = {
  get(_name) {
    return undefined;
  },
  getAll() {
    return [];
  },
  set(_name, _value, _options) {
    // no-op
  },
  setAll(_list) {
    // no-op
  },
  delete(_name, _options) {
    // no-op
  },
  remove(_name, _options) {
    // no-op
  },
};

/**
 * Cliente Supabase para Server Components (RSC) - Modo público.
 * 
 * IMPORTANTE: Esta versión NO lee sesión de usuario.
 * Solo para queries públicas sin autenticación.
 * 
 * Para operaciones que requieren sesión del usuario, usa:
 * - createSupabaseRoute() en Route Handlers/API
 * - El middleware ya refresca la sesión automáticamente
 */
export function createSupabaseServer() {
  return createServerClient(url, anon, {
    cookies: emptyCookies,
  });
}

// NOTA: createSupabaseBrowser está en src/lib/supabase.ts
// NO duplicar aquí - importar desde @/lib/supabase
