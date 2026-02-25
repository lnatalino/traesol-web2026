// src/app/novedades/[slug]/page.tsx
import { notFound } from "next/navigation";
import BackButton from "@/components/BackButton";
import {
  getPublicNovedadBySlug,
  type PublicNovedadDetail,
} from "@/lib/novedades";

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const novedad = await getPublicNovedadBySlug(slug);

  if (!novedad) {
    return { title: "Novedad no encontrada · Traesol" };
  }

  const title = novedad.titulo ? `${novedad.titulo} · Traesol` : "Novedad · Traesol";

  return {
    title,
    description: novedad.bajada ?? undefined,
  };
}

export default async function NovedadDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const novedad = await getPublicNovedadBySlug(slug);

  if (!novedad) {
    notFound();
  }

  const n = novedad as PublicNovedadDetail;
  const publishedLabel = formatDate(n.fecha_publicacion);
  const portada = n.imagen_portada_url || n.imagenes?.[0]?.url || "/placeholder.png";

  return (
    <main className="container py-12 space-y-8">
      <BackButton fallback="/novedades" />
      <header className="space-y-3">
        <h1 className="title font-bold tracking-tight">{n.titulo}</h1>
        {n.bajada ? <p className="subtitle leading-relaxed">{n.bajada}</p> : null}
        {publishedLabel ? (
          <p className="text-sm text-slate-500">Publicado el {publishedLabel}</p>
        ) : null}
      </header>

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <img
          src={portada}
          alt={n.titulo || "Novedad"}
          className="h-full w-full object-cover"
        />
      </div>

      {n.cuerpo ? (
        <article className="prose max-w-none">
          <div dangerouslySetInnerHTML={{ __html: n.cuerpo }} />
        </article>
      ) : null}

      {n.imagenes?.length ? (
        <section className="space-y-3">
          <h2 className="text-lg font-bold tracking-tight">Galería</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {n.imagenes.map((img, index) => (
              <figure
                key={img.id}
                className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_16px_-4px_rgba(0,0,0,0.08)] transition-shadow duration-300"
              >
                <img
                  src={img.url}
                  alt={`Imagen ${index + 1} de ${n.titulo ?? "novedad"}`}
                  className="h-full w-full object-cover"
                />
              </figure>
            ))}
          </div>
        </section>
      ) : null}

      {n.link_externo ? (
        <a
          href={n.link_externo}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary inline-flex items-center"
        >
          Ver publicación relacionada
        </a>
      ) : null}
    </main>
  );
}
