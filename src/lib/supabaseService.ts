import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!; // server-only

export const supabaseService: SupabaseClient<Database> = createClient<Database>(url, key, {
  auth: { persistSession: false },
});
