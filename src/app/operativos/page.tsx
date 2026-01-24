import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { 
  PublicHero, 
  OperativoCard, 
  EmptyState,
  PrimaryButtonLink 
} from "@/components/public";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { isOperativoParaPublico, getNowInChile, toChileDateString, type OperativoState } from "@/lib/operativosShared";

export const dynamic = "force-dynamic";

export const metadata = { title: "Operativos · Traesol" };

type OperativoRow = {
  id: string;
  slug: string;
  titulo: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  lugar: string | null;
  estado: string | null;
  imagen_cabecera_url: string | null;
};

type OperativoImagenRow = {
  url: string | null;
  path: string | null;
};

type PublicOperativoRow = OperativoRow & {
  operativo_imagenes?: Array<Pick<OperativoImagenRow, "url" | "path">>;
  isQuirurgico?: boolean;
};

async function fetchOperativos(): Promise<PublicOperativoRow[]> {
  const supabase = createSupabaseServer();
  const hoy = toChileDateString();
  
  try {
    // Query: publicados con fecha_inicio >= hoy, ordenados por fecha ASC
    const { data, error } = await supabase
      .from("operativos")
      .select("id,titulo,slug,fecha_inicio,fecha_fin,lugar,estado,imagen_cabecera_url,operativo_imagenes(url,path)")
      .eq("estado", "publicado")
      .gte("fecha_inicio", hoy)
      .order("fecha_inicio", { ascending: true })
      .returns<PublicOperativoRow[]>();

    if (error) {
      throw error;
    }

    // Filtrar adicionalmente con lógica JS para asegurar coherencia
    const now = getNowInChile();
    const regularOps = (data ?? [])
      .filter((op) => isOperativoParaPublico(op as OperativoState, now))
      .map(op => ({ ...op, isQuirurgico: false }));
    
    return regularOps;
  } catch (err) {
    console.error("[operativos] list error", err);
    return [];
  }
}

async function fetchOperativosQuirurgicos(): Promise<PublicOperativoRow[]> {
  const supabase = createSupabaseServer();
  const hoy = toChileDateString();
  
  try {
    // Query operativos quirurgicos publicados
    const { data, error } = await supabase
      .from("operativos_quirurgicos")
      .select("id,titulo,slug,fecha_inicio,fecha_fin,lugar,estado,imagen_cabecera_url")
      .eq("publicado", true)
      .gte("fecha_inicio", hoy)
      .order("fecha_inicio", { ascending: true });

    if (error) {
      // La tabla puede no existir aún, ignorar el error
      console.warn("[operativos] quirurgico list error (may not exist yet):", error.message);
      return [];
    }

    return (data ?? []).map((op: {
      id: string;
      titulo: string;
      slug: string;
      fecha_inicio: string | null;
      fecha_fin?: string | null;
      lugar: string | null;
      estado: string;
      imagen_cabecera_url: string | null;
    }) => ({
      id: op.id,
      slug: op.slug,
      titulo: op.titulo,
      fecha_inicio: op.fecha_inicio,
      fecha_fin: op.fecha_fin || null,
      lugar: op.lugar,
      estado: op.estado,
      imagen_cabecera_url: op.imagen_cabecera_url,
      isQuirurgico: true,
    }));
  } catch (err) {
    console.error("[operativos] quirurgico list error", err);
    return [];
  }
}

export default async function OperativosPage() {
  // Cargar ambos tipos de operativos en paralelo
  const [regularOps, quirurgicosOps] = await Promise.all([
    fetchOperativos(),
    fetchOperativosQuirurgicos(),
  ]);
  
  // Combinar y ordenar por fecha
  const ops = [...regularOps, ...quirurgicosOps].sort((a, b) => {
    const dateA = a.fecha_inicio ? new Date(a.fecha_inicio).getTime() : 0;
    const dateB = b.fecha_inicio ? new Date(b.fecha_inicio).getTime() : 0;
    return dateA - dateB;
  });

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <PublicHero
        eyebrow="Operativos"
        title="Próximos operativos"
        subtitle="Conoce las fechas y territorios donde estaremos presentes. Cada operativo es una oportunidad para acercar salud a quienes más lo necesitan."
      />

      {/* Grid de operativos */}
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-12 lg:px-6">
        {ops.length === 0 ? (
          <EmptyState
            icon={Stethoscope}
            title="Próximamente nuevos operativos"
            message="Estamos preparando nuevos operativos médicos. Mantente atento a nuestras redes sociales."
            action={
              <PrimaryButtonLink href="/postular">
                Postúlate como voluntario
              </PrimaryButtonLink>
            }
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {ops.map((op) => {
              const portada =
                op.imagen_cabecera_url || op.operativo_imagenes?.[0]?.url || "";
              return (
                <OperativoCard
                  key={op.id}
                  slug={op.slug}
                  titulo={op.titulo || "Operativo Traesol"}
                  fecha_inicio={op.fecha_inicio}
                  lugar={op.lugar}
                  imagen={portada}
                  showPostular={true}
                  isQuirurgico={op.isQuirurgico}
                />
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
