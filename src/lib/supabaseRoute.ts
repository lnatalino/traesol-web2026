// src/lib/supabaseRoute.ts
import {
  createServerClient,
  type CookieMethodsServer,
  type CookieMethodsServerDeprecated,
  type CookieOptions,
} from "@supabase/ssr";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type RouteCookieAdapter = (CookieMethodsServer & CookieMethodsServerDeprecated) & {
  delete?: (name: string, options?: CookieOptions) => Promise<void> | void;
};

const mapOptions = (options?: CookieOptions): CookieOptions => ({ ...(options ?? {}) });

type CookieStore = Awaited<ReturnType<typeof cookies>>;

const createRouteCookieAdapter = (): RouteCookieAdapter => {
  const getStore = async (): Promise<CookieStore> => await cookies();

  return {
    getAll: async () => {
      const store = await getStore();
      return store.getAll().map((cookie: { name: string; value: string }) => ({
        name: cookie.name,
        value: cookie.value,
      }));
    },
    setAll: async (items) => {
      if (!items?.length) return;
      const store = await getStore();
      for (const { name, value, options } of items) {
        store.set(name, value, mapOptions(options));
      }
    },
    get: async (name) => {
      const store = await getStore();
      return store.get(name)?.value;
    },
    set: async (name, value, options: CookieOptions = {}) => {
      const store = await getStore();
      store.set(name, value, mapOptions(options));
    },
    remove: async (name, options: CookieOptions = {}) => {
      const store = await getStore();
      const opts = { ...mapOptions(options), name } as {
        name: string;
      } & CookieOptions;
      store.delete(opts);
    },
    delete: async (name: string, options: CookieOptions = {}) => {
      const store = await getStore();
      const opts = { ...mapOptions(options), name } as {
        name: string;
      } & CookieOptions;
      store.delete(opts);
    },
  };
};

/**
 * Cliente Supabase para Route Handlers / API routes.
 * Aquí SÍ podemos leer y escribir cookies reales.
 */
export function createSupabaseRoute() {
  return createServerClient(url, anon, {
    cookies: createRouteCookieAdapter(),
  });
}
