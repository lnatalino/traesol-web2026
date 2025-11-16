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

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <BackButton fallback="/" />

      <div className="relative h-56 md:h-72 rounded-2xl overflow-hidden border shadow">
        <Image
          src={imageSrc}
          alt={op.titulo}
          fill
          className="object-cover"
          unoptimized
          priority
        />
      </div>

      <header className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold">{op.titulo}</h1>
        <p className="text-gray-600">
          {fDate(op.fecha_inicio)}
          {op.fecha_fin ? ` — ${fDate(op.fecha_fin)}` : ""} {op.lugar ? `· ${op.lugar}` : ""}
        </p>
        {op.direccion && <p className="text-gray-500 text-sm">{op.direccion}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs border">
            Estado: {op.estado}
          </span>
          {typeof op.cupos_total === "number" && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs border">
              Cupos: {op.cupos_total}
            </span>
          )}
          {op.instagram_url && (
            <a
              className="inline-flex items-center px-3 py-1 rounded-full text-xs border hover:bg-gray-50"
              href={op.instagram_url}
              target="_blank"
              rel="noreferrer"
            >
              Ver en Instagram
            </a>
          )}
        </div>
      </header>

      {op.descripcion && (
        <section className="prose max-w-none">
          <p>{op.descripcion}</p>
        </section>
      )}

      {galeria.length ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Galería</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {galeria.map((img, index) => (
              <figure key={img.id} className="overflow-hidden rounded-xl border bg-white">
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

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">¿Quieres participar?</h2>
        <div className="flex gap-3">
          <a
            href={`/postular?operativo=${encodeURIComponent(op.slug)}`}
            className="px-4 py-2 rounded-xl border shadow hover:shadow-md transition"
          >
            Postular aquí
          </a>
          <a
            href="/"
            className="px-4 py-2 rounded-xl border hover:bg-gray-50 transition"
          >
            Volver al inicio
          </a>
        </div>
        <p className="text-xs text-gray-500">
          * La postulación requiere aprobación manual.
        </p>
      </section>
    </main>
  );
}
