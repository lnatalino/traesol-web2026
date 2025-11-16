type FilterableQuery = any;

export type VoluntarioAdminRow = {
  id: string;
  nombres: string | null;
  apellidos: string | null;
  nacionalidad: string | null;
  ciudad: string | null;
  region: string | null;
  pais: string | null;
  genero: string | null;
  fecha_nacimiento: string | null;
  rut: string | null;
  id_nacional: string | null;
  pasaporte: string | null;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  instagram: string | null;
  profesion: string | null;
  profesion_otro: string | null;
  especialidad: string | null;
  talla_polera: string | null;
  talla_pantalon: string | null;
  alimentarias_alergias: string | null;
  alimentarias_veg: boolean | null;
  alimentarias_otro: string | null;
  nombre_credencial: string | null;
  tipo_usuario: string | null;
  created_at: string | null;
};

export const VOLUNTARIO_COLUMNS = [
  "id",
  "nombres",
  "apellidos",
  "nacionalidad",
  "ciudad",
  "region",
  "pais",
  "genero",
  "fecha_nacimiento",
  "rut",
  "id_nacional",
  "pasaporte",
  "email",
  "telefono",
  "direccion",
  "instagram",
  "profesion",
  "profesion_otro",
  "especialidad",
  "talla_polera",
  "talla_pantalon",
  "alimentarias_alergias",
  "alimentarias_veg",
  "alimentarias_otro",
  "nombre_credencial",
  "tipo_usuario",
  "created_at",
].join(",");

export type VoluntarioFilters = {
  q: string;
  profesion: string;
  especialidad: string;
  veg: "" | "true" | "false";
};

export const EMPTY_OPTION_VALUE = "__empty";

type SearchParamsLike = URLSearchParams | Record<string, unknown>;

function readParam(source: SearchParamsLike, key: string): string {
  if (source instanceof URLSearchParams) {
    return source.get(key) ?? "";
  }
  const value = (source as Record<string, unknown>)[key];
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" ? first : "";
  }
  return typeof value === "string" ? value : "";
}

export function sanitizeSearch(raw: string): string {
  return raw.replace(/[,%]+/g, " ").replace(/\s+/g, " ").trim();
}

export function buildSearchPattern(raw: string): string | null {
  const clean = sanitizeSearch(raw);
  if (!clean) return null;
  const wildcard = clean.replace(/\s+/g, "%");
  return `%${wildcard}%`;
}

export function parseVolunteerFilters(source: SearchParamsLike): VoluntarioFilters {
  const q = sanitizeSearch(readParam(source, "q"));
  const profesion = readParam(source, "profesion").trim();
  const especialidad = readParam(source, "especialidad").trim();
  const vegParam = readParam(source, "veg").toLowerCase();
  const veg: "" | "true" | "false" = vegParam === "true" ? "true" : vegParam === "false" ? "false" : "";
  return { q, profesion, especialidad, veg };
}

export function parseVolunteerFiltersFromRecord(source: Record<string, unknown>): VoluntarioFilters {
  return parseVolunteerFilters(source);
}

export function applyVolunteerFilters(
  query: FilterableQuery,
  filters: VoluntarioFilters
): FilterableQuery {
  let builder = query;
  const pattern = buildSearchPattern(filters.q);
  if (pattern) {
    const clauses = [
      `nombres.ilike.${pattern}`,
      `apellidos.ilike.${pattern}`,
      `email.ilike.${pattern}`,
      `telefono.ilike.${pattern}`,
      `rut.ilike.${pattern}`,
      `id_nacional.ilike.${pattern}`,
      `pasaporte.ilike.${pattern}`,
      `nombre_credencial.ilike.${pattern}`,
    ];

    const normalizedRut = filters.q.replace(/[.\-\s]+/g, "").toUpperCase();
    if (normalizedRut && normalizedRut !== filters.q.toUpperCase()) {
      const rutPattern = `%${normalizedRut}%`;
      clauses.push(`rut.ilike.${rutPattern}`);
      clauses.push(`id_nacional.ilike.${rutPattern}`);
    }

    builder = builder.or(Array.from(new Set(clauses)).join(","));
  }

  if (filters.profesion) {
    if (filters.profesion === EMPTY_OPTION_VALUE) builder = builder.is("profesion", null);
    else builder = builder.eq("profesion", filters.profesion);
  }

  if (filters.especialidad) {
    if (filters.especialidad === EMPTY_OPTION_VALUE) builder = builder.is("especialidad", null);
    else builder = builder.eq("especialidad", filters.especialidad);
  }

  if (filters.veg === "true") builder = builder.eq("alimentarias_veg", true);
  if (filters.veg === "false") builder = builder.eq("alimentarias_veg", false);

  return builder;
}


export type VolunteerOptionSet = {
  values: string[];
  includeEmpty: boolean;
};

function normalizeDistinct(values: Array<string | null | undefined>): VolunteerOptionSet {
  const set = new Set<string>();
  let includeEmpty = false;
  for (const value of values) {
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (trimmed) set.add(trimmed);
    else includeEmpty = true;
  }
  return {
    values: Array.from(set).sort((a, b) => a.localeCompare(b, "es")),
    includeEmpty,
  };
}

export function buildProfesionOptions(rows: Array<{ profesion?: string | null }>): VolunteerOptionSet {
  return normalizeDistinct(rows.map((row) => row?.profesion ?? null));
}

export function buildEspecialidadOptions(rows: Array<{ especialidad?: string | null }>): VolunteerOptionSet {
  return normalizeDistinct(rows.map((row) => row?.especialidad ?? null));
}
