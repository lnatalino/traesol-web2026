// src/app/operativos/[slug]/page.tsx
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, MapPin } from "lucide-react";
import BackButton from "@/components/BackButton";
import PostularButtons from "@/components/PostularButtons";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { 
  getComputedEstado, 
  isOperativoParaPublico, 
  getNowInChile,
  type OperativoState 
} from "@/lib/operativosShared";

export const dynamic = "force-dynamic";

type OperativoRow = {
  id: string;
  slug: string;
  titulo: string | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  lugar: string | null;
  direccion: string | null;
  descripcion: string | null;
  cupos_total: number | null;
  imagen_cabecera_url: string | null;
  estado: string | null;
  instagram_url: string | null;
  whatsapp_grupo_url: string | null;
  created_at: string;
};

type OperativoImagenRow = {
  id: string;
  operativo_id: string;
  url: string | null;
  path: string | null;
};

type Operativo = OperativoRow & {
  operativo_imagenes?: Array<Pick<OperativoImagenRow, "id" | "url" | "path">>;
};

function fDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleDateString();
}

/** Título dinámico: OJO que en Next 16 params es Promise y hay que await. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = createSupabaseServer();

  const { data: op, error } = await supabase
    .from("operativos")
    .select("titulo")
    .eq("slug", (slug ?? "").trim().toLowerCase())
    .eq("estado", "publicado")
    .maybeSingle<Pick<OperativoRow, "titulo">>();

  if (error) {
    console.error("[operativos] metadata error", error, { slug });
  }

  const title = op?.titulo ? `${op.titulo} · Operativo Traesol` : "Operativo · Traesol";
  return { title, robots: { index: true, follow: true } };
}

export default async function OperativoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // ✅ Next 16: params es Promise
  const { slug } = await params;
  const niceSlug = (slug ?? "").trim().toLowerCase();
  if (!niceSlug) return notFound();

  const supabase = createSupabaseServer();

  const { data: op, error } = await supabase
    .from("operativos")
    .select(
      "id,titulo,slug,descripcion,fecha_inicio,fecha_fin,lugar,direccion,cupos_total,estado,imagen_cabecera_url,instagram_url,operativo_imagenes(id,url,path)"
    )
    .eq("slug", niceSlug)
    .maybeSingle<Operativo>();

  if (error) {
    console.error("[operativos] detail error", error, { slug: niceSlug });
  }

  if (!op) {
    return notFound();
  }

  // Verificar que el operativo es válido para mostrar en público
  const now = getNowInChile();
  const computedEstado = getComputedEstado(op as OperativoState, now);
  const puedePostular = isOperativoParaPublico(op as OperativoState, now);
  
  // Si no es publicado, no mostrar (404)
  if (computedEstado !== "publicado") {
    return notFound();
  }

  const galeria = Array.isArray(op.operativo_imagenes)
    ? op.operativo_imagenes
        .filter((img) => typeof img?.url === "string" && !!img.url)
        .map((img) => ({ id: img.id, url: String(img.url) }))
    : [];

  const portadaFallback = galeria[0]?.url;
  const imageSrc =
    op.imagen_cabecera_url && op.imagen_cabecera_url.trim() !== ""
      ? op.imagen_cabecera_url
      : portadaFallback || "https://placehold.co/1200x400?text=Operativo+Traesol";
  const fechaInicio = fDate(op.fecha_inicio) ?? "Fecha por definir";
  const fechaFin = op.fecha_fin ? fDate(op.fecha_fin) : null;
  const rangoFechas = fechaFin ? `${fechaInicio} — ${fechaFin}` : fechaInicio;

  return (
    <main className="bg-slate-50">
      <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8 px-5 py-8 sm:py-12 lg:px-6">
        <BackButton fallback="/" />

        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div className="relative h-48 w-full bg-slate-200 sm:h-60 md:h-80">
            <Image src={imageSrc} alt={op.titulo || "Operativo Traesol"} fill className="object-cover" unoptimized priority />
          </div>
          <div className="space-y-4 sm:space-y-5 p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Operativo Traesol</p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{op.titulo}</h1>
            <div className="flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                <Calendar className="h-3.5 w-3.5 text-blue-500" />
                {rangoFechas}
              </span>
              {op.lugar && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                  <MapPin className="h-3.5 w-3.5 text-blue-500" />
                  {op.lugar}
                </span>
              )}
              {op.direccion && (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">{op.direccion}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <span className="inline-flex items-center rounded-xl bg-slate-900/5 px-3.5 py-1.5 text-xs font-semibold text-slate-800">
                Estado: {op.estado}
              </span>
              {typeof op.cupos_total === "number" && (
                <span className="inline-flex items-center rounded-xl bg-slate-900/5 px-3.5 py-1.5 text-xs font-semibold text-slate-800">
                  Cupos: {op.cupos_total}
                </span>
              )}
              {op.instagram_url && (
                <a
                  className="inline-flex items-center rounded-xl bg-white px-3.5 py-1.5 text-xs font-semibold text-blue-600 ring-1 ring-blue-100 transition hover:bg-blue-50"
                  href={op.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver en Instagram
                </a>
              )}
            </div>
            {op.descripcion && <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{op.descripcion}</p>}
          </div>
        </div>

        {galeria.length ? (
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">Galería</h2>
            <div className="mt-4 sm:mt-5 grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-2">
              {galeria.map((img, index) => (
                <figure key={img.id} className="overflow-hidden rounded-xl sm:rounded-2xl border border-slate-200/80 bg-slate-50 hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.08)] transition-shadow duration-300">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={`Imagen ${index + 1} del operativo ${op.titulo}`}
                    className="h-full w-full object-cover aspect-[4/3]"
                  />
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-blue-200/80 bg-blue-50/70 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-8">
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">¿Quieres participar?</h2>
          <PostularButtons
            operativoId={op.id}
            operativoSlug={op.slug}
            operativoTitulo={op.titulo || "Operativo Traesol"}
            puedePostular={puedePostular}
          />
        </section>
      </div>
    </main>
  );
}
