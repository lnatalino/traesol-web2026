import Link from "next/link";

import type { PublicNovedadListItem } from "@/lib/novedades";

export default function Novedades({ items }: { items: PublicNovedadListItem[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="text-sm text-gray-500 border rounded-xl p-6">
        Aún no hay novedades publicadas.
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((n) => {
        const href = n.link_externo || (n.slug ? `/novedades/${n.slug}` : "#");
        const portada = n.imagen_portada_url || n.imagenes?.[0]?.url || "/placeholder.png";
        return (
          <article
            key={String(n.id)}
            className="rounded-2xl overflow-hidden border bg-white shadow-sm hover:shadow-md transition-shadow"
          >
            <Link href={href}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={portada}
                alt={n.titulo || "Novedad"}
                className="w-full h-40 object-cover"
              />
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-lg leading-snug">
                  {n.titulo || "Novedad"}
                </h3>
                {n.bajada ? (
                  <p className="text-sm text-gray-600 line-clamp-3">{n.bajada}</p>
                ) : null}
                {n.fecha_publicacion ? (
                  <p className="text-xs text-gray-400">
                    {new Date(n.fecha_publicacion).toLocaleDateString("es-CL")}
                  </p>
                ) : null}
              </div>
            </Link>
          </article>
        );
      })}
    </div>
  );
}
