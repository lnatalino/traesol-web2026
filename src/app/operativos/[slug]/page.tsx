// src/app/operativos/[slug]/page.tsx
import Image from "next/image";
import { notFound } from "next/navigation";
import BackButton from "@/components/BackButton";
import { createSupabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

type Operativo = {
  id: string;
  titulo: string;
  slug: string;
  descripcion: string | null;
  fecha_inicio: string;   // ISO
  fecha_fin: string | null;
  lugar: string | null;
  direccion: string | null;
  cupos_total: number | null;
  estado: "borrador" | "publicado" | "cerrado" | "finalizado";
  imagen_cabecera_url: string | null;
  instagram_url: string | null;
  operativo_imagenes?: Array<{ id: string; url: string | null; path: string | null }>;
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

  const { data: op } = await supabase
    .from("operativos")
    .select("titulo")
    .eq("slug", (slug ?? "").trim().toLowerCase())
    .eq("estado", "publicado")
    .maybeSingle();

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
    .eq("estado", "publicado")
    .maybeSingle<Operativo>();

  if (error || !op) {
    return notFound();
  }

  const galeria = Array.isArray(op.operativo_imagenes)
    ? op.operativo_imagenes
        .filter((img) => typeof img?.url === "string" && img.url)
        .map((img) => ({ id: img.id, url: img.url as string }))
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
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 lg:px-6">
        <BackButton fallback="/" />

        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow">
          <div className="relative h-60 w-full bg-slate-200 md:h-80">
            <Image src={imageSrc} alt={op.titulo} fill className="object-cover" unoptimized priority />
          </div>
          <div className="space-y-5 p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Operativo Traesol</p>
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">{op.titulo}</h1>
            <div className="flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">{rangoFechas}</span>
              {op.lugar && <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">{op.lugar}</span>}
              {op.direccion && (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1">{op.direccion}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center rounded-2xl bg-slate-900/5 px-4 py-1.5 text-xs font-semibold text-slate-800">
                Estado: {op.estado}
              </span>
              {typeof op.cupos_total === "number" && (
                <span className="inline-flex items-center rounded-2xl bg-slate-900/5 px-4 py-1.5 text-xs font-semibold text-slate-800">
                  Cupos: {op.cupos_total}
                </span>
              )}
              {op.instagram_url && (
                <a
                  className="inline-flex items-center rounded-2xl bg-white px-4 py-1.5 text-xs font-semibold text-blue-600 ring-1 ring-blue-100 transition hover:bg-blue-50"
                  href={op.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver en Instagram
                </a>
              )}
            </div>
            {op.descripcion && <p className="text-base text-slate-600">{op.descripcion}</p>}
          </div>
        </div>

        {galeria.length ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold text-slate-900">Galería</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {galeria.map((img, index) => (
                <figure key={img.id} className="overflow-hidden rounded-2xl border bg-slate-50">
                  <img
                    src={img.url}
                    alt={`Imagen ${index + 1} del operativo ${op.titulo}`}
                    className="h-full w-full object-cover"
                  />
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-3xl border border-blue-100 bg-blue-50/70 p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold text-slate-900">¿Quieres participar?</h2>
          <p className="mt-2 text-sm text-slate-600">
            Postula para sumarte a este operativo o vuelve al inicio para conocer más iniciativas de Traesol.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={`/postular?operativo=${encodeURIComponent(op.slug)}`}
              className="inline-flex items-center rounded-2xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
            >
              Postular aquí
            </a>
            <a
              href="/"
              className="inline-flex items-center rounded-2xl border border-blue-200 px-5 py-2 text-sm font-semibold text-blue-700 hover:bg-white"
            >
              Volver al inicio
            </a>
          </div>
          <p className="mt-3 text-xs text-blue-700/70">* La postulación requiere aprobación manual.</p>
        </section>
      </div>
    </main>
  );
}
