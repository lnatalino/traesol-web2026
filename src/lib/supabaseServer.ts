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
 * Cliente Supabase para Server Components (RSC).
 *
 * Importante:
 * - NO usamos cookies reales aquí.
 * - Solo necesitamos leer datos públicos con la anon key.
 * - Todas las operaciones de cookies son "no-op" (no hacen nada).
 *
 * Esto evita por completo los problemas de Next 16 con cookies() en RSC.
 */
export function createSupabaseServer() {
  return createServerClient(url, anon, {
    cookies: emptyCookies,
  });
}

export function createSupabaseBrowser() {
  return createBrowserClient(url, anon);
}
