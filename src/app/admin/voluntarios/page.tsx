import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import type { VoluntarioAdminRow } from "@/lib/voluntariosAdmin";
import {
  applyVolunteerFilters,
  buildEspecialidadOptions,
  buildProfesionOptions,
  parseVolunteerFilters,
  VOLUNTARIO_COLUMNS,
} from "@/lib/voluntariosAdmin";
import VoluntariosTable from "./VoluntariosTable";

export const dynamic = "force-dynamic";

const LIMIT = 200;

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const DATE_FORMAT = new Intl.DateTimeFormat("es-CL", {
  timeZone: "America/Santiago",
  year: "numeric",
  month: "short",
  day: "numeric",
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type OptionLists = {
  profesiones: string[];
  especialidades: string[];
  includeEmptyProfesion: boolean;
  includeEmptyEspecialidad: boolean;
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return DATE_TIME_FORMAT.format(date);
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return DATE_FORMAT.format(date);
}

export default async function AdminVoluntariosPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const session = await getAdminSession();
  if (!session.allowed) {
    redirect("/login?next=/admin/voluntarios");
  }

  const filters = parseVolunteerFilters(params);

  let rows: VoluntarioAdminRow[] = [];
  let total = 0;
  let errorMessage = "";
  let options: OptionLists = {
    profesiones: [],
    especialidades: [],
    includeEmptyProfesion: false,
    includeEmptyEspecialidad: false,
  };

  try {
    const listQuery = applyVolunteerFilters(
      supabaseService
        .from("voluntarios")
        .select(VOLUNTARIO_COLUMNS, { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(LIMIT),
      filters
    );

    const [listRes, profesionRes, especialidadRes] = await Promise.all([
      listQuery,
      supabaseService.from("voluntarios").select("profesion"),
      supabaseService.from("voluntarios").select("especialidad"),
    ]);

    if (listRes.error) {
      throw listRes.error;
    }

    rows = (listRes.data ?? []) as VoluntarioAdminRow[];
    total = typeof listRes.count === "number" ? listRes.count : rows.length;

    const profesionRows = (profesionRes.data as Array<{ profesion?: string | null }> | null) ?? [];
    const especialidadRows = (especialidadRes.data as Array<{ especialidad?: string | null }> | null) ?? [];

    const profesionOptions = buildProfesionOptions(profesionRows);
    const especialidadOptions = buildEspecialidadOptions(especialidadRows);

    options = {
      profesiones: profesionOptions.values,
      especialidades: especialidadOptions.values,
      includeEmptyProfesion: profesionOptions.includeEmpty,
      includeEmptyEspecialidad: especialidadOptions.includeEmpty,
    };

    if (profesionRes.error && !errorMessage) {
      errorMessage = `No se pudieron cargar las profesiones (${profesionRes.error.message}).`;
    }
    if (especialidadRes.error && !errorMessage) {
      errorMessage = `No se pudieron cargar las especialidades (${especialidadRes.error.message}).`;
    }
  } catch (err: any) {
    errorMessage = err?.message ? String(err.message) : "No se pudieron cargar los voluntarios.";
  }

  const items = rows.map((row) => ({
    ...row,
    createdLabel: formatDateTime(row.created_at),
    birthLabel: formatDate(row.fecha_nacimiento),
  }));

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-slate-100 bg-white/95 p-6 shadow-lg shadow-blue-900/5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-600">Voluntariado</p>
          <h1 className="text-3xl font-semibold text-slate-900">Base de voluntarios</h1>
          <p className="text-sm text-slate-500 max-w-3xl">
            Busca perfiles, filtra por profesión o especialidad y exporta un CSV para trabajar con otras herramientas.
          </p>
        </div>
      </section>

      <VoluntariosTable
        items={items}
        total={total}
        limit={LIMIT}
        filters={filters}
        options={options}
        errorMessage={errorMessage}
      />
    </div>
  );
}
