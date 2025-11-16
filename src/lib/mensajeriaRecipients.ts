import { supabaseService } from "@/lib/supabaseService";

export type MessagingMode = "all" | "operativo";

export type MessagingFilters = {
  mode: MessagingMode;
  operativoId: string;
  q: string;
};

export type MessagingRecipient = {
  id: string;
  email: string;
  nombres: string | null;
  apellidos: string | null;
};

function sanitizeSearch(value: string): string {
  return value.replace(/[,%]/g, " ").trim();
}

function applySearch(query: any, search: string) {
  const term = sanitizeSearch(search);
  if (!term) return query;
  const pattern = `%${term}%`;
  return query.or(`nombres.ilike.${pattern},apellidos.ilike.${pattern},email.ilike.${pattern}`);
}

function normalizeRecipients(rows: Array<{ id?: string | null; email?: string | null; nombres?: string | null; apellidos?: string | null }>): MessagingRecipient[] {
  return rows
    .map((row) => ({
      id: row.id ? String(row.id) : "",
      email: (row.email || "").trim(),
      nombres: row.nombres ?? null,
      apellidos: row.apellidos ?? null,
    }))
    .filter((item) => item.id && item.email);
}

export function parseMessagingFilters(params: Record<string, string | string[] | undefined>): MessagingFilters {
  const modeParam = typeof params?.mode === "string" ? params.mode.trim().toLowerCase() : "";
  const mode: MessagingMode = modeParam === "operativo" ? "operativo" : "all";
  const operativoId = typeof params?.operativoId === "string" ? params.operativoId.trim() : "";
  const q = typeof params?.q === "string" ? params.q.trim() : "";
  return {
    mode,
    operativoId,
    q,
  };
}

export async function listMessagingRecipients(filters: MessagingFilters): Promise<MessagingRecipient[]> {
  if (filters.mode === "operativo") {
    if (!filters.operativoId) {
      return [];
    }

    const { data: inscripciones, error: inscError } = await supabaseService
      .from("inscripciones")
      .select("voluntario_id")
      .eq("operativo_id", filters.operativoId);

    if (inscError) throw inscError;

    const ids = Array.from(
      new Set(
        ((inscripciones ?? []) as Array<{ voluntario_id: string | null }>)
          .map((row) => row.voluntario_id)
          .filter((value): value is string => Boolean(value))
      )
    );

    if (!ids.length) {
      return [];
    }

    let query = supabaseService
      .from("voluntarios")
      .select("id,nombres,apellidos,email")
      .in("id", ids)
      .not("email", "is", null)
      .neq("email", "")
      .order("nombres", { ascending: true });

    query = applySearch(query, filters.q);

    const { data, error } = await query;
    if (error) throw error;

    return normalizeRecipients((data ?? []) as Array<any>);
  }

  let query = supabaseService
    .from("voluntarios")
    .select("id,nombres,apellidos,email")
    .not("email", "is", null)
    .neq("email", "")
    .order("nombres", { ascending: true });

  query = applySearch(query, filters.q);

  const { data, error } = await query;
  if (error) throw error;

  return normalizeRecipients((data ?? []) as Array<any>);
}
