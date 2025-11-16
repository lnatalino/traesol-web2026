import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import { type InscripcionEstado } from "@/lib/inscripciones";

const CSV_HEADERS = [
  { key: "nombres", header: "Nombres" },
  { key: "apellidos", header: "Apellidos" },
  { key: "email", header: "Email" },
  { key: "telefono", header: "Teléfono" },
  { key: "rut", header: "RUT" },
  { key: "id_nacional", header: "ID Nacional" },
  { key: "pasaporte", header: "Pasaporte" },
  { key: "nacionalidad", header: "Nacionalidad" },
  { key: "fecha_nacimiento", header: "Fecha nacimiento" },
  { key: "genero", header: "Género" },
  { key: "direccion", header: "Dirección" },
  { key: "instagram", header: "Instagram" },
  { key: "profesion", header: "Profesión" },
  { key: "profesion_otro", header: "Profesión (otro)" },
  { key: "especialidad", header: "Especialidad" },
  { key: "nombre_credencial", header: "Nombre credencial" },
  { key: "tipo", header: "Tipo postulación" },
  { key: "created_at", header: "Fecha postulación" },
];

type InscripcionRow = {
  id: string;
  voluntario_id: string | null;
  tipo: string | null;
  estado: string | null;
  created_at: string | null;
};

type VoluntarioRow = {
  id: string;
  nombres: string | null;
  apellidos: string | null;
  email: string | null;
  telefono: string | null;
  rut: string | null;
  id_nacional: string | null;
  pasaporte: string | null;
  nacionalidad: string | null;
  fecha_nacimiento: string | null;
  genero: string | null;
  direccion: string | null;
  instagram: string | null;
  profesion: string | null;
  profesion_otro: string | null;
  especialidad: string | null;
  nombre_credencial: string | null;
};

function csvEscape(value: string | null | undefined): string {
  const str = value ?? "";
  if (str === "") return "";
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(rows: Array<InscripcionRow & { voluntario?: VoluntarioRow | undefined }>): string {
  const headerLine = CSV_HEADERS.map((col) => csvEscape(col.header)).join(",");
  const lines = rows.map((row) => {
    const voluntario = row.voluntario;
    const values = CSV_HEADERS.map((col) => {
      if (col.key === "tipo") return csvEscape(row.tipo ?? "");
      if (col.key === "created_at") return csvEscape(row.created_at ?? "");
      const v = voluntario ? (voluntario as Record<string, string | null | undefined>)[col.key] : undefined;
      return csvEscape(typeof v === "string" || v === null ? v : String(v ?? ""));
    });
    return values.join(",");
  });
  return [headerLine, ...lines].join("\n");
}

const CSV_ESTADO: InscripcionEstado = "aprobado";

export async function GET(
  _req: Request,
  context: { params: { id?: string } | Promise<{ id?: string }> }
) {
  const params = await context.params;
  const operativoId = (params?.id ?? "").trim();

  if (!operativoId) {
    return NextResponse.json({ ok: false, error: "Operativo inválido" }, { status: 400 });
  }

  const session = await getAdminSession();
  if (!session.allowed) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }

  const { data: inscData, error: inscError } = await supabaseService
    .from("inscripciones")
    .select("id,voluntario_id,tipo,estado,created_at")
    .eq("operativo_id", operativoId)
    .eq("estado", CSV_ESTADO)
    .order("created_at", { ascending: true });

  if (inscError) {
    return NextResponse.json({ ok: false, error: inscError.message }, { status: 500 });
  }

  const inscripciones = (inscData || []) as InscripcionRow[];

  const voluntarioIds = Array.from(
    new Set(
      inscripciones
        .map((row) => row.voluntario_id)
        .filter((value): value is string => Boolean(value))
    )
  );

  let voluntariosMap = new Map<string, VoluntarioRow>();
  if (voluntarioIds.length > 0) {
    const { data: voluntarios, error: volError } = await supabaseService
      .from("voluntarios")
      .select(
        "id,nombres,apellidos,email,telefono,rut,id_nacional,pasaporte,nacionalidad,fecha_nacimiento,genero,direccion,instagram,profesion,profesion_otro,especialidad,nombre_credencial"
      )
      .in("id", voluntarioIds);

    if (volError) {
      return NextResponse.json({ ok: false, error: volError.message }, { status: 500 });
    }

    voluntariosMap = new Map(
      ((voluntarios || []) as VoluntarioRow[]).map((vol) => [vol.id, vol])
    );
  }

  const rowsWithVoluntario = inscripciones.map((row) => ({
    ...row,
    voluntario: row.voluntario_id ? voluntariosMap.get(row.voluntario_id) : undefined,
  }));

  const csv = `\uFEFF${buildCsv(rowsWithVoluntario)}`;

  const filename = `operativo-${operativoId}-voluntarios-aceptados.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
