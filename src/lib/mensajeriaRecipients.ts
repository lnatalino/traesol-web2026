import { supabaseService } from "@/lib/supabaseService";

export type MessagingMode = "all" | "operativo" | "custom";

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
  rut: string | null;
  profesion: string | null;
  operativosRealizados: number;
};

function sanitizeSearch(value: string): string {
  return value.replace(/[,%]/g, " ").trim();
}

type SearchableQuery<T> = {
  or: (filters: string, options?: { foreignTable?: string; referencedTable?: string }) => T;
};

function applySearch<T extends SearchableQuery<T>>(query: T, search: string): T {
  const term = sanitizeSearch(search);
  if (!term) return query;
  const pattern = `%${term}%`;
  return query.or(`nombres.ilike.${pattern},apellidos.ilike.${pattern},email.ilike.${pattern}`);
}

type RawVolunteerRow = {
  id?: string | null;
  email?: string | null;
  nombres?: string | null;
  apellidos?: string | null;
  rut?: string | null;
  profesion?: string | null;
};

type RawInscripcionRow = {
  voluntario_id?: string | null;
  operativo_id?: string | null;
  estado?: string | null;
};

const APROBADOS_ESTADOS = new Set(["aprobado", "confirmado", "asistio"]);

function normalizeRecipients(
  rows: RawVolunteerRow[],
  inscripciones: RawInscripcionRow[]
): MessagingRecipient[] {
  const counts = new Map<string, number>();
  const seenPairs = new Set<string>();

  for (const inscripcion of inscripciones) {
    const voluntarioId = inscripcion.voluntario_id ? String(inscripcion.voluntario_id) : "";
    if (!voluntarioId) continue;
    if (inscripcion.estado && !APROBADOS_ESTADOS.has(inscripcion.estado)) continue;
    const operativoId = inscripcion.operativo_id ? String(inscripcion.operativo_id) : null;
    if (!operativoId) continue;

    const key = `${voluntarioId}:${operativoId}`;
    if (seenPairs.has(key)) continue;
    seenPairs.add(key);
    counts.set(voluntarioId, (counts.get(voluntarioId) ?? 0) + 1);
  }

  return rows
    .map((row) => {
      const id = row.id ? String(row.id) : "";
      const email = (row.email || "").trim();
      if (!id || !email) return null;
      return {
        id,
        email,
        nombres: row.nombres ?? null,
        apellidos: row.apellidos ?? null,
        rut: row.rut ?? null,
        profesion: row.profesion ?? null,
        operativosRealizados: counts.get(id) ?? 0,
      } satisfies MessagingRecipient;
    })
    .filter((item): item is MessagingRecipient => Boolean(item));
}

export function parseMessagingFilters(params: Record<string, string | string[] | undefined>): MessagingFilters {
  const modeParam = typeof params?.mode === "string" ? params.mode.trim().toLowerCase() : "";
  const mode: MessagingMode = modeParam === "operativo" ? "operativo" : modeParam === "custom" ? "custom" : "all";
  const operativoId = typeof params?.operativoId === "string" ? params.operativoId.trim() : "";
  const q = typeof params?.q === "string" ? params.q.trim() : "";
  return {
    mode,
    operativoId,
    q,
  };
}

export async function listMessagingRecipients(filters: MessagingFilters): Promise<MessagingRecipient[]> {
  let ids: string[] | null = null;

  if (filters.mode === "operativo") {
    if (!filters.operativoId) return [];

    const { data: inscripciones, error: inscError } = await supabaseService
      .from("inscripciones")
      .select("voluntario_id")
      .eq("operativo_id", filters.operativoId)
      .in("estado", Array.from(APROBADOS_ESTADOS));
    if (inscError) throw inscError;

    ids = Array.from(
      new Set(
        ((inscripciones ?? []) as Array<{ voluntario_id: string | null }>)
          .map((row) => row.voluntario_id)
          .filter((value): value is string => Boolean(value))
      )
    );
    if (!ids.length) return [];
  }

  let query = supabaseService
    .from("voluntarios")
    .select("id,nombres,apellidos,email,rut,profesion")
    .not("email", "is", null)
    .neq("email", "")
    .order("nombres", { ascending: true });

  if (ids) {
    query = query.in("id", ids);
  }

  query = applySearch(query, filters.q);

  const { data, error } = await query;
  if (error) throw error;

  const volunteerRows = (data ?? []) as RawVolunteerRow[];
  if (!volunteerRows.length) return [];

  const volunteerIds = volunteerRows.map((row) => String(row.id));
  const { data: inscRows, error: inscError } = await supabaseService
    .from("inscripciones")
    .select("voluntario_id,operativo_id,estado")
    .in("voluntario_id", volunteerIds);
  if (inscError) throw inscError;

  return normalizeRecipients(volunteerRows, (inscRows ?? []) as RawInscripcionRow[]);
}
