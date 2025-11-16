// src/app/novedades/page.tsx
import Link from "next/link";
import { getPublicNovedades, type PublicNovedadListItem } from "@/lib/novedades";

export const metadata = { title: "Novedades · Traesol" };

export default async function NovedadesPage() {
  const items = await getPublicNovedades();

  return (
    <main className="max-w-6xl mx-auto px-4 py-10 space-y-6">
      <h1 className="title">Novedades</h1>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((n: PublicNovedadListItem) => (
          <Link
            key={n.id}
            href={`/novedades/${n.slug}`}
            className="group overflow-hidden rounded-2xl border bg-white transition hover:shadow-md"
          >
            <div className="aspect-video bg-gray-100">
              <img
                src={n.imagen_portada_url || n.imagenes?.[0]?.url || "/placeholder.png"}
                alt={n.titulo || "Novedad"}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="line-clamp-2 font-semibold leading-tight text-slate-900">{n.titulo}</h3>
              {n.bajada ? <p className="mt-1 line-clamp-2 text-sm text-gray-600">{n.bajada}</p> : null}
              {n.fecha_publicacion ? (
                <p className="mt-2 text-xs text-slate-400">
                  {new Date(n.fecha_publicacion).toLocaleDateString("es-CL", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
