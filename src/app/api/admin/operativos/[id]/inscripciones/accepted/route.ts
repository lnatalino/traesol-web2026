import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import { type InscripcionEstado } from "@/lib/inscripciones";

const CSV_HEADERS = [
  { key: "tipo_participante", header: "Tipo" }, // VOLUNTARIO o STAFF
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
  { key: "talla_polera", header: "Talla polera" },
  { key: "talla_pantalon", header: "Talla pantalón" },
  { key: "restricciones_alimentarias", header: "Restricciones alimentarias" },
  { key: "nombre_credencial", header: "Nombre credencial" },
  { key: "cargo_interno", header: "Cargo interno" },
  { key: "notas", header: "Notas" },
  { key: "created_at", header: "Fecha registro" },
];

type ParticipantRow = {
  tipo_participante: string;
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
  talla_polera: string | null;
  talla_pantalon: string | null;
  restricciones_alimentarias: string | null;
  nombre_credencial: string | null;
  cargo_interno: string | null;
  notas: string | null;
  created_at: string | null;
};

function csvEscape(value: string | null | undefined): string {
  const str = value ?? "";
  if (str === "") return "";
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildCsv(rows: ParticipantRow[]): string {
  const headerLine = CSV_HEADERS.map((col) => csvEscape(col.header)).join(",");
  const lines = rows.map((row) => {
    const values = CSV_HEADERS.map((col) => {
      const v = row[col.key as keyof ParticipantRow];
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

  const allRows: ParticipantRow[] = [];

  // =========================================================================
  // 1. VOLUNTARIOS ACEPTADOS (inscripciones)
  // =========================================================================
  type InscripcionRow = {
    id: string;
    voluntario_id: string | null;
    tipo: string | null;
    estado: string | null;
    created_at: string | null;
  };

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

  if (voluntarioIds.length > 0) {
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
      talla_polera: string | null;
      talla_pantalon: string | null;
      alimentarias_alergias: string | null;
    };

    const { data: voluntarios, error: volError } = await supabaseService
      .from("voluntarios")
      .select(
        "id,nombres,apellidos,email,telefono,rut,id_nacional,pasaporte,nacionalidad,fecha_nacimiento,genero,direccion,instagram,profesion,profesion_otro,especialidad,nombre_credencial,talla_polera,talla_pantalon,alimentarias_alergias"
      )
      .in("id", voluntarioIds);

    if (volError) {
      return NextResponse.json({ ok: false, error: volError.message }, { status: 500 });
    }

    const voluntariosList = (voluntarios || []) as VoluntarioRow[];
    const voluntariosMap = new Map(
      voluntariosList.map((vol) => [vol.id, vol])
    );

    for (const insc of inscripciones) {
      const vol = insc.voluntario_id ? voluntariosMap.get(insc.voluntario_id) : undefined;
      if (!vol) continue;

      allRows.push({
        tipo_participante: "VOLUNTARIO",
        nombres: vol.nombres,
        apellidos: vol.apellidos,
        email: vol.email,
        telefono: vol.telefono,
        rut: vol.rut,
        id_nacional: vol.id_nacional,
        pasaporte: vol.pasaporte,
        nacionalidad: vol.nacionalidad,
        fecha_nacimiento: vol.fecha_nacimiento,
        genero: vol.genero,
        direccion: vol.direccion,
        instagram: vol.instagram,
        profesion: vol.profesion,
        profesion_otro: vol.profesion_otro,
        especialidad: vol.especialidad,
        talla_polera: vol.talla_polera,
        talla_pantalon: vol.talla_pantalon,
        restricciones_alimentarias: vol.alimentarias_alergias,
        nombre_credencial: vol.nombre_credencial,
        cargo_interno: null,
        notas: null,
        created_at: insc.created_at,
      });
    }
  }

  // =========================================================================
  // 2. STAFF (operativo_participantes)
  // =========================================================================
  type StaffRow = {
    id: string;
    user_id: string;
    notas: string | null;
    created_at: string | null;
  };

  const { data: staffData, error: staffError } = await supabaseService
    .from("operativo_participantes")
    .select("id,user_id,notas,created_at")
    .eq("operativo_id", operativoId)
    .eq("kind", "staff")
    .order("created_at", { ascending: true });

  if (staffError) {
    console.error("[export] Staff error:", staffError);
    // No fallar por esto, solo logear
  }

  const staffRows = (staffData || []) as StaffRow[];
  const staffUserIds = staffRows.map(s => s.user_id).filter(Boolean);

  if (staffUserIds.length > 0) {
    // Tipo para perfiles de staff
    type UserProfileRow = {
      id: string;
      first_name: string | null;
      last_name: string | null;
      rut: string | null;
      phone: string | null;
      birthdate: string | null;
      nacionalidad: string | null;
      genero: string | null;
      direccion: string | null;
      instagram: string | null;
      profesion: string | null;
      profesion_otro: string | null;
      especialidad: string | null;
      talla_polera: string | null;
      talla_pantalon: string | null;
      restricciones_alimentarias: string | null;
      nombre_credencial: string | null;
      cargo_interno: string | null;
      id_nacional: string | null;
      pasaporte: string | null;
    };

    // Obtener perfiles
    const { data: profiles } = await supabaseService
      .from("user_profiles")
      .select("id,first_name,last_name,rut,phone,birthdate,nacionalidad,genero,direccion,instagram,profesion,profesion_otro,especialidad,talla_polera,talla_pantalon,restricciones_alimentarias,nombre_credencial,cargo_interno,id_nacional,pasaporte")
      .in("id", staffUserIds);

    // Obtener emails
    const { data: { users } } = await supabaseService.auth.admin.listUsers();
    const emailMap = new Map(users?.map(u => [u.id, u.email || ""]) || []);

    const profilesList = (profiles || []) as UserProfileRow[];
    const profilesMap = new Map(profilesList.map(p => [p.id, p]));

    for (const staff of staffRows) {
      const profile = profilesMap.get(staff.user_id);
      const email = emailMap.get(staff.user_id) || "";

      allRows.push({
        tipo_participante: "STAFF",
        nombres: profile?.first_name || null,
        apellidos: profile?.last_name || null,
        email,
        telefono: profile?.phone || null,
        rut: profile?.rut || null,
        id_nacional: profile?.id_nacional || null,
        pasaporte: profile?.pasaporte || null,
        nacionalidad: profile?.nacionalidad || null,
        fecha_nacimiento: profile?.birthdate || null,
        genero: profile?.genero || null,
        direccion: profile?.direccion || null,
        instagram: profile?.instagram || null,
        profesion: profile?.profesion || null,
        profesion_otro: profile?.profesion_otro || null,
        especialidad: profile?.especialidad || null,
        talla_polera: profile?.talla_polera || null,
        talla_pantalon: profile?.talla_pantalon || null,
        restricciones_alimentarias: profile?.restricciones_alimentarias || null,
        nombre_credencial: profile?.nombre_credencial || null,
        cargo_interno: profile?.cargo_interno || null,
        notas: staff.notas,
        created_at: staff.created_at,
      });
    }
  }

  const csv = `\uFEFF${buildCsv(allRows)}`;

  const filename = `operativo-${operativoId}-participantes.csv`;

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
