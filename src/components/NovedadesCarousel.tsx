// src/components/NovedadesCarousel.tsx
"use client";
import Link from "next/link";

type Item = {
  id: string;
  titulo: string;
  slug: string;
  bajada: string | null;
  imagen_portada_url: string | null;
  imagenes?: Array<{ url: string }>;
};

export default function NovedadesCarousel({ items }: { items: Item[] }) {
  if (!items?.length) return <div className="text-sm text-gray-500">Pronto tendremos novedades.</div>;

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((n) => {
        const portada = n.imagen_portada_url || n.imagenes?.[0]?.url || "/placeholder.png";
        return (
          <Link key={n.id} href={`/novedades/${n.slug}`} className="group rounded-2xl border bg-white overflow-hidden hover:shadow">
            <div className="aspect-video bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={portada} alt={n.titulo} className="w-full h-full object-cover group-hover:opacity-95" />
            </div>
          <div className="p-4 space-y-2">
            <h3 className="font-semibold leading-tight line-clamp-2">{n.titulo}</h3>
            {n.bajada ? <p className="text-sm text-gray-600 line-clamp-2">{n.bajada}</p> : null}
            <span className="text-sm link-brand">Ver más →</span>
          </div>
          </Link>
        );
      })}
    </div>
  );
}
