import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import type { VoluntarioAdminRow, VoluntarioFilters } from "@/lib/voluntariosAdmin";
import {
  applyVolunteerFilters,
  parseVolunteerFilters,
  VOLUNTARIO_COLUMNS,
} from "@/lib/voluntariosAdmin";

const DEFAULT_LIMIT = 2000;

const CSV_HEADERS = [
  { key: "id", header: "ID" },
  { key: "nombres", header: "Nombres" },
  { key: "apellidos", header: "Apellidos" },
  { key: "email", header: "Email" },
  { key: "telefono", header: "Teléfono" },
  { key: "nacionalidad", header: "Nacionalidad" },
  { key: "genero", header: "Género" },
  { key: "fecha_nacimiento", header: "Fecha nacimiento" },
  { key: "rut", header: "RUT" },
  { key: "id_nacional", header: "ID nacional" },
  { key: "pasaporte", header: "Pasaporte" },
  { key: "direccion", header: "Dirección" },
  { key: "ciudad", header: "Ciudad" },
  { key: "region", header: "Región" },
  { key: "pais", header: "País" },
  { key: "instagram", header: "Instagram" },
  { key: "profesion", header: "Profesión" },
  { key: "profesion_otro", header: "Profesión (otro)" },
  { key: "especialidad", header: "Especialidad" },
  { key: "talla_polera", header: "Talla polera" },
  { key: "talla_pantalon", header: "Talla pantalón" },
  { key: "alimentarias_veg", header: "Vegetariano" },
  { key: "alimentarias_alergias", header: "Alergias" },
  { key: "alimentarias_otro", header: "Observaciones alimentación" },
  { key: "nombre_credencial", header: "Nombre credencial" },
  { key: "tipo_usuario", header: "Tipo de usuario" },
  { key: "created_at", header: "Fecha registro" },
] as const;

type CsvHeaderKey = (typeof CSV_HEADERS)[number]["key"];

function csvEscape(value: string | null | undefined): string {
  const str = value ?? "";
  if (str === "") return "";
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatBoolean(value: boolean | null | undefined): string {
  if (value === null || typeof value === "undefined") return "";
  return value ? "Sí" : "No";
}

function getCellValue(row: VoluntarioAdminRow, key: CsvHeaderKey): string {
  if (key === "alimentarias_veg") {
    return formatBoolean(row.alimentarias_veg);
  }
  const raw = (row as Record<string, unknown>)[key];
  if (raw === null || typeof raw === "undefined") return "";
  if (typeof raw === "string") return raw;
  return String(raw);
}

function buildCsv(rows: VoluntarioAdminRow[]): string {
  const head = CSV_HEADERS.map((col) => csvEscape(col.header)).join(",");
  const lines = rows.map((row) =>
    CSV_HEADERS.map((col) => csvEscape(getCellValue(row, col.key))).join(",")
  );
  return [head, ...lines].join("\n");
}

function parseLimit(searchParams: URLSearchParams): number {
  const raw = searchParams.get("limit");
  if (!raw) return DEFAULT_LIMIT;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return DEFAULT_LIMIT;
  return Math.min(parsed, 10000);
}

function applyFiltersWithId(query: any, filters: VoluntarioFilters, volunteerId: string) {
  let builder = applyVolunteerFilters(query, filters);
  if (volunteerId) builder = builder.eq("id", volunteerId);
  return builder;
}

export async function GET(req: Request) {
  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }

  const url = new URL(req.url);
  const searchParams = url.searchParams;
  const filters = parseVolunteerFilters(searchParams);
  const volunteerId = (searchParams.get("id") ?? "").trim();
  const limit = parseLimit(searchParams);

  let query = supabaseService
    .from("voluntarios")
    .select(VOLUNTARIO_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);

  query = applyFiltersWithId(query, filters, volunteerId);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const rows = ((data ?? []) as unknown) as VoluntarioAdminRow[];

  const csv = `\uFEFF${buildCsv(rows)}`;
  const filenameBase = volunteerId ? `voluntario-${volunteerId}` : "voluntarios";

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filenameBase}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
