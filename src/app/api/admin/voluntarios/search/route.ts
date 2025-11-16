import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import {
  applyVolunteerFilters,
  parseVolunteerFiltersFromRecord,
} from "@/lib/voluntariosAdmin";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

function parseLimit(raw: string | null): number {
  if (!raw) return DEFAULT_LIMIT;
  const n = Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.floor(n), 1), MAX_LIMIT);
}

function buildInFilter(ids: string[]): string {
  return `(${ids.map((id) => `"${id}"`).join(",")})`;
}

type VolunteerRow = {
  id: string;
  nombres: string | null;
  apellidos: string | null;
  email: string | null;
  profesion: string | null;
  profesion_otro: string | null;
  especialidad: string | null;
};

type VolunteerResponse = {
  id: string;
  nombres: string | null;
  apellidos: string | null;
  email: string | null;
  profesion: string | null;
  profesion_otro: string | null;
  especialidad: string | null;
};

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }

  const url = new URL(req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const filters = parseVolunteerFiltersFromRecord(params);
  const limit = parseLimit(url.searchParams.get("limit"));
  const excludeOperativoId = url.searchParams.get("excludeOperativoId");

  try {
    let excludeVoluntarioIds: string[] = [];
    if (excludeOperativoId) {
      const { data: existingRows, error: existingError } = await supabaseService
        .from("inscripciones")
        .select("voluntario_id")
        .eq("operativo_id", excludeOperativoId);

      if (existingError) throw existingError;
      excludeVoluntarioIds = ((existingRows ?? []) as Array<{ voluntario_id: string | null }>)
        .map((row) => row.voluntario_id)
        .filter((id): id is string => typeof id === "string" && id.length > 0);
    }

    const baseQuery = supabaseService
      .from("voluntarios")
      .select(
        "id,nombres,apellidos,email,profesion,profesion_otro,especialidad",
        { count: "exact" }
      )
      .not("email", "is", null)
      .neq("email", "")
      .order("apellidos", { ascending: true })
      .order("nombres", { ascending: true })
      .limit(limit);

    let query = baseQuery;

    if (excludeVoluntarioIds.length) {
      query = query.not("id", "in", buildInFilter(excludeVoluntarioIds));
    }

    query = applyVolunteerFilters(query, filters);

    const { data, error, count } = await query;
    if (error) throw error;

    const volunteers = ((data ?? []) as VolunteerRow[]).map<VolunteerResponse>((row) => ({
      id: row.id,
      nombres: row.nombres,
      apellidos: row.apellidos,
      email: row.email,
      profesion: row.profesion,
      profesion_otro: row.profesion_otro,
      especialidad: row.especialidad,
    }));

    return NextResponse.json({
      ok: true,
      total: typeof count === "number" ? count : volunteers.length,
      volunteers,
    });
  } catch (error: any) {
    const message = error?.message ? String(error.message) : "No se pudieron cargar los voluntarios";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
