import { redirect } from "next/navigation";
import { AdminPageHeader, StatTile, StatTileGrid } from "@/components/admin/ui";
import { getAdminSession } from "@/lib/adminSession";
import { getErrorMessage } from "@/lib/errors";
import { supabaseService } from "@/lib/supabaseService";
import type { VoluntarioAdminRow } from "@/lib/voluntariosAdmin";
import {
  applyVolunteerFilters,
  buildEspecialidadOptions,
  buildProfesionOptions,
  parseVolunteerFilters,
  VOLUNTARIO_COLUMNS,
} from "@/lib/voluntariosAdmin";
import { Users, UserCheck, UserX, Briefcase } from "lucide-react";
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

    // Ejecutar las queries en paralelo
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listRes = await (listQuery as any);
    const [profesionRes, especialidadRes] = await Promise.all([
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

    if (profesionRes.error) {
      console.error("[Admin/Voluntarios] Error cargando profesiones", profesionRes.error);
      if (!errorMessage) {
        errorMessage = "No se pudieron cargar las profesiones.";
      }
    }
    if (especialidadRes.error) {
      console.error("[Admin/Voluntarios] Error cargando especialidades", especialidadRes.error);
      if (!errorMessage) {
        errorMessage = "No se pudieron cargar las especialidades.";
      }
    }
  } catch (error: unknown) {
    const debug = getErrorMessage(error);
    console.error("[Admin/Voluntarios] Error cargando listado", debug, error);
    errorMessage = "No se pudieron cargar los voluntarios.";
  }

  const items = rows.map((row) => ({
    ...row,
    createdLabel: formatDateTime(row.created_at),
    birthLabel: formatDate(row.fecha_nacimiento),
  }));

  const filterKey = JSON.stringify(filters);

  // Stats
  const totalVoluntarios = total;
  const uniqueProfesiones = options.profesiones.length;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        backHref="/admin"
        eyebrow="Voluntariado"
        title="Gestión de voluntarios"
        description="Base completa de voluntarios registrados. Filtra por profesión, especialidad o restricción alimentaria."
      />

      {/* Stats */}
      <StatTileGrid>
        <StatTile 
          icon={<Users className="h-4 w-4" />}
          label="Total voluntarios"
          value={totalVoluntarios}
        />
        <StatTile 
          icon={<Briefcase className="h-4 w-4" />}
          label="Profesiones distintas"
          value={uniqueProfesiones}
          highlight
          highlightVariant="blue"
        />
      </StatTileGrid>

      <VoluntariosTable
        key={filterKey}
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
